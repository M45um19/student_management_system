'use client';

import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Programme, StudentFilterParams } from '../types';

interface StudentFilterBarProps {
  filters: StudentFilterParams;
  onFilterChange: (newFilters: Partial<StudentFilterParams>) => void;
  onReset: () => void;
  programmes: Programme[];
  totalResults?: number;
}

export const StudentFilterBar: React.FC<StudentFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  programmes,
  totalResults,
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.programmeId ||
    filters.status
  );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search name, ID (SMS-...), email..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all"
          />
        </div>

        {/* Programme Filter */}
        <div className="relative">
          <select
            value={filters.programmeId || ''}
            onChange={(e) => onFilterChange({ programmeId: e.target.value, page: 1 })}
            aria-label="Filter by degree programme"
            className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all cursor-pointer"
          >
            <option value="">All Degree Programmes</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
            aria-label="Filter by enrolment status"
            className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0269ae] focus:border-transparent transition-all cursor-pointer"
          >
            <option value="">All Enrolment Statuses</option>
            <option value="ENROLLED">Enrolled (Active)</option>
            <option value="DEFERRED">Deferred</option>
            <option value="WITHDRAWN">Withdrawn</option>
            <option value="COMPLETED">Completed (Graduated)</option>
          </select>
        </div>
      </div>

      {/* Filter summary and reset action */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span>
            {totalResults !== undefined ? `${totalResults} student records found` : 'Filtering records...'}
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentFilterBar;
