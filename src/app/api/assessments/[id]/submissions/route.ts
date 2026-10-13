import { NextRequest } from 'next/server';
import { Prisma, EnrolmentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import {
  StudentAssessmentRosterEntry,
  CursorPaginationMeta,
} from '@/features/assessments/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assessments/[id]/submissions
 * Staff reviews cohort submission status, download links, timestamps, and late tags.
 * High-performance O(1) UUIDv7 cursor-based pagination seek.
 * Displays both submitted students and missing/unsubmitted students in the enrolled cohort.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Forbidden. Only Registry Staff can inspect class submissions.', 403);
    }

    const { id: assessmentId } = await params;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim().toLowerCase() || 'all';
    const cursor = searchParams.get('cursor')?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    // 1. Fetch assessment with programme details
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        programme: {
          select: {
            id: true,
            code: true,
            name: true,
            tuitionFee: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            staffId: true,
          },
        },
      },
    });

    if (!assessment) {
      return apiError('Assessment not found.', 404);
    }

    // 2. Pre-calculate global stats over entire cohort (avoids partial-page skew)
    const [totalEnrolled, totalSubmitted, lateCount] = await Promise.all([
      prisma.student.count({
        where: {
          programmeId: assessment.programmeId,
          status: 'ENROLLED',
        },
      }),
      prisma.submission.count({
        where: { assessmentId },
      }),
      prisma.submission.count({
        where: { assessmentId, isLate: true },
      }),
    ]);

    const onTimeCount = totalSubmitted - lateCount;
    const missingCount = Math.max(0, totalEnrolled - totalSubmitted);
    const submissionRate =
      totalEnrolled > 0 ? Math.round((totalSubmitted / totalEnrolled) * 100) : 0;

    // 3. Build whereClause for enrolled students
    const whereClause: Prisma.StudentWhereInput = {
      programmeId: assessment.programmeId,
      status: 'ENROLLED',
      ...(statusFilter === 'submitted'
        ? { submissions: { some: { assessmentId } } }
        : statusFilter === 'late'
        ? { submissions: { some: { assessmentId, isLate: true } } }
        : statusFilter === 'on_time'
        ? { submissions: { some: { assessmentId, isLate: false } } }
        : statusFilter === 'missing'
        ? { submissions: { none: { assessmentId } } }
        : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { studentId: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              {
                submissions: {
                  some: {
                    assessmentId,
                    fileName: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    // 4. Count total matching filtered students for pagination
    const totalCount = await prisma.student.count({ where: whereClause });

    // 5. Query relations
    const includeRelations = {
      programme: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      submissions: {
        where: { assessmentId },
        include: {
          grade: {
            select: {
              id: true,
              numericGrade: true,
              classification: true,
              isPublished: true,
              publishedAt: true,
            },
          },
        },
      },
    };

    // 6. UUIDv7 Cursor-based seek: O(1) B-tree lookup on time-ordered primary key
    let rawStudents: Array<{
      id: string;
      studentId: string;
      fullName: string;
      email: string;
      academicYear: string;
      status: EnrolmentStatus;
      programme: { id: string; code: string; name: string };
      submissions: Array<{
        id: string;
        assessmentId: string;
        studentId: string;
        fileUrl: string;
        fileName: string;
        submittedAt: Date;
        isLate: boolean;
        grade: {
          id: string;
          numericGrade: number;
          classification: string;
          isPublished: boolean;
          publishedAt: Date | null;
        } | null;
      }>;
    }> = [];

    if (cursor) {
      try {
        rawStudents = await prisma.student.findMany({
          where: whereClause,
          take: limit + 1,
          skip: 1, // Skip cursor anchor
          cursor: { id: cursor },
          orderBy: { id: 'desc' },
          include: includeRelations,
        });
      } catch (err: unknown) {
        const prismaErr = err as { code?: string };
        if (prismaErr.code === 'P2025') {
          // Cursor ID not found, fallback to initial page
          rawStudents = await prisma.student.findMany({
            where: whereClause,
            take: limit + 1,
            orderBy: { id: 'desc' },
            include: includeRelations,
          });
        } else {
          throw err;
        }
      }
    } else {
      rawStudents = await prisma.student.findMany({
        where: whereClause,
        take: limit + 1,
        skip: page > 1 ? (page - 1) * limit : 0,
        orderBy: { id: 'desc' },
        include: includeRelations,
      });
    }

    const hasNextPage = rawStudents.length > limit;
    const studentsData = hasNextPage ? rawStudents.slice(0, limit) : rawStudents;
    const nextCursor = hasNextPage ? studentsData[studentsData.length - 1]?.id ?? null : null;
    const prevCursor = cursor || null;
    const hasPrevPage = Boolean(cursor) || page > 1;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const paginationMeta: CursorPaginationMeta = {
      total: totalCount,
      page,
      limit,
      totalPages,
      cursor,
      nextCursor,
      prevCursor,
      hasNextPage,
      hasPrevPage,
    };

    // 7. Transform into roster entries
    const roster: StudentAssessmentRosterEntry[] = studentsData.map((student) => {
      const sub = student.submissions?.[0] || null;

      let status: 'ON_TIME' | 'LATE' | 'MISSING' = 'MISSING';
      if (sub) {
        status = sub.isLate ? 'LATE' : 'ON_TIME';
      }

      return {
        id: student.id,
        student: {
          id: student.id,
          studentId: student.studentId,
          fullName: student.fullName,
          email: student.email,
          academicYear: student.academicYear,
          status: student.status,
          programme: student.programme,
        },
        hasSubmitted: Boolean(sub),
        submission: sub
          ? {
              id: sub.id,
              assessmentId: sub.assessmentId,
              studentId: sub.studentId,
              fileUrl: sub.fileUrl,
              fileName: sub.fileName,
              submittedAt: sub.submittedAt.toISOString(),
              isLate: sub.isLate,
              grade: sub.grade
                ? {
                    id: sub.grade.id,
                    numericGrade: sub.grade.numericGrade,
                    classification: sub.grade.classification,
                    isPublished: sub.grade.isPublished,
                    publishedAt: sub.grade.publishedAt?.toISOString() || null,
                  }
                : null,
            }
          : null,
        isLate: sub?.isLate ?? false,
        submittedAt: sub ? sub.submittedAt.toISOString() : null,
        status,
      };
    });

    return apiSuccess(
      {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          module: assessment.module,
          deadline: assessment.deadline.toISOString(),
          programmeId: assessment.programmeId,
          programme: assessment.programme,
          createdById: assessment.createdById,
          createdBy: assessment.createdBy,
          createdAt: assessment.createdAt.toISOString(),
          updatedAt: assessment.updatedAt.toISOString(),
        },
        roster,
        stats: {
          totalEnrolled,
          totalSubmitted,
          onTimeCount,
          lateCount,
          missingCount,
          submissionRate,
        },
        pagination: paginationMeta,
      },
      'Class submissions retrieved successfully.',
      {
        pagination: paginationMeta,
      }
    );
  } catch (error) {
    console.error('[API_GET_ASSESSMENT_SUBMISSIONS_ERROR]', error);
    return apiError('Failed to retrieve assessment submissions.', 500);
  }
}
