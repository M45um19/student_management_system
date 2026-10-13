import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { AwardGradeSchema, CursorPaginationMeta } from '@/features/marksheet/types';
import { calculateClassification } from '@/features/marksheet/utils/gradeCalculations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/grades
 * Staff queries institutional grades with search, module/programme filters,
 * publication status, classification filters, and UUIDv7 cursor pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Forbidden. Only Registry Staff can inspect grades.', 403);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const programmeId = searchParams.get('programmeId')?.trim() || '';
    const assessmentId = searchParams.get('assessmentId')?.trim() || '';
    const classification = searchParams.get('classification')?.trim() || '';
    const status = searchParams.get('status')?.trim().toLowerCase() || 'all';
    const cursor = searchParams.get('cursor')?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    // Pre-calculate institutional KPIs
    const [
      totalGradesCount,
      publishedCount,
      gradesAvg,
      distinctionCount,
      meritCount,
      passCount,
      failCount,
      totalStudentsCount,
      totalAssessmentsCount,
    ] = await Promise.all([
      prisma.grade.count(),
      prisma.grade.count({ where: { isPublished: true } }),
      prisma.grade.aggregate({ _avg: { numericGrade: true } }),
      prisma.grade.count({ where: { classification: 'Distinction' } }),
      prisma.grade.count({ where: { classification: 'Merit' } }),
      prisma.grade.count({ where: { classification: 'Pass' } }),
      prisma.grade.count({ where: { classification: 'Fail' } }),
      prisma.student.count({ where: { status: 'ENROLLED' } }),
      prisma.assessment.count({ where: { isActive: true } }),
    ]);

    const draftCount = Math.max(0, totalGradesCount - publishedCount);
    const overallAverage = gradesAvg._avg.numericGrade
      ? Math.round(gradesAvg._avg.numericGrade * 10) / 10
      : 0;
    const distinctionMeritRate =
      totalGradesCount > 0
        ? Math.round(((distinctionCount + meritCount) / totalGradesCount) * 100)
        : 0;
    const publishedRate =
      totalGradesCount > 0
        ? Math.round((publishedCount / totalGradesCount) * 100)
        : 0;

    const stats = {
      totalGradesAwarded: totalGradesCount,
      overallAverage,
      distinctionMeritRate,
      publishedRate,
      publishedCount,
      draftCount,
      passCount,
      failCount,
      totalStudents: totalStudentsCount,
      totalAssessments: totalAssessmentsCount,
    };

    // Build filter whereClause
    const whereClause: Prisma.GradeWhereInput = {
      ...(status === 'published'
        ? { isPublished: true }
        : status === 'draft'
        ? { isPublished: false }
        : {}),
      ...(classification
        ? { classification: { equals: classification, mode: 'insensitive' } }
        : {}),
      ...(assessmentId ? { assessmentId } : {}),
      ...(programmeId ? { assessment: { programmeId } } : {}),
      ...(search
        ? {
            OR: [
              { student: { fullName: { contains: search, mode: 'insensitive' } } },
              { student: { studentId: { contains: search, mode: 'insensitive' } } },
              { student: { email: { contains: search, mode: 'insensitive' } } },
              { assessment: { title: { contains: search, mode: 'insensitive' } } },
              { assessment: { module: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const totalCount = await prisma.grade.count({ where: whereClause });

    const includeRelations = {
      student: {
        select: {
          id: true,
          studentId: true,
          fullName: true,
          email: true,
          academicYear: true,
          status: true,
          programme: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
      assessment: {
        select: {
          id: true,
          title: true,
          module: true,
          deadline: true,
          programmeId: true,
          isActive: true,
          programme: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
      submission: {
        select: {
          id: true,
          assessmentId: true,
          studentId: true,
          fileUrl: true,
          fileName: true,
          submittedAt: true,
          isLate: true,
        },
      },
      gradedBy: {
        select: {
          id: true,
          staffId: true,
          fullName: true,
        },
      },
    };

    type GradeWithRelations = Prisma.GradeGetPayload<{
      include: typeof includeRelations;
    }>;

    let rawGrades: Array<GradeWithRelations>;

    if (cursor) {
      try {
        rawGrades = await prisma.grade.findMany({
          where: whereClause,
          take: limit + 1,
          skip: 1,
          cursor: { id: cursor },
          orderBy: { id: 'desc' },
          include: includeRelations,
        });
      } catch (err: unknown) {
        const prismaErr = err as { code?: string };
        if (prismaErr.code === 'P2025') {
          rawGrades = await prisma.grade.findMany({
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
      rawGrades = await prisma.grade.findMany({
        where: whereClause,
        take: limit + 1,
        skip: page > 1 ? (page - 1) * limit : 0,
        orderBy: { id: 'desc' },
        include: includeRelations,
      });
    }

    const hasNextPage = rawGrades.length > limit;
    const gradesData = hasNextPage ? rawGrades.slice(0, limit) : rawGrades;
    const nextCursor = hasNextPage ? gradesData[gradesData.length - 1]?.id ?? null : null;
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

    return apiSuccess(
      gradesData,
      'Institutional grades retrieved successfully.',
      {
        pagination: paginationMeta,
        stats,
      }
    );
  } catch (error) {
    console.error('[API_GET_GRADES_ERROR]', error);
    return apiError('Failed to retrieve grades.', 500);
  }
}

/**
 * POST /api/grades
 * Staff records or updates a numeric grade (0-100) per student per assessment.
 * Automatically computes UK university classification:
 *   Distinction: >= 70, Merit: 60-69, Pass: 40-59, Fail: < 40.
 * Automatically links to the student's submission record if present.
 */
export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Forbidden. Only Registry Staff can award grades.', 403);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError('Missing request body.', 400);
    }

    const parsed = AwardGradeSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid grade payload.';
      return apiError(errorMsg, 400);
    }

    const { assessmentId, studentId, numericGrade, isPublished } = parsed.data;

    // Verify assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { programme: true },
    });

    if (!assessment) {
      return apiError('Assessment deliverable not found.', 404);
    }

    // Verify student exists and is enrolled in this assessment's programme
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return apiError('Student record not found.', 404);
    }

    if (student.programmeId !== assessment.programmeId) {
      return apiError(
        `Student is enrolled in a different degree programme than this assessment.`,
        400
      );
    }

    // Automatically compute UK degree classification
    const classification = calculateClassification(numericGrade);

    // Look for existing coursework submission to link submissionId
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assessmentId_studentId: {
          assessmentId,
          studentId,
        },
      },
    });

    const publishedAt = isPublished ? new Date() : null;

    // Upsert Grade record atomically
    const grade = await prisma.grade.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId,
          studentId,
        },
      },
      update: {
        numericGrade,
        classification,
        submissionId: existingSubmission ? existingSubmission.id : undefined,
        gradedById: staff.staffProfileId || undefined,
        isPublished: isPublished ?? false,
        publishedAt: isPublished ? (publishedAt || new Date()) : null,
      },
      create: {
        assessmentId,
        studentId,
        numericGrade,
        classification,
        submissionId: existingSubmission ? existingSubmission.id : undefined,
        gradedById: staff.staffProfileId || undefined,
        isPublished: isPublished ?? false,
        publishedAt: isPublished ? new Date() : null,
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
        submission: {
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            submittedAt: true,
            isLate: true,
          },
        },
        gradedBy: {
          select: {
            id: true,
            staffId: true,
            fullName: true,
          },
        },
      },
    });

    const actionText = isPublished ? 'awarded and published' : 'recorded as draft';
    return apiSuccess(
      grade,
      `Grade of ${numericGrade}/100 (${classification}) successfully ${actionText} for ${student.fullName}.`,
      undefined,
      200
    );
  } catch (error) {
    console.error('[API_POST_GRADE_ERROR]', error);
    return apiError('Failed to record student grade.', 500);
  }
}
