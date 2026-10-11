import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSessionUser, requireStaff } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const recordPaymentSchema = z.object({
  studentId: z.string().min(1, 'Student ID or UUID is required'),
  amount: z
    .number({ message: 'Payment amount must be a number' })
    .positive('Payment amount must be greater than zero')
    .max(1000000, 'Payment amount cannot exceed £1,000,000'),
  paymentDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid payment date format'),
  referenceNo: z
    .string()
    .min(3, 'Reference number must be at least 3 characters')
    .max(50, 'Reference number cannot exceed 50 characters')
    .trim(),
});

/**
 * GET /api/payments
 * Lists institutional payment transactions with search, student filtering, and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return apiError('Unauthorized. Please log in.', 401);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const studentIdParam = searchParams.get('studentId')?.trim() || '';
    const cursor = searchParams.get('cursor')?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    // Student restriction: Can only see their own transactions
    let studentFilter: Prisma.PaymentWhereInput | undefined = undefined;
    if (user.role === 'STUDENT') {
      studentFilter = { studentId: user.studentProfileId };
    } else if (studentIdParam) {
      // Find whether studentIdParam is UUID or studentId code
      const matchedStudent = await prisma.student.findFirst({
        where: {
          OR: [{ id: studentIdParam }, { studentId: studentIdParam }],
        },
        select: { id: true },
      });
      if (matchedStudent) {
        studentFilter = { studentId: matchedStudent.id };
      } else {
        studentFilter = { studentId: studentIdParam };
      }
    }

    const whereClause: Prisma.PaymentWhereInput = {
      ...(studentFilter || {}),
      ...(search
        ? {
            OR: [
              { referenceNo: { contains: search, mode: 'insensitive' } },
              {
                student: {
                  OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { studentId: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const includeRelations = {
      student: {
        select: {
          id: true,
          studentId: true,
          fullName: true,
          email: true,
          programme: {
            select: {
              id: true,
              code: true,
              name: true,
              tuitionFee: true,
            },
          },
        },
      },
      recordedBy: {
        select: {
          id: true,
          staffId: true,
          fullName: true,
        },
      },
    };

    const [total, aggregateSum] = await Promise.all([
      prisma.payment.count({ where: whereClause }),
      prisma.payment.aggregate({
        where: whereClause,
        _sum: { amount: true },
      }),
    ]);

    let rawPayments: Array<{
      id: string;
      studentId: string;
      amount: number;
      paymentDate: Date;
      referenceNo: string;
      createdAt: Date;
      student: {
        id: string;
        studentId: string;
        fullName: string;
        email: string;
        programme: {
          id: string;
          code: string;
          name: string;
          tuitionFee: number;
        };
      };
      recordedBy: {
        id: string;
        staffId: string;
        fullName: string;
      } | null;
    }> = [];

    // UUIDv7 Cursor-based seek: O(1) B-tree lookup on time-ordered primary key
    if (cursor) {
      try {
        rawPayments = await prisma.payment.findMany({
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
          // Cursor ID not found, fallback to initial page
          rawPayments = await prisma.payment.findMany({
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
      rawPayments = await prisma.payment.findMany({
        where: whereClause,
        take: limit + 1,
        skip: page > 1 ? (page - 1) * limit : 0,
        orderBy: { id: 'desc' },
        include: includeRelations,
      });
    }

    const hasNextPage = rawPayments.length > limit;
    const payments = hasNextPage ? rawPayments.slice(0, limit) : rawPayments;
    const nextCursor = hasNextPage ? payments[payments.length - 1]?.id ?? null : null;
    const prevCursor = cursor || null;
    const hasPrevPage = Boolean(cursor) || page > 1;
    const totalPages = Math.ceil(total / limit) || 1;
    const totalAmount = aggregateSum._sum.amount ?? 0;

    return apiSuccess(
      payments,
      'Payment transactions retrieved successfully.',
      {
        pagination: {
          total,
          page,
          limit,
          totalPages,
          cursor,
          nextCursor,
          prevCursor,
          hasNextPage,
          hasPrevPage,
        },
        totalAmount,
      }
    );
  } catch (error) {
    console.error('[API_GET_PAYMENTS_ERROR]', error);
    return apiError('Failed to retrieve payments.', 500);
  }
}

/**
 * POST /api/payments
 * Records a new payment transaction against a student's ledger.
 * Enforces unique payment reference number verification.
 * Staff only.
 */
export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff(req);
    if (!staff) {
      return apiError('Unauthorized. Registry Staff privileges required.', 403);
    }

    const body = await req.json();
    const validation = recordPaymentSchema.safeParse(body);

    if (!validation.success) {
      const issue = validation.error.issues[0];
      return apiError(issue ? issue.message : 'Invalid payment details.', 400);
    }

    const { studentId: targetStudent, amount, paymentDate, referenceNo } = validation.data;
    const cleanRefNo = referenceNo.toUpperCase().trim();

    // 1. Verify reference number uniqueness
    const existingPayment = await prisma.payment.findUnique({
      where: { referenceNo: cleanRefNo },
    });

    if (existingPayment) {
      return apiError(
        `Payment reference '${cleanRefNo}' is already registered in the ledger. Please provide a unique reference number.`,
        409
      );
    }

    // 2. Resolve student by UUID or studentId (SMS-YYYY-XXXX)
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id: targetStudent }, { studentId: targetStudent }],
      },
      include: {
        programme: true,
        payments: {
          select: { amount: true },
        },
      },
    });

    if (!student) {
      return apiError(`Student record '${targetStudent}' not found.`, 404);
    }

    // 3. Compute baseline fee & previous balance
    const tuitionFee = student.programme?.tuitionFee ?? 0;
    const previousPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
    const previousBalance = Math.max(0, Math.round((tuitionFee - previousPaid) * 100) / 100);

    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();

    // 4. Create payment transaction inside database
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        recordedById: staff.staffProfileId,
        amount: Math.round(amount * 100) / 100,
        paymentDate: paymentDateObj,
        referenceNo: cleanRefNo,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            email: true,
            programme: {
              select: {
                id: true,
                code: true,
                name: true,
                tuitionFee: true,
              },
            },
          },
        },
        recordedBy: {
          select: {
            id: true,
            staffId: true,
            fullName: true,
          },
        },
      },
    });

    // 5. Compute updated financial balance
    const updatedTotalPaid = Math.round((previousPaid + payment.amount) * 100) / 100;
    const newBalance = Math.max(0, Math.round((tuitionFee - updatedTotalPaid) * 100) / 100);
    const isOverdue = newBalance > 0;

    return apiSuccess(
      {
        payment,
        ledgerSummary: {
          tuitionFee,
          previousPaid,
          amountPaid: payment.amount,
          newTotalPaid: updatedTotalPaid,
          previousBalance,
          newBalance,
          isOverdue,
          status: newBalance === 0 ? 'SETTLED' : 'PARTIAL',
        },
      },
      `Payment of £${payment.amount.toLocaleString()} successfully recorded with reference ${payment.referenceNo}.`,
      undefined,
      201
    );
  } catch (error) {
    console.error('[API_POST_PAYMENT_ERROR]', error);
    return apiError('Failed to record payment transaction.', 500);
  }
}
