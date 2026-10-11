'use client';

import React from 'react';
import { BookOpen, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AssessmentOverviewStats } from '../types';

interface AssessmentStatsOverviewProps {
  stats?: AssessmentOverviewStats;
  isLoading?: boolean;
}

export const AssessmentStatsOverview: React.FC<AssessmentStatsOverviewProps> = ({
  stats,
  isLoading = false,
}) => {
  const statItems = [
    {
      title: 'Total Coursework',
      value: stats?.totalAssessments ?? 0,
      description: 'Active registry modules',
      icon: BookOpen,
      iconColor: 'text-[#0269ae] dark:text-[#43b5e9]',
      bgColor: 'bg-[#0269ae]/10 dark:bg-[#0269ae]/20',
      badge: 'Registry',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    },
    {
      title: 'Active Deadlines',
      value: stats?.activeDeadlines ?? 0,
      description: 'Open for submissions',
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
      badge: 'Pending',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      title: 'Submissions Received',
      value: stats?.totalSubmissions ?? 0,
      description: `${stats?.onTimeSubmissions ?? 0} submitted on-time`,
      icon: CheckCircle2,
      iconColor: 'text-[#0a9748] dark:text-[#22c55e]',
      bgColor: 'bg-[#0a9748]/10 dark:bg-[#0a9748]/20',
      badge: 'Received',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      title: 'Late Submissions',
      value: stats?.lateSubmissions ?? 0,
      description: 'Flagged past deadline',
      icon: AlertTriangle,
      iconColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 dark:bg-rose-500/20',
      badge: (stats?.lateSubmissions ?? 0) > 0 ? 'Requires Review' : 'Zero Late',
      badgeColor:
        (stats?.lateSubmissions ?? 0) > 0
          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bgColor}`}>
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {item.title}
              </p>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                {isLoading ? (
                  <span className="inline-block w-12 h-7 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-md" />
                ) : (
                  item.value.toLocaleString()
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
