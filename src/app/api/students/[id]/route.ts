import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireStaff, getSessionUser } from '@/lib/auth-guard';
import { updateStudentSchema } from '@/features/enrolment/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/students/[id]
 * Retrieves comprehensive student profile, academic programme, fee ledger, and submissions.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.', data: null },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Student role boundary: can only access their own profile
    if (user.role === 'STUDENT' && user.studentProfileId !== id) {
      return NextResponse.json(
        { success: false, message: 'Access denied to this student profile.', data: null },
        { status: 403 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id },
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
            createdAt: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            referenceNo: true,
            recordedBy: {
              select: {
                fullName: true,
                staffId: true,
              },
            },
          },
        },
        submissions: {
          orderBy: { submittedAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            submittedAt: true,
            isLate: true,
            assessment: {
              select: {
                id: true,
                title: true,
                module: true,
                deadline: true,
              },
            },
          },
        },
        grades: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            numericGrade: true,
            classification: true,
            isPublished: true,
            publishedAt: true,
            assessment: {
              select: {
                title: true,
                module: true,
              },
            },
          },
        },
        _count: {
          select: {
            payments: true,
            submissions: true,
            grades: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found.', data: null },
        { status: 404 }
      );
    }

    const tuitionFee = student.programme?.tuitionFee ?? 0;
    const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, tuitionFee - totalPaid);
    const isOverdue = balance > 0;

    const studentWithFinancial = {
      ...student,
      financialSummary: {
        tuitionFee,
        totalPaid,
        balance,
        isOverdue,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Student profile retrieved successfully.',
      data: studentWithFinancial,
    });
  } catch (error) {
    console.error('[API_GET_STUDENT_BY_ID_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve student profile.', data: null },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/students/[id]
 * Staff-only endpoint to update student profile information.
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
    const validation = updateStudentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.issues[0]?.message || 'Invalid update data.', data: null },
        { status: 400 }
      );
    }

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Student record not found.', data: null },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};
    if (validation.data.fullName) dataToUpdate.fullName = validation.data.fullName;
    if (validation.data.dateOfBirth) dataToUpdate.dateOfBirth = new Date(validation.data.dateOfBirth);
    if (validation.data.academicYear) dataToUpdate.academicYear = validation.data.academicYear;
    if (validation.data.programmeId) dataToUpdate.programmeId = validation.data.programmeId;
    if (validation.data.status) dataToUpdate.status = validation.data.status;

    if (validation.data.email && validation.data.email !== existing.email) {
      // Check for duplicate email
      const duplicate = await prisma.student.findUnique({
        where: { email: validation.data.email.toLowerCase() },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: `Email '${validation.data.email}' is already used.`, data: null },
          { status: 409 }
        );
      }
      dataToUpdate.email = validation.data.email.toLowerCase();
    }

    const updated = await prisma.student.update({
      where: { id },
      data: dataToUpdate,
      include: {
        programme: true,
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student record updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('[API_PATCH_STUDENT_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update student profile.', data: null },
      { status: 500 }
    );
  }
}
