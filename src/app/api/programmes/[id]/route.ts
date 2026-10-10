import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-guard';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateProgrammeSchema = z.object({
  name: z.string().min(3).max(120).optional(),
  tuitionFee: z.number().min(0).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/programmes/[id]
 * Retrieves details for a specific degree programme.
 * Returns standard { success, message, data, meta }
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const programme = await prisma.programme.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            staffId: true,
          },
        },
        _count: {
          select: {
            students: true,
            assessments: true,
          },
        },
      },
    });

    if (!programme) {
      return NextResponse.json(
        { success: false, message: 'Programme not found.', data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Programme retrieved successfully',
      data: programme,
    });
  } catch (error) {
    console.error('[API_GET_PROGRAMME_BY_ID_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve programme.', data: null },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/programmes/[id]
 * Staff-only endpoint to update programme name or tuition fee.
 * Returns standard { success, message, data, meta }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Staff privileges required.', data: null },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateProgrammeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message || 'Invalid input data.', data: null },
        { status: 400 }
      );
    }

    const updated = await prisma.programme.update({
      where: { id },
      data: validation.data,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            staffId: true,
          },
        },
        _count: {
          select: {
            students: true,
            assessments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Programme updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('[API_PATCH_PROGRAMME_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update programme.', data: null },
      { status: 500 }
    );
  }
}
