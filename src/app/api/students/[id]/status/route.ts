import { NextRequest, NextResponse } from 'next/server';
import { EnrolmentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-guard';
import { updateStudentStatusSchema } from '@/features/enrolment/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/students/[id]/status
 * Staff-only endpoint to transition a student's enrolment lifecycle status.
 * Supports: ENROLLED, DEFERRED, WITHDRAWN, COMPLETED.
 * Preserves financial ledger and coursework records without cascading data loss.
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
    const validation = updateStudentStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.error.issues[0]?.message ||
            'Invalid status. Allowed values: ENROLLED, DEFERRED, WITHDRAWN, COMPLETED.',
          data: null,
        },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        programme: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student record not found.', data: null },
        { status: 404 }
      );
    }

    // Update status in database
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        status: status as EnrolmentStatus,
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
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const statusDisplay = status.charAt(0) + status.slice(1).toLowerCase();

    return NextResponse.json({
      success: true,
      message: `Enrolment status updated to '${statusDisplay}' for ${student.fullName} (${student.studentId}).`,
      data: updatedStudent,
    });
  } catch (error) {
    console.error('[API_PATCH_STUDENT_STATUS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update student enrolment status.', data: null },
      { status: 500 }
    );
  }
}
