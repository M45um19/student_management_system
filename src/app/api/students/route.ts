import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { Role, EnrolmentStatus, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireStaff, getSessionUser } from '@/lib/auth-guard';
import { createStudentSchema, studentQuerySchema } from '@/features/enrolment/types';
import { generateStudentId } from '@/features/enrolment/utils/studentIdGenerator';
import { apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/students
 * Queries student directory with real-time multi-filtering, search, and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in to view student records.', data: null },
        { status: 401 }
      );
    }

    // 1. Strict Query Parameter Validation & Sanitization with Zod
    const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const queryValidation = studentQuerySchema.safeParse(rawParams);

    if (!queryValidation.success) {
      const issue = queryValidation.error.issues[0]?.message || 'Invalid query parameters';
      return apiError(issue, 400);
    }

    const {
      search: rawSearch,
      q,
      programmeId,
      status,
      academicYear,
      page,
      limit,
      cursor,
      sortBy,
      sortOrder,
    } = queryValidation.data;

    const search = rawSearch || q || '';

    // Construct Prisma WHERE conditions
    const where: Prisma.StudentWhereInput = {};

    if (search.trim()) {
      const query = search.trim();
      where.OR = [
        { fullName: { contains: query, mode: 'insensitive' } },
        { studentId: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (programmeId) {
      where.programmeId = programmeId;
    }

    if (status) {
      where.status = status as EnrolmentStatus;
    }

    if (academicYear) {
      where.academicYear = academicYear;
    }

    // Role boundary: If authenticated as STUDENT, only return their own profile
    if (user.role === 'STUDENT' && user.studentProfileId) {
      where.id = user.studentProfileId;
    }

    const includeRelations = {
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
      _count: {
        select: {
          payments: true,
          submissions: true,
          grades: true,
        },
      },
      payments: {
        select: {
          amount: true,
        },
      },
    };

    // Parallel queries: Aggregate counts & status distribution
    const [totalCount, statusCounts, programmesCount] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.programme.count(),
    ]);

    // UUIDv7 Cursor-based pagination:
    // When cursor is supplied, we seek directly via the B-tree primary key index on UUIDv7 id
    // Take limit + 1 to determine if subsequent records exist without a separate count query
    let rawStudents: any[] = [];
    if (cursor) {
      try {
        rawStudents = await prisma.student.findMany({
          where,
          take: limit + 1,
          skip: 1, // Skip cursor anchor
          cursor: { id: cursor },
          orderBy: { id: 'desc' }, // UUIDv7 chronologically ordered
          include: includeRelations,
        });
      } catch (err: any) {
        if (err.code === 'P2025') {
          // Cursor ID not found in database, fallback to initial page
          rawStudents = await prisma.student.findMany({
            where,
            take: limit + 1,
            orderBy: { id: 'desc' },
            include: includeRelations,
          });
        } else {
          throw err;
        }
      }
    } else {
      // Offset pagination fallback if requested, otherwise initial page
      rawStudents = await prisma.student.findMany({
        where,
        take: limit + 1,
        skip: page > 1 ? (page - 1) * limit : 0,
        orderBy: sortBy === 'id' ? { id: 'desc' } : { [sortBy]: sortOrder },
        include: includeRelations,
      });
    }

    const hasNextPage = rawStudents.length > limit;
    const studentsData = hasNextPage ? rawStudents.slice(0, limit) : rawStudents;
    const nextCursor = hasNextPage ? studentsData[studentsData.length - 1]?.id ?? null : null;
    const prevCursor = cursor || null;
    const hasPrevPage = Boolean(cursor) || page > 1;

    // Format financial balances and stats
    const students = studentsData.map((std) => {
      const tuitionFee = std.programme?.tuitionFee ?? 0;
      const totalPaid = std.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
      const balance = Math.max(0, tuitionFee - totalPaid);
      const isOverdue = balance > 0;

      // Exclude raw payments array from payload
      const { payments, ...rest } = std;
      return {
        ...rest,
        financialSummary: {
          tuitionFee,
          totalPaid,
          balance,
          isOverdue,
        },
      };
    });

    // Compute status counts for registry cards
    const stats = {
      total: 0,
      enrolled: 0,
      deferred: 0,
      withdrawn: 0,
      completed: 0,
      programmesCount,
    };

    statusCounts.forEach((group) => {
      const count = group._count.status;
      stats.total += count;
      if (group.status === EnrolmentStatus.ENROLLED) stats.enrolled = count;
      if (group.status === EnrolmentStatus.DEFERRED) stats.deferred = count;
      if (group.status === EnrolmentStatus.WITHDRAWN) stats.withdrawn = count;
      if (group.status === EnrolmentStatus.COMPLETED) stats.completed = count;
    });

    const totalPages = Math.ceil(totalCount / limit) || 1;

    const paginationMeta = {
      total: totalCount,
      page,
      limit,
      totalPages,
      cursor: cursor || null,
      nextCursor,
      prevCursor,
      hasNextPage,
      hasPrevPage,
    };

    return NextResponse.json({
      success: true,
      message: 'Student directory retrieved successfully',
      data: students,
      meta: {
        pagination: paginationMeta,
        stats,
      },
    });
  } catch (error) {
    console.error('[API_GET_STUDENTS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve students directory.', data: null },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students
 * Staff-only endpoint to enrol a new student, atomically generate an SMS ID,
 * and create an associated student user account.
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
    const validation = createStudentSchema.safeParse(body);

    if (!validation.success) {
      const errorMsg = validation.error.issues[0]?.message || 'Invalid student enrolment details.';
      return NextResponse.json(
        { success: false, message: errorMsg, data: null },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      dateOfBirth,
      academicYear,
      programmeId,
      status,
      createAccount = true,
      password = 'Student@12345',
    } = validation.data;

    // 1. Check if email already exists in Student or User table
    const [existingStudent, existingUser] = await Promise.all([
      prisma.student.findUnique({ where: { email: email.toLowerCase() } }),
      prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
    ]);

    if (existingStudent) {
      return NextResponse.json(
        { success: false, message: `A student with email '${email}' is already enrolled.`, data: null },
        { status: 409 }
      );
    }

    if (existingUser && createAccount) {
      return NextResponse.json(
        { success: false, message: `A user account with email '${email}' already exists.`, data: null },
        { status: 409 }
      );
    }

    // 2. Validate programme existence
    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
    });

    if (!programme) {
      return NextResponse.json(
        { success: false, message: 'The selected degree programme does not exist.', data: null },
        { status: 400 }
      );
    }

    // 3. Atomically generate ID and persist within transaction
    const newStudent = await prisma.$transaction(async (tx) => {
      // Generate unique student ID (e.g. SMS-2025-0006)
      const studentId = await generateStudentId(academicYear);

      let createdUserId: string | null = null;

      if (createAccount) {
        const passwordHash = await bcrypt.hash(password || 'Student@12345', 10);
        const newUser = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash,
            role: Role.STUDENT,
          },
        });
        createdUserId = newUser.id;
      }

      const studentRecord = await tx.student.create({
        data: {
          studentId,
          fullName,
          email: email.toLowerCase(),
          dateOfBirth: new Date(dateOfBirth),
          academicYear,
          status: status as EnrolmentStatus,
          programmeId: programme.id,
          userId: createdUserId,
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
          _count: {
            select: {
              payments: true,
              submissions: true,
              grades: true,
            },
          },
        },
      });

      return studentRecord;
    });

    const studentWithFinancial = {
      ...newStudent,
      financialSummary: {
        tuitionFee: newStudent.programme?.tuitionFee ?? 0,
        totalPaid: 0,
        balance: newStudent.programme?.tuitionFee ?? 0,
        isOverdue: false,
      },
    };

    return NextResponse.json(
      {
        success: true,
        message: `Student successfully enrolled with ID ${newStudent.studentId}.`,
        data: studentWithFinancial,
        meta: {
          accountCreated: createAccount,
          defaultPasswordNote: createAccount ? 'Default temporary password set to Student@12345' : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API_POST_STUDENTS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'An internal error occurred while enrolling the student.', data: null },
      { status: 500 }
    );
  }
}
