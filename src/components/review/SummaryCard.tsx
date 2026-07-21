import React from 'react';
import { ReviewSummaryMetrics } from '../../types';
import { Card } from '../ui/Card';
import { CheckCircle2, AlertCircle, Edit3, EyeOff, ShieldCheck } from 'lucide-react';

export interface SummaryCardProps {
  metrics: ReviewSummaryMetrics;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ metrics }) => {
  const {
    totalFields,
    matchedCount,
    missingCount,
    editedCount,
    ignoredCount,
    overallConfidenceScore,
  } = metrics;

  const scoreColor =
    overallConfidenceScore >= 80
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : overallConfidenceScore >= 50
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-rose-600 bg-rose-50 border-rose-200';

  return (
    <Card variant="default" className="p-3 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          Extraction Accuracy Summary
        </h3>
        <div className={`px-2.5 py-1 text-xs font-bold rounded-full border ${scoreColor}`}>
          {overallConfidenceScore}% Confidence
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {/* Total / Matched */}
        <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-emerald-700 font-semibold mb-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{matchedCount}</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-tight">Matched</span>
        </div>

        {/* Missing */}
        <div className="p-2 bg-rose-50/60 border border-rose-100 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-rose-700 font-semibold mb-0.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{missingCount}</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-tight">Missing</span>
        </div>

        {/* Edited */}
        <div className="p-2 bg-blue-50/60 border border-blue-100 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-blue-700 font-semibold mb-0.5">
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editedCount}</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-tight">Edited</span>
        </div>

        {/* Ignored / Total */}
        <div className="p-2 bg-slate-100/70 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-slate-700 font-semibold mb-0.5">
            <EyeOff className="w-3.5 h-3.5" />
            <span>{ignoredCount}/{totalFields}</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-tight">Ignored</span>
        </div>
      </div>
    </Card>
  );
};
