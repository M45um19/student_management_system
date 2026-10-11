import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/students/[id]/fees
 * Returns programme tuition fee, payment transactions ledger, and real-time outstanding balance.
 * Accessible to Staff (any student) or Student (own profile only).
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return apiError('Unauthorized. Please log in.', 401);
    }

    const { id: paramId } = await params;

    // Resolve 'me' identifier for logged-in students
    const targetId = paramId === 'me' ? user.studentProfileId : paramId;

    if (!targetId) {
      return apiError('Student profile could not be identified.', 400);
    }

    // Role-based boundary: Students can only view their own ledger
    if (user.role === 'STUDENT' && user.studentProfileId !== targetId) {
      return apiError('Access denied. You can only inspect your own fee ledger.', 403);
    }

    // Lookup student by UUID or unique studentId (e.g., SMS-2025-0001)
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: targetId }, { studentId: targetId }],
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
        payments: {
          orderBy: { paymentDate: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            referenceNo: true,
            createdAt: true,
            recordedBy: {
              select: {
                id: true,
                fullName: true,
                staffId: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return apiError('Student record not found.', 404);
    }

    // Double-check student boundary if searched by studentId
    if (user.role === 'STUDENT' && user.studentProfileId !== student.id) {
      return apiError('Access denied. You can only inspect your own fee ledger.', 403);
    }

    const tuitionFee = student.programme?.tuitionFee ?? 0;
    const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, Math.round((tuitionFee - totalPaid) * 100) / 100);
    const isOverdue = balance > 0;
    const paymentStatus =
      balance === 0
        ? 'SETTLED'
        : totalPaid > 0
        ? 'PARTIAL'
        : 'UNPAID';

    const feeLedgerData = {
      student: {
        id: student.id,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        academicYear: student.academicYear,
        status: student.status,
      },
      programme: student.programme,
      tuitionFee,
      totalPaid,
      balance,
      isOverdue,
      paymentStatus,
      paymentsCount: student.payments.length,
      payments: student.payments,
    };

    return apiSuccess(
      feeLedgerData,
      `Fee ledger retrieved successfully for student ${student.studentId}.`
    );
  } catch (error) {
    console.error('[API_GET_STUDENT_FEES_ERROR]', error);
    return apiError('Failed to retrieve student fee ledger.', 500);
  }
}
