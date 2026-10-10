import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
  gradient?: 'blue' | 'green' | 'indigo' | 'emerald' | 'zinc';
}

const gradientStyles: Record<NonNullable<PageHeaderProps['gradient']>, string> = {
  blue: 'from-[#013b63] via-[#0269ae] to-[#012640] text-white',
  green: 'from-[#043318] via-[#0a9748] to-[#021f0e] text-white',
  indigo: 'from-[#013b63] via-[#0269ae] to-[#012640] text-white',
  emerald: 'from-[#043318] via-[#0a9748] to-[#021f0e] text-white',
  zinc: 'from-zinc-900 via-zinc-800 to-zinc-950 text-white',
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  children,
  gradient = 'blue',
}) => {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-r ${gradientStyles[gradient]} p-8 shadow-lg relative overflow-hidden`}
    >
      <div className="relative z-10 max-w-2xl">
        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-white/90 mb-4">
            <span>{badge}</span>
          </div>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};
