import React from 'react';
import { LogsheetStatus, MachineStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle, XCircle, Ban, Wrench } from 'lucide-react';

interface StatusBadgeProps {
  status: LogsheetStatus | MachineStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className, size = 'sm' }: StatusBadgeProps) {
  const norm = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3.5 h-3.5 mr-1" />;
  let label = status;

  switch (norm) {
    case 'APPROVED':
      styles = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />;
      label = 'Approved';
      break;
    case 'SUBMITTED':
      styles = 'bg-amber-50 text-amber-800 border-amber-300';
      icon = <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />;
      label = 'Submitted / Pending';
      break;
    case 'DRAFT':
      styles = 'bg-slate-100 text-slate-700 border-slate-300';
      icon = <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />;
      label = 'Draft';
      break;
    case 'REJECTED':
      styles = 'bg-rose-50 text-rose-800 border-rose-300';
      icon = <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />;
      label = 'Rejected / Rework';
      break;
    case 'VOIDED':
      styles = 'bg-zinc-100 text-zinc-600 border-zinc-300';
      icon = <Ban className="w-3.5 h-3.5 mr-1 text-zinc-500" />;
      label = 'Voided';
      break;
    case 'AVAILABLE':
      styles = 'bg-blue-50 text-blue-800 border-blue-300';
      icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" />;
      label = 'Available / Yard Ready';
      break;
    case 'RENTED':
      styles = 'bg-indigo-50 text-indigo-800 border-indigo-300';
      icon = <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600" />;
      label = 'Deployed on Site';
      break;
    case 'UNDER_MAINTENANCE':
    case 'BREAKDOWN':
      styles = 'bg-orange-50 text-orange-800 border-orange-300';
      icon = <Wrench className="w-3.5 h-3.5 mr-1 text-orange-600" />;
      label = norm === 'BREAKDOWN' ? 'Breakdown' : 'Under Service';
      break;
  }

  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full whitespace-nowrap',
        padding,
        styles,
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
}

