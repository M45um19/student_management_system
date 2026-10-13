'use client';

import React from 'react';
import { StudentMarksheetData } from '../types';
import {
  formatGradeDate,
  getClassificationBadgeProps,
  getHonoursTitle,
} from '../utils/gradeCalculations';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';

interface StudentMarksheetViewProps {
  marksheet: StudentMarksheetData;
  isStaffInspection?: boolean;
}

export const StudentMarksheetView: React.FC<StudentMarksheetViewProps> = ({
  marksheet,
  isStaffInspection = false,
}) => {
  const {
    student,
    programme,
    gpa,
    overallClassification,
    totalAssessed,
    modulesPassed,
    distinctionCount,
    meritCount,
    passCount,
    failCount,
    results,
    hasUnpublishedGrades,
    generatedAt,
  } = marksheet;

  const overallBadgeProps = getClassificationBadgeProps(overallClassification);
  const honoursTitle = getHonoursTitle(overallClassification);

  return (
    <div className="space-y-6">
      {/* Registry Document Status Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#0a9748]" />
          Official Registry Document
        </span>
        {isStaffInspection && hasUnpublishedGrades && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Contains Staff Drafts
          </span>
        )}
      </div>

      {/* Main Marksheet Document Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Document Header */}
        <div className="border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#013b63] to-[#0269ae] p-2.5 flex items-center justify-center text-white shadow-md shadow-blue-900/10 shrink-0">
              <Image
                src="/logo.png"
                alt="SMS Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#0269ae] dark:text-[#43b5e9] tracking-widest uppercase">
                Academic Registry & Examination Board
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Official Academic Marksheet
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Verified Higher Education Statement of Examination Results
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="text-[11px] font-mono text-zinc-400">
              DOC REF: <span className="font-bold text-zinc-700 dark:text-zinc-300">TRN-{student.studentId}</span>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center sm:justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Issued: {formatGradeDate(generatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Student Profile & Degree Programme Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Student Name
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{student.fullName}</p>
            <p className="text-xs font-mono text-zinc-500">{student.email}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Student ID
            </span>
            <p className="text-sm font-bold font-mono text-[#0269ae] dark:text-[#43b5e9]">
              {student.studentId}
            </p>
            <p className="text-xs text-zinc-500">Intake: {student.academicYear || '2024/2025'}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Degree Programme
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {programme?.name || 'Academic Degree'}
            </p>
            <p className="text-xs font-mono text-zinc-500">{programme?.code || 'SMS-PROG'}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Enrolment Status
            </span>
            <div className="mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {student.status || 'ENROLLED'}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Standing & Classification Overview Hero */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Overall Mean Grade */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/30 dark:from-zinc-800/60 dark:to-zinc-800/30 border border-blue-200/50 dark:border-zinc-700/50 flex flex-col justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Cumulative Average Mark
              </span>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#013b63] dark:text-[#43b5e9]">
                  {gpa}%
                </span>
                <span className="text-xs font-medium text-zinc-500">overall GPA</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Calculated across {totalAssessed} evaluated coursework deliverable{totalAssessed === 1 ? '' : 's'}.
              </p>
            </div>

            {/* Overall Award Classification */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-zinc-800/60 dark:to-zinc-800/30 border border-emerald-200/50 dark:border-zinc-700/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Degree Classification
                </span>
                <Award className="w-4 h-4 text-[#0a9748]" />
              </div>
              <div className="my-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${overallBadgeProps.badgeClass}`}
                >
                  {overallClassification}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                {honoursTitle}
              </p>
            </div>

            {/* Completion & Breakdown */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/60 to-pink-50/30 dark:from-zinc-800/60 dark:to-zinc-800/30 border border-purple-200/50 dark:border-zinc-700/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Academic Standing
                </span>
                <GraduationCap className="w-4 h-4 text-purple-600" />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {modulesPassed} of {totalAssessed} Passed
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                <span>{distinctionCount} Dist.</span>
                <span>•</span>
                <span>{meritCount} Merit</span>
                <span>•</span>
                <span>{passCount} Pass</span>
                {failCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-rose-600">{failCount} Fail</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Results Roster Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0269ae]" />
              <span>Assessment & Examination Deliverables Breakdown</span>
            </h3>
            <span className="text-xs text-zinc-500">
              {results.length} published record{results.length === 1 ? '' : 's'}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 mx-auto flex items-center justify-center text-[#0269ae]">
                <Clock className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Results Under Examination Board Review
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Your module coursework deliverables are currently undergoing second-marking and
                  moderation. Official marks will appear here once formally ratified and published
                  by the Registry Examination Board.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Module Code & Title</th>
                    <th className="py-3 px-4">Assessment Deliverable</th>
                    <th className="py-3 px-4">Submission Status</th>
                    <th className="py-3 px-4 text-center">Numeric Mark</th>
                    <th className="py-3 px-4 text-center">UK Classification</th>
                    <th className="py-3 px-4 text-right">Published Date</th>
                    {isStaffInspection && (
                      <th className="py-3 px-4 text-right">Audit Status</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {results.map((res) => {
                    const badge = getClassificationBadgeProps(res.classification);

                    return (
                      <tr
                        key={res.gradeId}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        {/* Module */}
                        <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                          {res.module}
                        </td>

                        {/* Title */}
                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                          {res.title}
                        </td>

                        {/* Submission Timing */}
                        <td className="py-3.5 px-4">
                          {res.isLate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                              Late Submission
                            </span>
                          ) : res.submittedAt ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-2.5 h-2.5 text-[#0a9748]" />
                              On-Time
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic text-[11px]">Direct Mark</span>
                          )}
                        </td>

                        {/* Mark */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                            {res.numericGrade}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-bold ml-0.5">/100</span>
                        </td>

                        {/* Classification */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.badgeClass}`}
                          >
                            {res.classification}
                          </span>
                        </td>

                        {/* Published Date */}
                        <td className="py-3.5 px-4 text-right text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                          {formatGradeDate(res.publishedAt)}
                        </td>

                        {/* Staff Audit Status */}
                        {isStaffInspection && (
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                res.isPublished
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              }`}
                            >
                              {res.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Grading Scale Key & Record Info */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="space-y-1">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              Institutional Grading Scale Key:
            </p>
            <p className="text-[11px] leading-relaxed">
              Distinction: ≥70% • Merit: 60–69% • Pass: 40–59% • Fail: &lt;40%
            </p>
          </div>
          <p className="text-[11px] text-zinc-400">
            Official electronic record produced by the Registry Information System.
          </p>
        </div>
      </div>
    </div>
  );
};
