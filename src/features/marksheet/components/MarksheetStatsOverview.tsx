'use client';

import React from 'react';
import { StatCard } from '@/components/shared';
import { MarksheetStatsOverviewData } from '../types';
import { Award, CheckCircle2, FileCheck2, TrendingUp } from 'lucide-react';

interface MarksheetStatsOverviewProps {
  stats?: MarksheetStatsOverviewData | null;
  isLoading?: boolean;
}

export const MarksheetStatsOverview: React.FC<MarksheetStatsOverviewProps> = ({
  stats,
  isLoading = false,
}) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 animate-pulse border border-zinc-200/50 dark:border-zinc-700/50"
          />
        ))}
      </div>
    );
  }

  const {
    totalGradesAwarded,
    overallAverage,
    distinctionMeritRate,
    publishedRate,
    publishedCount,
    draftCount,
  } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Graded */}
      <StatCard
        title="Grades Awarded"
        value={totalGradesAwarded}
        subtitle={`${publishedCount} published • ${draftCount} in draft moderation`}
        icon={FileCheck2}
        badge={totalGradesAwarded > 0 ? 'Assessed' : 'Pending'}
      />

      {/* 2. Overall Institutional Average */}
      <StatCard
        title="Institutional Mean"
        value={totalGradesAwarded > 0 ? `${overallAverage}%` : '—'}
        subtitle={
          overallAverage >= 70
            ? 'Distinction Class Tier'
            : overallAverage >= 60
            ? 'Merit Class Tier'
            : overallAverage >= 40
            ? 'Pass Class Tier'
            : 'Academic Support Recommended'
        }
        icon={TrendingUp}
        badge={totalGradesAwarded > 0 ? 'Average' : undefined}
      />

      {/* 3. Distinction & Merit Rate */}
      <StatCard
        title="High Achievers (≥60%)"
        value={`${distinctionMeritRate}%`}
        subtitle="Distinction & Merit classifications"
        icon={Award}
        badge={distinctionMeritRate >= 50 ? 'Strong Class' : undefined}
      />

      {/* 4. Publication Readiness */}
      <StatCard
        title="Marksheet Publication"
        value={`${publishedRate}%`}
        subtitle={`${publishedCount} of ${totalGradesAwarded} marks released to students`}
        icon={CheckCircle2}
        badge={draftCount > 0 ? `${draftCount} Drafts` : 'All Released'}
      />
    </div>
  );
};
