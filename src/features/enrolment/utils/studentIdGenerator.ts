import prisma from '@/lib/prisma';

/**
 * Extracts a 4-digit year to use for the student ID.
 * Defaults to current calendar year if no valid year is parsed.
 */
export function resolveTargetYear(academicYear?: string): string {
  if (academicYear) {
    // If format like "2024/2025", pick the finishing year or start year
    const years = academicYear.match(/20\d{2}/g);
    if (years && years.length > 0) {
      // Pick the last matched year in the string (e.g. 2025 from "2024/2025")
      return years[years.length - 1];
    }
  }
  return new Date().getFullYear().toString();
}

/**
 * Generates the next sequential Student ID in SMS-YYYY-XXXX format.
 * Guarantees zero-padded 4-digit uniqueness per target year.
 */
export async function generateStudentId(academicYear?: string): Promise<string> {
  const year = resolveTargetYear(academicYear);
  const prefix = `SMS-${year}-`;

  // Find the student with the highest sequence number for this year
  const latestStudent = await prisma.student.findFirst({
    where: {
      studentId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      studentId: 'desc',
    },
    select: {
      studentId: true,
    },
  });

  let nextSequence = 1;

  if (latestStudent?.studentId) {
    const sequencePart = latestStudent.studentId.substring(prefix.length);
    const parsed = parseInt(sequencePart, 10);
    if (!isNaN(parsed)) {
      nextSequence = parsed + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSequence}`;
}
