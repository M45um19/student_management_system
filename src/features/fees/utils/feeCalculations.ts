import { PaymentStatusType, PaymentUrgencyType } from '../types';

/**
 * Formats a numeric currency value into British Pounds Sterling (GBP).
 * Example: 9250 -> "£9,250.00"
 */
export function formatGBP(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '£0.00';
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generates a unique, standardized payment reference number.
 * Format: PAY-YYYY-XXXXX (e.g. PAY-2025-A8F2K)
 */
export function generateReferenceNumber(prefix = 'PAY'): string {
  const currentYear = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${currentYear}-${randomChars}`;
}

/**
 * Computes fee ledger status given tuition liability and total amount settled.
 */
export function computePaymentStatus(
  tuitionFee: number,
  totalPaid: number
): {
  balance: number;
  isOverdue: boolean;
  status: PaymentStatusType;
  percentPaid: number;
} {
  const balance = Math.max(0, Math.round((tuitionFee - totalPaid) * 100) / 100);
  const isOverdue = balance > 0;
  const status: PaymentStatusType =
    balance === 0 ? 'SETTLED' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';
  const percentPaid =
    tuitionFee > 0 ? Math.min(100, Math.round((totalPaid / tuitionFee) * 100)) : 100;

  return { balance, isOverdue, status, percentPaid };
}

/**
 * Returns badge styling and label for payment statuses.
 */
export function getPaymentStatusBadge(status: PaymentStatusType) {
  switch (status) {
    case 'SETTLED':
      return {
        label: 'Paid in Full',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200/80 dark:border-emerald-800/80',
        dot: 'bg-emerald-500',
      };
    case 'PARTIAL':
      return {
        label: 'Partially Paid',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200/80 dark:border-amber-800/80',
        dot: 'bg-amber-500',
      };
    case 'UNPAID':
    default:
      return {
        label: 'Unpaid / Overdue',
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200/80 dark:border-rose-800/80',
        dot: 'bg-rose-500',
      };
  }
}

/**
 * Returns badge styling and label for debt urgency tiers.
 */
export function getUrgencyBadge(urgency: PaymentUrgencyType) {
  switch (urgency) {
    case 'HIGH':
      return {
        label: 'Critical • 100% Unpaid',
        bg: 'bg-rose-100 dark:bg-rose-950/60',
        text: 'text-rose-800 dark:text-rose-200',
        border: 'border-rose-300 dark:border-rose-800',
      };
    case 'MEDIUM':
      return {
        label: 'Elevated • >50% Remaining',
        bg: 'bg-amber-100 dark:bg-amber-950/60',
        text: 'text-amber-800 dark:text-amber-200',
        border: 'border-amber-300 dark:border-amber-800',
      };
    case 'LOW':
    default:
      return {
        label: 'Moderate • <50% Remaining',
        bg: 'bg-blue-100 dark:bg-blue-950/60',
        text: 'text-blue-800 dark:text-blue-200',
        border: 'border-blue-300 dark:border-blue-800',
      };
  }
}
