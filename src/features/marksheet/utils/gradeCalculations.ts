import { UKClassification } from '../types';

/**
 * Calculates official UK university degree classification from numeric mark (0-100).
 * - Distinction: >= 70
 * - Merit: 60 - 69.99
 * - Pass: 40 - 59.99
 * - Fail: < 40
 */
export function calculateClassification(numericGrade: number): UKClassification {
  if (numericGrade >= 70) {
    return 'Distinction';
  }
  if (numericGrade >= 60) {
    return 'Merit';
  }
  if (numericGrade >= 40) {
    return 'Pass';
  }
  return 'Fail';
}

/**
 * Calculates mean/average score from array of numeric grades.
 */
export function calculateMeanScore(grades: number[]): number {
  if (!grades || grades.length === 0) return 0;
  const sum = grades.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / grades.length) * 10) / 10;
}

/**
 * Computes overall UK degree classification based on cumulative average.
 */
export function calculateOverallClassification(meanScore: number): UKClassification {
  return calculateClassification(meanScore);
}

/**
 * Returns Tailwind CSS styling classes and colors for classification badges.
 */
export function getClassificationBadgeProps(classification: string): {
  variant: 'success' | 'primary' | 'warning' | 'danger' | 'default';
  label: string;
  badgeClass: string;
  bgGlow: string;
} {
  const norm = classification.trim().toLowerCase();
  switch (norm) {
    case 'distinction':
      return {
        variant: 'success',
        label: 'Distinction (≥70%)',
        badgeClass:
          'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        bgGlow: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400',
      };
    case 'merit':
      return {
        variant: 'primary',
        label: 'Merit (60-69%)',
        badgeClass:
          'bg-[#0269ae]/10 text-[#0269ae] dark:text-[#43b5e9] border-[#0269ae]/30',
        bgGlow: 'from-sky-500/20 to-blue-500/20 text-[#0269ae] dark:text-[#43b5e9]',
      };
    case 'pass':
      return {
        variant: 'warning',
        label: 'Pass (40-59%)',
        badgeClass:
          'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        bgGlow: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400',
      };
    case 'fail':
    default:
      return {
        variant: 'danger',
        label: 'Fail (<40%)',
        badgeClass:
          'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
        bgGlow: 'from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400',
      };
  }
}

/**
 * Formats ISO date string to British academic format (e.g., "15 Oct 2025, 14:30").
 */
export function formatGradeDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Returns honour degree descriptor for official transcript headers.
 */
export function getHonoursTitle(classification: string): string {
  const norm = classification.trim().toLowerCase();
  switch (norm) {
    case 'distinction':
      return 'First Class Honours (Distinction)';
    case 'merit':
      return 'Upper Second Class Honours (Merit)';
    case 'pass':
      return 'Third Class Honours (Pass)';
    case 'fail':
    default:
      return 'Unclassified / Resit Required';
  }
}
