import React from 'react';
import { clsx } from 'clsx';
import { 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  AlertTriangle, 
  XCircle, 
  RotateCcw,
  Boxes
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-stone-100 text-stone-700 border-stone-200';
  let Icon = Clock;
  let label = status;

  switch (normalized) {
    case 'CONFIRMED':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = CheckCircle2;
      label = 'Confirmed';
      break;
    case 'PACKED':
      colorClasses = 'bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold';
      Icon = PackageCheck;
      label = 'Packed & Ready';
      break;
    case 'PICKING':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      Icon = Boxes;
      label = 'Picking';
      break;
    case 'PARTIALLY_FULFILLED':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = Clock;
      label = 'Partially Fulfilled';
      break;
    case 'FULFILLED':
    case 'POSTED':
    case 'RECEIVED':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = PackageCheck;
      label = normalized === 'POSTED' ? 'Posted' : normalized === 'RECEIVED' ? 'Received' : 'Fulfilled';
      break;
    case 'CANCELLED':
    case 'REJECTED':
      colorClasses = 'bg-stone-100 text-stone-500 border-stone-300';
      Icon = XCircle;
      label = 'Cancelled';
      break;
    case 'RETURNED':
    case 'PARTIALLY_RETURNED':
      colorClasses = 'bg-orange-50 text-orange-800 border-orange-200';
      Icon = RotateCcw;
      label = normalized === 'RETURNED' ? 'Returned' : 'Partially Returned';
      break;
    case 'IN_TRANSIT':
      colorClasses = 'bg-sky-50 text-sky-800 border-sky-200';
      Icon = Clock;
      label = 'In Transit';
      break;
    case 'LOW_STOCK':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      Icon = AlertTriangle;
      label = 'Low Stock';
      break;
    case 'DRAFT':
    default:
      colorClasses = 'bg-stone-100 text-stone-700 border-stone-200';
      Icon = Clock;
      label = 'Draft';
      break;
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide',
        colorClasses,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
