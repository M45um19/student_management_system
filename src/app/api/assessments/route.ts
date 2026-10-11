import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSessionUser, requireStaff } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { createAssessmentSchema, CursorPaginationMeta } from '@/features/assessments/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assessments
 * Lists assessments with programme filtering, search, and role-aware submission context.
 * High-performance O(1) UUIDv7 cursor-based pagination seek.
 * - Staff: Views active assessments by default (or archived assessments when requested).
 * - Students: Scoped automatically to their enrolled programme with personal submission status (only active).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return apiError('Unauthorized. Please log in.', 401);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const programmeIdParam = searchParams.get('programmeId')?.trim() || '';
    const statusParam = searchParams.get('status')?.trim().toLowerCase() || 'all';
    const cursor = searchParams.get('cursor')?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const now = new Date();

    // 1. Role-based programme filtering
    let effectiveProgrammeId: string | undefined = undefined;
    let studentRecord: { id: string; programmeId: string } | null = null;

    if (user.role === 'STUDENT') {
      if (!user.studentProfileId) {
        return apiError('Student profile record not found.', 404);
      }
      studentRecord = await prisma.student.findUnique({
        where: { id: user.studentProfileId },
        select: { id: true, programmeId: true },
      });

      if (!studentRecord) {
        return apiError('Enrolled student record not found.', 404);
      }
      effectiveProgrammeId = studentRecord.programmeId;
    } else if (programmeIdParam) {
      effectiveProgrammeId = programmeIdParam;
    }

    // 2. Archive & active status filtering:
    // Students only ever see active assessments.
    // Staff sees active assessments for 'all', 'active', 'passed', and only sees archived assessments when status === 'archived'.
    const isArchivedFilter = user.role === 'STAFF' && statusParam === 'archived';
    const effectiveIsActive = isArchivedFilter ? false : true;

    // 3. Build where filter
    const whereClause: Prisma.AssessmentWhereInput = {
      isActive: effectiveIsActive,
      ...(effectiveProgrammeId ? { programmeId: effectiveProgrammeId } : {}),
      ...(statusParam === 'active'
        ? { deadline: { gt: now } }
        : statusParam === 'passed'
        ? { deadline: { lte: now } }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { module: { contains: search, mode: 'insensitive' } },
              { programme: { name: { contains: search, mode: 'insensitive' } } },
              { programme: { code: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    // 4. Total count for pagination
    const totalCount = await prisma.assessment.count({ where: whereClause });

    const includeRelations = {
      programme: {
        select: {
          id: true,
          code: true,
          name: true,
          tuitionFee: true,
          _count: {
            select: {
              students: {
                where: { status: 'ENROLLED' as const },
              },
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          fullName: true,
          staffId: true,
        },
      },
      submissions: {
        select: {
          id: true,
          studentId: true,
          fileName: true,
          fileUrl: true,
          submittedAt: true,
          isLate: true,
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
    } satisfies Prisma.AssessmentInclude;

    // 5. UUIDv7 Cursor-based seek: O(1) B-tree lookup on time-ordered primary key
    type RawAssessment = Prisma.AssessmentGetPayload<{ include: typeof includeRelations }>;
    let rawAssessments: RawAssessment[] = [];

    if (cursor) {
      try {
        rawAssessments = await prisma.assessment.findMany({
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
          rawAssessments = await prisma.assessment.findMany({
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
      rawAssessments = await prisma.assessment.findMany({
        where: whereClause,
        take: limit + 1,
        skip: page > 1 ? (page - 1) * limit : 0,
        orderBy: { id: 'desc' },
        include: includeRelations,
      });
    }

    const hasNextPage = rawAssessments.length > limit;
    const assessmentsData = hasNextPage ? rawAssessments.slice(0, limit) : rawAssessments;
    const nextCursor = hasNextPage ? assessmentsData[assessmentsData.length - 1]?.id ?? null : null;
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

    // 6. Transform assessment data for role view
    const transformedAssessments = assessmentsData.map((assessment) => {
      const totalEnrolled = assessment.programme?._count?.students ?? 0;
      const totalSubmitted = assessment.submissions.length;
      const lateCount = assessment.submissions.filter((s) => s.isLate).length;
      const onTimeCount = totalSubmitted - lateCount;
      const missingCount = Math.max(0, totalEnrolled - totalSubmitted);
      const submissionRate =
        totalEnrolled > 0 ? Math.round((totalSubmitted / totalEnrolled) * 100) : 0;

      let mySubmission = null;
      let studentStatus: 'SUBMITTED' | 'LATE' | 'PENDING' | 'OVERDUE' | undefined = undefined;

      if (user.role === 'STUDENT' && studentRecord) {
        const foundSub = assessment.submissions.find((s) => s.studentId === studentRecord?.id);
        if (foundSub) {
          mySubmission = foundSub;
          studentStatus = foundSub.isLate ? 'LATE' : 'SUBMITTED';
        } else {
          studentStatus = new Date(assessment.deadline) < now ? 'OVERDUE' : 'PENDING';
        }
      }

      return {
        id: assessment.id,
        title: assessment.title,
        module: assessment.module,
        deadline: assessment.deadline.toISOString(),
        programmeId: assessment.programmeId,
        programme: assessment.programme
          ? {
              id: assessment.programme.id,
              code: assessment.programme.code,
              name: assessment.programme.name,
              tuitionFee: assessment.programme.tuitionFee,
            }
          : undefined,
        createdById: assessment.createdById,
        createdBy: assessment.createdBy,
        isActive: assessment.isActive,
        createdAt: assessment.createdAt.toISOString(),
        updatedAt: assessment.updatedAt.toISOString(),
        _count: {
          submissions: totalSubmitted,
        },
        metrics: {
          totalEnrolled,
          totalSubmitted,
          onTimeCount,
          lateCount,
          missingCount,
          submissionRate,
        },
        mySubmission,
        studentStatus,
      };
    });

    // 7. Overall stats (for Staff dashboard)
    let stats = undefined;
    if (user.role === 'STAFF') {
      const [allAssessmentsCount, activeCount, archivedCount, allSubmissions, totalEnrolledStudents] =
        await Promise.all([
          prisma.assessment.count({ where: { isActive: true } }),
          prisma.assessment.count({ where: { isActive: true, deadline: { gt: now } } }),
          prisma.assessment.count({ where: { isActive: false } }),
          prisma.submission.findMany({ select: { isLate: true } }),
          prisma.student.count({ where: { status: 'ENROLLED' } }),
        ]);

      const totalSubmissions = allSubmissions.length;
      const lateSubmissions = allSubmissions.filter((s) => s.isLate).length;
      const onTimeSubmissions = totalSubmissions - lateSubmissions;

      stats = {
        totalAssessments: allAssessmentsCount,
        activeDeadlines: activeCount,
        archivedAssessments: archivedCount,
        totalSubmissions,
        lateSubmissions,
        onTimeSubmissions,
        totalEnrolledStudents,
      };
    }

    return apiSuccess(transformedAssessments, 'Assessments retrieved successfully', {
      pagination: paginationMeta,
      stats,
    });
  } catch (error) {
    console.error('[API_GET_ASSESSMENTS_ERROR]', error);
    return apiError('Failed to retrieve assessments.', 500);
  }
}

/**
 * POST /api/assessments
 * Staff creates a new assessment deliverable with a strict deadline.
 */
export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Forbidden. Only Registry Staff can create assessments.', 403);
    }

    const body = await req.json();
    const validation = createAssessmentSchema.safeParse(body);

    if (!validation.success) {
      const issue = validation.error.issues[0]?.message || 'Invalid assessment payload.';
      return apiError(issue, 400);
    }

    const { title, module, deadline, programmeId } = validation.data;

    // Verify programme exists
    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
    });

    if (!programme) {
      return apiError('The specified degree programme was not found.', 404);
    }

    const createdAssessment = await prisma.assessment.create({
      data: {
        title,
        module,
        deadline: new Date(deadline),
        programmeId,
        createdById: staff.staffProfileId,
        isActive: true,
      },
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

    return apiSuccess(
      {
        ...createdAssessment,
        deadline: createdAssessment.deadline.toISOString(),
        createdAt: createdAssessment.createdAt.toISOString(),
        updatedAt: createdAssessment.updatedAt.toISOString(),
        _count: { submissions: 0 },
      },
      'Assessment created successfully',
      undefined,
      201
    );
  } catch (error) {
    console.error('[API_POST_ASSESSMENT_ERROR]', error);
    return apiError('Failed to create assessment.', 500);
  }
}
