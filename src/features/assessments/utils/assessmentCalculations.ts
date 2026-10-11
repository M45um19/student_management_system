import { SubmissionStatusType } from '../types';

/**
 * Calculates deadline status, time remaining, and urgency flags.
 */
export function calculateDeadlineStatus(deadlineInput: string | Date) {
  const deadline = new Date(deadlineInput);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const isPastDeadline = diffMs < 0;

  const absDiffSec = Math.floor(Math.abs(diffMs) / 1000);
  const days = Math.floor(absDiffSec / 86400);
  const hours = Math.floor((absDiffSec % 86400) / 3600);
  const minutes = Math.floor((absDiffSec % 3600) / 60);

  // Due soon if less than 48 hours remaining and not past deadline
  const isDueSoon = !isPastDeadline && diffMs <= 48 * 60 * 60 * 1000;

  let relativeTime = '';
  if (isPastDeadline) {
    if (days > 0) {
      relativeTime = `Deadline passed ${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (hours > 0) {
      relativeTime = `Deadline passed ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      relativeTime = `Deadline passed ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
  } else {
    if (days > 0) {
      relativeTime = `Due in ${days} ${days === 1 ? 'day' : 'days'}${hours > 0 ? `, ${hours}h` : ''}`;
    } else if (hours > 0) {
      relativeTime = `Due in ${hours} ${hours === 1 ? 'hour' : 'hours'}${minutes > 0 ? `, ${minutes}m` : ''}`;
    } else {
      relativeTime = `Due in ${Math.max(1, minutes)} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
  }

  const formattedDeadline = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).format(deadline);

  return {
    isPastDeadline,
    isDueSoon,
    days,
    hours,
    minutes,
    relativeTime,
    formattedDeadline,
  };
}

/**
 * Formats a submission date into standard UK registry representation.
 */
export function formatSubmissionDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Allowed coursework upload extensions.
 */
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Verifies if file extension is an allowed document format.
 */
export function isAllowedFileType(fileName: string): boolean {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Formats byte size into human readable string (KB / MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Returns badge styling and description for submission statuses.
 */
export function getSubmissionStatusMeta(status: SubmissionStatusType | 'ON_TIME' | 'LATE' | 'MISSING') {
  switch (status) {
    case 'SUBMITTED':
    case 'ON_TIME':
      return {
        label: 'Submitted On-Time',
        badgeVariant: 'success' as const,
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
      };
    case 'LATE':
      return {
        label: 'Submitted Late',
        badgeVariant: 'danger' as const,
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
      };
    case 'OVERDUE':
      return {
        label: 'Overdue (Not Submitted)',
        badgeVariant: 'warning' as const,
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
      };
    case 'PENDING':
    case 'MISSING':
    default:
      return {
        label: 'Awaiting Submission',
        badgeVariant: 'default' as const,
        bg: 'bg-zinc-100 dark:bg-zinc-800',
        text: 'text-zinc-600 dark:text-zinc-300',
        border: 'border-zinc-200 dark:border-zinc-700',
      };
  }
}
