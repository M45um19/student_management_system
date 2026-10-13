import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import { BulkPublishGradesSchema } from '@/features/marksheet/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/grades/bulk-publish
 * Staff bulk publishes or withholds all awarded grades for an entire coursework assessment.
 */
export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Forbidden. Only Registry Staff can bulk publish marksheet grades.', 403);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError('Missing request body.', 400);
    }

    const parsed = BulkPublishGradesSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || 'Invalid bulk publish payload.';
      return apiError(errorMsg, 400);
    }

    const { assessmentId, isPublished } = parsed.data;

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return apiError('Assessment deliverable not found.', 404);
    }

    const result = await prisma.grade.updateMany({
      where: { assessmentId },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    const actionText = isPublished ? 'published to student marksheets' : 'withheld from student marksheets';
    return apiSuccess(
      {
        updatedCount: result.count,
        isPublished,
      },
      `${result.count} grades successfully ${actionText} for assessment "${assessment.title}".`
    );
  } catch (error) {
    console.error('[API_POST_BULK_PUBLISH_GRADES_ERROR]', error);
    return apiError('Failed to bulk update grade publication status.', 500);
  }
}
