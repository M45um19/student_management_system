import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-guard';
import { createProgrammeSchema } from '@/features/enrolment/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/programmes
 * Lists all degree programmes with tuition fee schedules and enrolment counts.
 * Returns standard { success, message, data, meta }
 */
export async function GET() {
  try {
    const programmes = await prisma.programme.findMany({
      orderBy: { name: 'asc' },
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
      message: 'Academic programmes retrieved successfully',
      data: programmes,
      meta: {
        total: programmes.length,
      },
    });
  } catch (error) {
    console.error('[API_GET_PROGRAMMES_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch academic programmes.', data: null },
      { status: 500 }
    );
  }
}

/**
 * POST /api/programmes
 * Staff-only endpoint to configure a new degree programme and its baseline tuition fee.
 * Returns standard { success, message, data, meta }
 */
export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Staff privileges required.', data: null },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = createProgrammeSchema.safeParse(body);

    if (!validation.success) {
      const errorMsg = validation.error.issues[0]?.message || 'Invalid programme input data.';
      return NextResponse.json(
        { success: false, message: errorMsg, data: null },
        { status: 400 }
      );
    }

    const { code, name, tuitionFee } = validation.data;

    // Check if programme code already exists
    const existing = await prisma.programme.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Programme code '${code}' is already registered.`, data: null },
        { status: 409 }
      );
    }

    const newProgramme = await prisma.programme.create({
      data: {
        code: code.toUpperCase(),
        name,
        tuitionFee,
        createdById: staff.staffProfileId,
      },
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

    return NextResponse.json(
      {
        success: true,
        message: 'Programme successfully established.',
        data: newProgramme,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API_POST_PROGRAMMES_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'An internal error occurred while creating the programme.', data: null },
      { status: 500 }
    );
  }
}
