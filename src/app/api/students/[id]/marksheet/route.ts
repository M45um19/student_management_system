import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-guard';
import { apiSuccess, apiError } from '@/lib/api-response';
import {
  StudentMarksheetData,
  StudentMarksheetItem,
} from '@/features/marksheet/types';
import {
  calculateMeanScore,
  calculateOverallClassification,
} from '@/features/marksheet/utils/gradeCalculations';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/students/[id]/marksheet
 * Retrieves official academic marksheet & transcript for a student.
 * 
 * Strict Gating:
 * - When requested by a STUDENT: Query is strictly filtered to `isPublished: true`.
 *   Unpublished draft marks remain completely hidden at the database level.
 *   Students can only access their own profile (enforced via session check).
 * - When requested by STAFF: Registry staff can inspect both published and draft grades,
 *   with full audit details (gradedBy, status).
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return apiError('Unauthorized. Please log in.', 401);
    }

    const { id: paramId } = await params;

    // Resolve 'me' identifier
    const targetId = paramId === 'me' ? user.studentProfileId : paramId;

    if (!targetId) {
      return apiError('Student profile could not be identified.', 400);
    }

    // Role-based boundary: Students can only view their own marksheet
    if (user.role === 'STUDENT' && user.studentProfileId !== targetId) {
      return apiError('Access denied. You can only inspect your own marksheet.', 403);
    }

    // Lookup student by UUID or SMS-YYYY-XXXX studentId
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
      },
    });

    if (!student) {
      return apiError('Student record not found.', 404);
    }

    // Double-check student boundary if queried by studentId
    if (user.role === 'STUDENT' && user.studentProfileId !== student.id) {
      return apiError('Access denied. You can only inspect your own marksheet.', 403);
    }

    const isStudentCaller = user.role === 'STUDENT';

    // Query grades:
    // If student: strictly require isPublished === true
    // If staff: return all grades (or filtered if specified)
    const grades = await prisma.grade.findMany({
      where: {
        studentId: student.id,
        ...(isStudentCaller ? { isPublished: true } : {}),
      },
      orderBy: {
        assessment: {
          deadline: 'desc',
        },
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            module: true,
            deadline: true,
            isActive: true,
          },
        },
        submission: {
          select: {
            id: true,
            submittedAt: true,
            isLate: true,
            fileName: true,
            fileUrl: true,
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

    // Check count of unpublished grades for staff auditing
    let unpublishedCount = 0;
    if (!isStudentCaller) {
      unpublishedCount = await prisma.grade.count({
        where: {
          studentId: student.id,
          isPublished: false,
        },
      });
    }

    const numericScores: number[] = [];
    let distinctionCount = 0;
    let meritCount = 0;
    let passCount = 0;
    let failCount = 0;

    const results: StudentMarksheetItem[] = grades.map((g) => {
      numericScores.push(g.numericGrade);
      const c = g.classification.toLowerCase();
      if (c === 'distinction') distinctionCount++;
      else if (c === 'merit') meritCount++;
      else if (c === 'pass') passCount++;
      else failCount++;

      return {
        gradeId: g.id,
        assessmentId: g.assessmentId,
        module: g.assessment.module,
        title: g.assessment.title,
        deadline: g.assessment.deadline.toISOString(),
        numericGrade: g.numericGrade,
        classification: g.classification,
        isPublished: g.isPublished,
        publishedAt: g.publishedAt ? g.publishedAt.toISOString() : null,
        submittedAt: g.submission ? g.submission.submittedAt.toISOString() : null,
        isLate: g.submission ? g.submission.isLate : false,
        gradedBy: g.gradedBy ? g.gradedBy.fullName : null,
      };
    });

    const gpa = calculateMeanScore(numericScores);
    const overallClassification =
      numericScores.length > 0 ? calculateOverallClassification(gpa) : 'Unclassified';
    const modulesPassed = distinctionCount + meritCount + passCount;

    const marksheetData: StudentMarksheetData = {
      student: {
        id: student.id,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        academicYear: student.academicYear,
        status: student.status,
      },
      programme: student.programme,
      gpa,
      overallClassification,
      totalAssessed: results.length,
      modulesPassed,
      distinctionCount,
      meritCount,
      passCount,
      failCount,
      results,
      hasUnpublishedGrades: unpublishedCount > 0,
      totalGradesRecorded: results.length + unpublishedCount,
      generatedAt: new Date().toISOString(),
    };

    return apiSuccess(
      marksheetData,
      `Official marksheet retrieved successfully for student ${student.studentId}.`
    );
  } catch (error) {
    console.error('[API_GET_STUDENT_MARKSHEET_ERROR]', error);
    return apiError('Failed to retrieve student marksheet.', 500);
  }
}
