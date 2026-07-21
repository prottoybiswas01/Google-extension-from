import React from 'react';

export type StatusVariant = 'ready' | 'standby' | 'disabled' | 'active' | 'warning';

export interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const configs: Record<StatusVariant, { bg: string; text: string; dot: string; defaultLabel: string }> = {
    ready: {
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
      defaultLabel: 'System Ready',
    },
    standby: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
      defaultLabel: 'Phase 1 Standby',
    },
    disabled: {
      bg: 'bg-slate-100 border-slate-200',
      text: 'text-slate-600',
      dot: 'bg-slate-400',
      defaultLabel: 'Disabled',
    },
    active: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-700',
      dot: 'bg-amber-500 animate-pulse',
      defaultLabel: 'Processing',
    },
    warning: {
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
      defaultLabel: 'Attention Needed',
    },
  };

  const config = configs[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-full ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{displayLabel}</span>
    </span>
  );
};
