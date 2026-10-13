import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import {
  StudentAssessmentGradeEntry,
  AssessmentGradesMetrics,
  CursorPaginationMeta,
} from '@/features/marksheet/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assessments/[id]/grades
 * Staff retrieves full grading roster and cohort metrics for a specific coursework assessment.
 * Shows every enrolled student, their submission status (if uploaded), and their awarded grade.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Forbidden. Only Registry Staff can inspect assessment grades.', 403);
    }

    const { id: assessmentId } = await params;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim().toLowerCase() || 'all';
    const classification = searchParams.get('classification')?.trim() || '';
    const cursor = searchParams.get('cursor')?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    // 1. Fetch Assessment with linked Programme
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
      },
    });

    if (!assessment) {
      return apiError('Assessment deliverable not found.', 404);
    }

    // 2. Pre-calculate global cohort grading metrics over the entire enrolled cohort
    const [
      totalEnrolled,
      totalSubmitted,
      allGrades,
    ] = await Promise.all([
      prisma.student.count({
        where: {
          programmeId: assessment.programmeId,
          status: 'ENROLLED',
        },
      }),
      prisma.submission.count({
        where: { assessmentId },
      }),
      prisma.grade.findMany({
        where: { assessmentId },
        select: {
          numericGrade: true,
          classification: true,
          isPublished: true,
        },
      }),
    ]);

    const totalGraded = allGrades.length;
    const pendingGrading = Math.max(0, totalEnrolled - totalGraded);
    const publishedCount = allGrades.filter((g) => g.isPublished).length;
    const draftCount = totalGraded - publishedCount;

    let distinction = 0;
    let merit = 0;
    let pass = 0;
    let fail = 0;
    let sumScore = 0;

    for (const g of allGrades) {
      sumScore += g.numericGrade;
      const c = g.classification.toLowerCase();
      if (c === 'distinction') distinction++;
      else if (c === 'merit') merit++;
      else if (c === 'pass') pass++;
      else fail++;
    }

    const averageScore =
      totalGraded > 0 ? Math.round((sumScore / totalGraded) * 10) / 10 : 0;
    const passCount = distinction + merit + pass;
    const passRate =
      totalGraded > 0 ? Math.round((passCount / totalGraded) * 100) : 0;

    const metrics: AssessmentGradesMetrics = {
      totalEnrolled,
      totalSubmitted,
      totalGraded,
      pendingGrading,
      publishedCount,
      draftCount,
      averageScore,
      passRate,
      classificationDistribution: {
        distinction,
        merit,
        pass,
        fail,
      },
    };

    // 3. Build whereClause for enrolled students
    const whereClause: Prisma.StudentWhereInput = {
      programmeId: assessment.programmeId,
      status: 'ENROLLED',
      ...(status === 'graded'
        ? { grades: { some: { assessmentId } } }
        : status === 'ungraded'
        ? { grades: { none: { assessmentId } } }
        : status === 'published'
        ? { grades: { some: { assessmentId, isPublished: true } } }
        : status === 'draft'
        ? { grades: { some: { assessmentId, isPublished: false } } }
        : {}),
      ...(classification && classification !== 'all'
        ? {
            grades: {
              some: {
                assessmentId,
                classification: { equals: classification, mode: 'insensitive' },
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { studentId: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const totalCount = await prisma.student.count({ where: whereClause });

    // 4. Query students with relations
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
      grades: {
        where: { assessmentId },
        include: {
          gradedBy: {
            select: {
              id: true,
              staffId: true,
              fullName: true,
            },
          },
        },
      },
    };

    type StudentWithSubmissionsAndGrades = Prisma.StudentGetPayload<{
      include: typeof includeRelations;
    }>;

    let rawStudents: Array<StudentWithSubmissionsAndGrades>;

    if (cursor) {
      try {
        rawStudents = await prisma.student.findMany({
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

    // 5. Transform into StudentAssessmentGradeEntry items
    const roster: StudentAssessmentGradeEntry[] = studentsData.map((student) => {
      const sub = student.submissions?.[0] || null;
      const gr = student.grades?.[0] || null;

      return {
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
            }
          : null,
        grade: gr
          ? {
              id: gr.id,
              assessmentId: gr.assessmentId,
              studentId: gr.studentId,
              submissionId: gr.submissionId,
              gradedById: gr.gradedById,
              numericGrade: gr.numericGrade,
              classification: gr.classification,
              isPublished: gr.isPublished,
              publishedAt: gr.publishedAt ? gr.publishedAt.toISOString() : null,
              createdAt: gr.createdAt.toISOString(),
              updatedAt: gr.updatedAt.toISOString(),
              gradedBy: gr.gradedBy,
            }
          : null,
        status: gr ? 'GRADED' : 'UNGRADED',
      };
    });

    return apiSuccess(roster, 'Assessment grades roster retrieved successfully.', {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        module: assessment.module,
        deadline: assessment.deadline.toISOString(),
        programmeId: assessment.programmeId,
        programme: assessment.programme,
        isActive: assessment.isActive,
      },
      metrics,
      pagination: paginationMeta,
    });
  } catch (error) {
    console.error('[API_GET_ASSESSMENT_GRADES_ERROR]', error);
    return apiError('Failed to retrieve assessment grades roster.', 500);
  }
}
