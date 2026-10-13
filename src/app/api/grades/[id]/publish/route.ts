import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/grades/[id]/publish
 * Staff toggles or explicitly sets publication status (isPublished: true | false).
 * When published, marksheet result becomes visible to the student.
 * When withheld/unpublished, marksheet result is strictly hidden.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Forbidden. Only Registry Staff can modify grade publication status.', 403);
    }

    const { id: gradeId } = await params;

    const existingGrade = await prisma.grade.findUnique({
      where: { id: gradeId },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
          },
        },
        assessment: {
          select: {
            id: true,
            title: true,
            module: true,
          },
        },
      },
    });

    if (!existingGrade) {
      return apiError('Grade record not found.', 404);
    }

    // Parse optional explicit state from body, fallback to toggling
    let targetPublishedState = !existingGrade.isPublished;
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body.isPublished === 'boolean') {
        targetPublishedState = body.isPublished;
      }
    } catch {
      // Body is optional; fallback to toggle
    }

    const updatedGrade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        isPublished: targetPublishedState,
        publishedAt: targetPublishedState ? new Date() : null,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            email: true,
          },
        },
        assessment: {
          select: {
            id: true,
            title: true,
            module: true,
            deadline: true,
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

    const statusMessage = targetPublishedState
      ? `Grade for ${existingGrade.student.fullName} has been published to their marksheet.`
      : `Grade for ${existingGrade.student.fullName} has been withheld from their marksheet.`;

    return apiSuccess(updatedGrade, statusMessage);
  } catch (error) {
    console.error('[API_PATCH_PUBLISH_GRADE_ERROR]', error);
    return apiError('Failed to update grade publication status.', 500);
  }
}
