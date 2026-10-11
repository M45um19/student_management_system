import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { requireStudent } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { submitCourseworkJsonSchema } from '@/features/assessments/types';
import {
  isAllowedFileType,
  MAX_FILE_SIZE_BYTES,
} from '@/features/assessments/utils/assessmentCalculations';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/assessments/[id]/submit
 * Student submits coursework deliverables (.pdf, .docx, .doc).
 * Supports both multipart/form-data file uploads and JSON payload fallbacks.
 * Enforces single submission per student constraint with resubmission support.
 * Automatically flags submissions past deadline with isLate = true.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const studentUser = await requireStudent(req);
    if (!studentUser || !studentUser.studentProfileId) {
      return apiError('Forbidden. Only enrolled students can submit coursework.', 403);
    }

    const { id: assessmentId } = await params;

    // 1. Fetch assessment and check existence
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        programme: { select: { id: true, name: true, code: true } },
      },
    });

    if (!assessment) {
      return apiError('Assessment not found.', 404);
    }

    // 2. Fetch student profile and verify enrolment
    const student = await prisma.student.findUnique({
      where: { id: studentUser.studentProfileId },
      select: { id: true, studentId: true, fullName: true, programmeId: true, status: true },
    });

    if (!student) {
      return apiError('Enrolled student record could not be found.', 404);
    }

    if (student.status === 'WITHDRAWN') {
      return apiError('Withdrawn students are not eligible to submit coursework.', 403);
    }

    if (student.programmeId !== assessment.programmeId) {
      return apiError(
        `Access denied. You are enrolled in a different degree programme (${assessment.programme.code}).`,
        403
      );
    }

    // 3. Process Upload (multipart/form-data or JSON)
    const contentType = req.headers.get('content-type') || '';
    let fileName = '';
    let fileUrl = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file || typeof file === 'string') {
        return apiError('Please select a valid coursework file to submit.', 400);
      }

      if (!isAllowedFileType(file.name)) {
        return apiError('Invalid file type. Only PDF (.pdf) and Word documents (.docx, .doc) are permitted.', 400);
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return apiError('File size exceeds the 20MB limit. Please compress your document.', 400);
      }

      // Read file buffer and save to public/uploads directory
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${sanitizedName}`;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

      await mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, uniqueName);
      await writeFile(filePath, buffer);

      fileName = file.name;
      fileUrl = `/uploads/${uniqueName}`;
    } else {
      // JSON body fallback
      const body = await req.json();
      const validation = submitCourseworkJsonSchema.safeParse(body);
      if (!validation.success) {
        return apiError('Invalid submission payload. Please provide fileName and fileUrl.', 400);
      }
      fileName = validation.data.fileName;
      fileUrl = validation.data.fileUrl;

      if (!isAllowedFileType(fileName)) {
        return apiError('Invalid file type. Only PDF (.pdf) and Word documents (.docx, .doc) are permitted.', 400);
      }
    }

    // 4. Determine submission timing and late detection
    const submissionTime = new Date();
    const deadlineTime = new Date(assessment.deadline);
    const isLate = submissionTime.getTime() > deadlineTime.getTime();

    // 5. Upsert submission (one per student per assessment constraint)
    const submission = await prisma.submission.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId: assessment.id,
          studentId: student.id,
        },
      },
      create: {
        assessmentId: assessment.id,
        studentId: student.id,
        fileUrl,
        fileName,
        submittedAt: submissionTime,
        isLate,
      },
      update: {
        fileUrl,
        fileName,
        submittedAt: submissionTime,
        isLate,
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            module: true,
            deadline: true,
          },
        },
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    const statusMessage = isLate
      ? 'Coursework submitted past the deadline and recorded as LATE.'
      : 'Coursework submitted successfully on time.';

    return apiSuccess(
      {
        id: submission.id,
        assessmentId: submission.assessmentId,
        studentId: submission.studentId,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        submittedAt: submission.submittedAt.toISOString(),
        isLate: submission.isLate,
        assessment: {
          id: submission.assessment.id,
          title: submission.assessment.title,
          module: submission.assessment.module,
          deadline: submission.assessment.deadline.toISOString(),
        },
        student: submission.student,
      },
      statusMessage,
      { isLate, resubmission: true }
    );
  } catch (error) {
    console.error('[API_SUBMIT_COURSEWORK_ERROR]', error);
    return apiError('Failed to record coursework submission.', 500);
  }
}
