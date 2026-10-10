import React from 'react';
import { CheckCircle2, Clock, XCircle, GraduationCap } from 'lucide-react';
import { EnrolmentStatusType } from '../types';

interface StatusBadgeProps {
  status: EnrolmentStatusType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
}) => {
  const configMap: Record<
    EnrolmentStatusType,
    { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }
  > = {
    ENROLLED: {
      label: 'Enrolled',
      bg: 'bg-[#0a9748]/10 dark:bg-[#0a9748]/20',
      text: 'text-[#0a9748] dark:text-[#22c55e]',
      border: 'border-[#0a9748]/30 dark:border-[#0a9748]/40',
      icon: CheckCircle2,
    },
    DEFERRED: {
      label: 'Deferred',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30 dark:border-amber-500/40',
      icon: Clock,
    },
    WITHDRAWN: {
      label: 'Withdrawn',
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/30 dark:border-rose-500/40',
      icon: XCircle,
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-[#0269ae]/10 dark:bg-[#0269ae]/20',
      text: 'text-[#0269ae] dark:text-[#43b5e9]',
      border: 'border-[#0269ae]/30 dark:border-[#0269ae]/40',
      icon: GraduationCap,
    },
  };

  const config = configMap[status] || configMap.ENROLLED;
  const Icon = config.icon;

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-0.5 gap-1.5 font-medium'
      : 'text-xs px-3 py-1 gap-2 font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
