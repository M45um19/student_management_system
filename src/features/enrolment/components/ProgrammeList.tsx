'use client';

import React from 'react';
import { BookOpen, Plus, Users, Award, PoundSterling, ArrowRight, ShieldCheck } from 'lucide-react';
import { Programme } from '../types';

interface ProgrammeListProps {
  programmes: Programme[];
  isLoading: boolean;
  onOpenCreateModal: () => void;
  onFilterByProgramme?: (programmeId: string) => void;
}

export const ProgrammeList: React.FC<ProgrammeListProps> = ({
  programmes,
  isLoading,
  onOpenCreateModal,
  onFilterByProgramme,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Offered Degree Programmes
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Institutional curriculum, baseline tuition fees, and active class sizes.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0269ae] hover:bg-[#015289] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Programme</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse space-y-4"
            >
              <div className="flex justify-between">
                <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              </div>
              <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            </div>
          ))}
        </div>
      ) : programmes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <BookOpen className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            No Programmes Configured
          </h4>
          <p className="text-xs text-zinc-500 mb-4">
            Create your first academic degree programme to enable student enrolment.
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-[#0269ae] text-white text-xs font-semibold"
          >
            Create Programme
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programmes.map((p) => {
            const studentCount = p._count?.students ?? 0;
            const assessmentCount = p._count?.assessments ?? 0;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80">
                      {p.code}
                    </span>
                    <span className="text-xs font-bold text-[#0a9748] dark:text-[#22c55e] bg-[#0a9748]/10 dark:bg-[#0a9748]/20 px-2 py-0.5 rounded-full border border-[#0a9748]/30">
                      £{p.tuitionFee.toLocaleString()}/yr
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {p.name}
                  </h4>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0269ae]" />
                      <span>
                        <strong className="text-zinc-900 dark:text-zinc-100">
                          {studentCount}
                        </strong>{' '}
                        Enrolled
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        <strong className="text-zinc-900 dark:text-zinc-100">
                          {assessmentCount}
                        </strong>{' '}
                        Assessments
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                    {p.createdBy ? `By ${p.createdBy.fullName}` : 'Registry'}
                  </div>

                  {onFilterByProgramme && (
                    <button
                      type="button"
                      onClick={() => onFilterByProgramme(p.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0269ae] dark:text-[#43b5e9] hover:underline"
                    >
                      <span>View Students</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgrammeList;
