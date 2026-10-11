import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fees/overdue
 * Returns students with unpaid overdue balances for Registry alerts and fee reconciliation.
 * Computes institutional finance KPIs (total invoiced, collected, outstanding, and overdue counts).
 * Staff only.
 */
export async function GET(req: NextRequest) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Unauthorized. Registry Staff privileges required.', 403);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const programmeId = searchParams.get('programmeId')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || 'balance'; // 'balance' | 'name' | 'studentId'
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const cursor = searchParams.get('cursor')?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    // 1. Fetch all students with their programme tuition fee and payments
    const students = await prisma.student.findMany({
      where: {
        ...(programmeId ? { programmeId } : {}),
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
          },
        },
      },
    });

    let totalExpectedTuition = 0;
    let totalFeesCollected = 0;
    let totalOutstanding = 0;
    let totalOverdueStudents = 0;

    const overdueList: Array<{
      id: string;
      studentId: string;
      fullName: string;
      email: string;
      academicYear: string;
      status: string;
      programme: {
        id: string;
        code: string;
        name: string;
        tuitionFee: number;
      };
      tuitionFee: number;
      totalPaid: number;
      balance: number;
      paymentsCount: number;
      lastPaymentDate: Date | null;
      lastPaymentRef: string | null;
      urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    }> = [];

    for (const student of students) {
      const tuitionFee = student.programme?.tuitionFee ?? 0;
      const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, Math.round((tuitionFee - totalPaid) * 100) / 100);

      totalExpectedTuition += tuitionFee;
      totalFeesCollected += totalPaid;

      if (balance > 0) {
        totalOutstanding += balance;
        totalOverdueStudents++;

        // Filter search criteria if provided
        const matchesSearch =
          !search ||
          student.fullName.toLowerCase().includes(search) ||
          student.studentId.toLowerCase().includes(search) ||
          student.email.toLowerCase().includes(search);

        if (matchesSearch) {
          // Determine urgency level:
          // HIGH: zero payments made on full fee
          // MEDIUM: partial payment made, but >50% remains
          // LOW: <50% of fee remains
          let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
          if (totalPaid === 0) {
            urgency = 'HIGH';
          } else if (balance / tuitionFee > 0.5) {
            urgency = 'MEDIUM';
          } else {
            urgency = 'LOW';
          }

          const lastPayment = student.payments[0] || null;

          overdueList.push({
            id: student.id,
            studentId: student.studentId,
            fullName: student.fullName,
            email: student.email,
            academicYear: student.academicYear,
            status: student.status,
            programme: student.programme,
            tuitionFee,
            totalPaid,
            balance,
            paymentsCount: student.payments.length,
            lastPaymentDate: lastPayment ? lastPayment.paymentDate : null,
            lastPaymentRef: lastPayment ? lastPayment.referenceNo : null,
            urgency,
          });
        }
      }
    }

    // 2. Sort overdue list
    overdueList.sort((a, b) => {
      if (sortBy === 'balance') {
        return sortOrder === 'asc' ? a.balance - b.balance : b.balance - a.balance;
      }
      if (sortBy === 'name') {
        return sortOrder === 'asc'
          ? a.fullName.localeCompare(b.fullName)
          : b.fullName.localeCompare(a.fullName);
      }
      if (sortBy === 'studentId') {
        return sortOrder === 'asc'
          ? a.studentId.localeCompare(b.studentId)
          : b.studentId.localeCompare(a.studentId);
      }
      return b.balance - a.balance;
    });

    const collectionRate =
      totalExpectedTuition > 0
        ? Math.round((totalFeesCollected / totalExpectedTuition) * 1000) / 10
        : 100;

    const stats = {
      totalStudents: students.length,
      totalOverdueStudents,
      totalExpectedTuition: Math.round(totalExpectedTuition * 100) / 100,
      totalFeesCollected: Math.round(totalFeesCollected * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      collectionRate,
    };

    // 3. Slice overdue list using cursor seeking or offset
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = overdueList.findIndex((item) => item.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      } else {
        startIndex = page > 1 ? (page - 1) * limit : 0;
      }
    } else {
      startIndex = page > 1 ? (page - 1) * limit : 0;
    }

    const sliced = overdueList.slice(startIndex, startIndex + limit + 1);
    const hasNextPage = sliced.length > limit;
    const paginatedList = hasNextPage ? sliced.slice(0, limit) : sliced;
    const nextCursor = hasNextPage ? paginatedList[paginatedList.length - 1]?.id ?? null : null;
    const prevCursor = cursor || null;
    const hasPrevPage = Boolean(cursor) || page > 1;
    const totalPages = Math.ceil(overdueList.length / limit) || 1;

    return apiSuccess(
      paginatedList,
      `Retrieved ${paginatedList.length} students with overdue fee balances.`,
      {
        stats,
        totalCount: overdueList.length,
        pagination: {
          total: overdueList.length,
          page,
          limit,
          totalPages,
          cursor,
          nextCursor,
          prevCursor,
          hasNextPage,
          hasPrevPage,
        },
      }
    );
  } catch (error) {
    console.error('[API_GET_FEES_OVERDUE_ERROR]', error);
    return apiError('Failed to retrieve overdue fees report.', 500);
  }
}
