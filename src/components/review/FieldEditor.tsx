import React from 'react';
import { FieldReviewItem } from '../../types';
import { validationEngine } from '../../services/review/ValidationEngine';
import { Edit2, Trash2, EyeOff, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface FieldEditorProps {
  item: FieldReviewItem;
  onChange: (updatedItem: FieldReviewItem) => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({ item, onChange }) => {
  const isIgnored = item.status === 'ignored';

  const handleValueChange = (newValue: string) => {
    const validation = validationEngine.validateField(item.key, newValue, isIgnored);
    const isEdited = newValue !== item.originalValue;

    onChange({
      ...item,
      value: newValue,
      status: isIgnored
        ? 'ignored'
        : isEdited
        ? 'edited'
        : newValue.trim() !== ''
        ? 'matched'
        : 'missing',
      validationError: validation.error,
      confidence: validation.isValid ? item.confidence : 'low',
    });
  };

  const handleDelete = () => {
    handleValueChange('');
  };

  const handleToggleIgnore = () => {
    const newIgnored = !isIgnored;
    const validation = validationEngine.validateField(item.key, item.value, newIgnored);

    onChange({
      ...item,
      status: newIgnored ? 'ignored' : item.value ? 'matched' : 'missing',
      validationError: newIgnored ? undefined : validation.error,
    });
  };

  // Confidence color styles
  const badgeStyles = {
    high: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const borderStyles = {
    high: 'border-l-4 border-l-emerald-500 border-slate-200',
    medium: 'border-l-4 border-l-amber-500 border-slate-200',
    low: 'border-l-4 border-l-rose-500 border-slate-200',
  };

  return (
    <div
      className={`p-3 bg-white rounded-lg border shadow-sm transition-all duration-150 ${
        isIgnored ? 'opacity-50 bg-slate-50 border-slate-200' : borderStyles[item.confidence]
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            {item.label}
          </label>
          {item.required && (
            <span className="text-xs text-rose-500 font-bold" title="Required Field">
              *
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Confidence Badge */}
          {!isIgnored && (
            <span
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wider ${
                badgeStyles[item.confidence]
              }`}
            >
              {item.confidence}
            </span>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isIgnored || !item.value}
            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors disabled:opacity-30"
            title="Clear field value"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Ignore Toggle Button */}
          <button
            type="button"
            onClick={handleToggleIgnore}
            className={`p-1 rounded transition-colors ${
              isIgnored
                ? 'text-brand-600 bg-brand-50'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title={isIgnored ? 'Include field' : 'Ignore field'}
          >
            {isIgnored ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Value Input Field */}
      <div className="relative">
        <input
          type="text"
          value={item.value ?? ''}
          onChange={(e) => handleValueChange(e.target.value)}
          disabled={isIgnored}
          placeholder={isIgnored ? 'Field ignored' : 'Enter value...'}
          className={`w-full px-2.5 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
            item.validationError
              ? 'border-rose-300 text-rose-900 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-500/20'
              : item.status === 'edited'
              ? 'border-brand-300 bg-brand-50/30 text-brand-900 focus:border-brand-500'
              : 'border-slate-300 text-slate-800 focus:border-brand-500 focus:ring-brand-500/20'
          }`}
        />

        {!isIgnored && !item.validationError && item.value && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute right-2.5 top-2.5 pointer-events-none" />
        )}
      </div>

      {/* Instant Validation Error Message */}
      {item.validationError && !isIgnored && (
        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {item.validationError}
        </p>
      )}
    </div>
  );
};
