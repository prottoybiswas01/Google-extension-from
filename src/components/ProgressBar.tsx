import React from 'react';
import { PipelineProgressState, ProcessingStep } from '../types';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ProgressBarProps {
  progressState: PipelineProgressState;
}

const STAGE_NUMBERS: Record<ProcessingStep, number> = {
  idle: 0,
  preprocessing: 2,
  ocr: 3,
  text_cleaning: 4,
  field_detection: 5,
  ai_validation: 6,
  success: 7,
  error: 0,
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ progressState }) => {
  const { step, progressPercent, statusMessage, error } = progressState;

  if (step === 'idle') return null;

  const isError = step === 'error';
  const isSuccess = step === 'success';
  const stageNum = STAGE_NUMBERS[step];

  return (
    <div className="space-y-2 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate pr-2">
          {isError ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0" />
          )}
          <span className="truncate">{statusMessage}</span>
        </span>
        <span className="font-mono text-slate-500 text-[11px] shrink-0">
          {isError ? 'Error' : isSuccess ? '7/7 Done' : `${stageNum}/7 Stage`}
        </span>
      </div>

      {!isError && (
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isSuccess ? 'bg-emerald-500' : 'bg-brand-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* 7 Stage Step Pills */}
      {!isError && (
        <div className="grid grid-cols-7 gap-1 pt-1">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isActive = num <= stageNum;
            const isCurrent = num === stageNum;
            return (
              <div
                key={num}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  isSuccess
                    ? 'bg-emerald-500'
                    : isCurrent
                    ? 'bg-brand-600 animate-pulse'
                    : isActive
                    ? 'bg-brand-500'
                    : 'bg-slate-200'
                }`}
                title={`Stage ${num}`}
              />
            );
          })}
        </div>
      )}

      {isError && error && (
        <div className="mt-1 p-2 bg-rose-50 border border-rose-200 rounded-md text-[11px] text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
};
