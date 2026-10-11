import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, requireStaff } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assessments/[id]
 * Retrieves individual assessment specifications and metrics.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return apiError('Unauthorized. Please log in.', 401);
    }

    const { id } = await params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        programme: {
          select: {
            id: true,
            code: true,
            name: true,
            tuitionFee: true,
            _count: {
              select: {
                students: {
                  where: { status: 'ENROLLED' },
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
      },
    });

    if (!assessment) {
      return apiError('Assessment not found.', 404);
    }

    // Role verification: Students can only view active coursework in their enrolled programme
    let mySubmission = null;
    let studentStatus: 'SUBMITTED' | 'LATE' | 'PENDING' | 'OVERDUE' | undefined = undefined;

    if (user.role === 'STUDENT') {
      if (!assessment.isActive) {
        return apiError('Assessment not found or is no longer active.', 404);
      }

      const student = await prisma.student.findUnique({
        where: { id: user.studentProfileId! },
        select: { id: true, programmeId: true },
      });

      if (!student || student.programmeId !== assessment.programmeId) {
        return apiError('Access denied. This coursework belongs to another programme.', 403);
      }

      const foundSub = assessment.submissions.find((s) => s.studentId === student.id);
      if (foundSub) {
        mySubmission = foundSub;
        studentStatus = foundSub.isLate ? 'LATE' : 'SUBMITTED';
      } else {
        studentStatus = new Date(assessment.deadline) < new Date() ? 'OVERDUE' : 'PENDING';
      }
    }

    const totalEnrolled = assessment.programme?._count?.students ?? 0;
    const totalSubmitted = assessment.submissions.length;
    const lateCount = assessment.submissions.filter((s) => s.isLate).length;
    const onTimeCount = totalSubmitted - lateCount;
    const missingCount = Math.max(0, totalEnrolled - totalSubmitted);
    const submissionRate =
      totalEnrolled > 0 ? Math.round((totalSubmitted / totalEnrolled) * 100) : 0;

    return apiSuccess({
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
    });
  } catch (error) {
    console.error('[API_GET_ASSESSMENT_DETAIL_ERROR]', error);
    return apiError('Failed to retrieve assessment details.', 500);
  }
}

/**
 * PATCH /api/assessments/[id]
 * Staff archives or restores an assessment (updates isActive: false | true).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Forbidden. Only Registry Staff can archive or restore assessments.', 403);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const targetIsActive = typeof body.isActive === 'boolean' ? body.isActive : false;

    const existing = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiError('Assessment not found.', 404);
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: { isActive: targetIsActive },
      select: { id: true, isActive: true },
    });

    const actionText = updated.isActive ? 'restored' : 'archived';
    return apiSuccess(
      updated,
      `Assessment ${actionText} successfully.`
    );
  } catch (error) {
    console.error('[API_PATCH_ASSESSMENT_ARCHIVE_ERROR]', error);
    return apiError('Failed to update assessment archive status.', 500);
  }
}

/**
 * DELETE /api/assessments/[id]
 * Staff archives an assessment (soft delete by marking isActive: false).
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Forbidden. Only Registry Staff can archive assessments.', 403);
    }

    const { id } = await params;

    const existing = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiError('Assessment not found.', 404);
    }

    // Soft delete: marks assessment as inactive
    const archived = await prisma.assessment.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    return apiSuccess(archived, 'Assessment archived successfully.');
  } catch (error) {
    console.error('[API_DELETE_ASSESSMENT_ERROR]', error);
    return apiError('Failed to archive assessment.', 500);
  }
}
