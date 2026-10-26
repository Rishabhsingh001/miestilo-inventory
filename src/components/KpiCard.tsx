import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  href?: string;
  badgeText?: string;
  badgeType?: 'brand' | 'warning' | 'neutral';
}

export function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  href,
  badgeText,
  badgeType = 'brand',
}: KpiCardProps) {
  const content = (
    <div className="card-surface p-5 transition-all duration-200 hover:shadow-md hover:border-lime-300 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {label}
        </span>
        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 group-hover:bg-[#A7F432]/30 group-hover:text-stone-900 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-stone-900 font-mono">
          {value}
        </span>
        {badgeText && (
          <span
            className={clsx(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              badgeType === 'brand' && 'bg-[#A7F432]/30 text-lime-900 font-semibold',
              badgeType === 'warning' && 'bg-amber-100 text-amber-800',
              badgeType === 'neutral' && 'bg-stone-100 text-stone-600'
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-stone-500 font-normal">
          {subtext}
        </p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}
