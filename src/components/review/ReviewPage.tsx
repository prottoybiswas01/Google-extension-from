import React, { useState, useMemo } from 'react';
import {
  ExtractedFormData,
  FieldReviewItem,
  UploadedFileData,
  ExtensionSettings,
} from '../../types';
import { Header } from '../Header';
import { Button } from '../ui/Button';
import { SummaryCard } from './SummaryCard';
import { FieldEditor } from './FieldEditor';
import { JsonPreview } from '../JsonPreview';
import { confidenceAnalyzer } from '../../services/review/ConfidenceAnalyzer';
import {
  Send,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  FileText,
  Image as ImageIcon,
  FileCode,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';

export interface ReviewPageProps {
  initialData: ExtractedFormData;
  uploadedFile?: UploadedFileData | null;
  rawOcrText?: string;
  settings: ExtensionSettings;
  onBack: () => void;
  onCancel: () => void;
  onRetryOcr: () => void;
  onRetryAi: () => void;
  onFillForm: (reviewedData: ExtractedFormData) => void;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  initialData,
  uploadedFile,
  rawOcrText,
  onBack,
  onCancel,
  onRetryOcr,
  onRetryAi,
  onFillForm,
}) => {
  const [items, setItems] = useState<FieldReviewItem[]>(() =>
    confidenceAnalyzer.analyzeExtractedData(initialData)
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'image' | 'ocr' | 'json'>('editor');

  const metrics = useMemo(
    () => confidenceAnalyzer.computeSummaryMetrics(items),
    [items]
  );

  const handleFieldChange = (updatedItem: FieldReviewItem) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.key === updatedItem.key ? updatedItem : item))
    );
  };

  const handleFillFormSubmit = () => {
    // Construct final ExtractedFormData payload from non-ignored items
    const finalData: Partial<ExtractedFormData> = {};
    for (const item of items) {
      if (item.status !== 'ignored') {
        finalData[item.key] = item.value;
      } else {
        finalData[item.key] = null;
      }
    }
    onFillForm(finalData as ExtractedFormData);
  };

  const hasValidationErrors = items.some(
    (item) => item.status !== 'ignored' && !!item.validationError
  );

  return (
    <div className="w-[440px] p-4 bg-slate-50 min-h-[620px] flex flex-col justify-between select-none">
      <div className="space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="px-2 text-xs"
          >
            Back
          </Button>

          <Header title="Data Review" subtitle="Verify form fields before filling" showBadge={false} />

          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            leftIcon={<XCircle className="w-4 h-4 text-slate-400" />}
            className="px-2 text-xs text-slate-500 hover:text-rose-600"
          >
            Cancel
          </Button>
        </div>

        {/* Summary Card */}
        <SummaryCard metrics={metrics} />

        {/* Action Toolbar: Retry OCR & AI */}
        <div className="flex items-center justify-between gap-2 p-2 bg-slate-100 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-600">Re-run Engines:</span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryOcr}
              leftIcon={<RefreshCw className="w-3 h-3 text-slate-600" />}
              className="py-1 px-2 text-[11px] bg-white"
            >
              Retry OCR
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRetryAi}
              leftIcon={<Sparkles className="w-3 h-3 text-brand-600" />}
              className="py-1 px-2 text-[11px] bg-white"
            >
              Retry AI
            </Button>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('editor')}
            className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Fields ({items.length})
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'image'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image
          </button>

          <button
            onClick={() => setActiveTab('ocr')}
            className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'ocr'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            OCR Text
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2 px-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'json'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            JSON
          </button>
        </div>

        {/* Tab 1: Interactive Field Editor */}
        {activeTab === 'editor' && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {items.map((item) => (
              <FieldEditor key={item.key} item={item} onChange={handleFieldChange} />
            ))}
          </div>
        )}

        {/* Tab 2: Original Image Preview */}
        {activeTab === 'image' && (
          <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-center max-h-[300px] overflow-auto">
            {uploadedFile?.previewUrl ? (
              <img
                src={uploadedFile.previewUrl}
                alt="Form source"
                className="max-w-full h-auto object-contain rounded"
              />
            ) : (
              <p className="text-xs text-slate-400 p-4">No image preview available.</p>
            )}
          </div>
        )}

        {/* Tab 3: Raw OCR Text */}
        {activeTab === 'ocr' && (
          <div className="p-3 bg-slate-900 text-slate-100 rounded-lg max-h-[300px] overflow-y-auto font-mono text-[11px] leading-relaxed border border-slate-800">
            {rawOcrText ? (
              <pre className="whitespace-pre-wrap break-words">{rawOcrText}</pre>
            ) : (
              <p className="text-slate-400 italic">No OCR text extracted.</p>
            )}
          </div>
        )}

        {/* Tab 4: Formatted JSON */}
        {activeTab === 'json' && (
          <JsonPreview
            data={
              items.reduce((acc, item) => {
                acc[item.key] = item.status === 'ignored' ? null : item.value;
                return acc;
              }, {} as ExtractedFormData)
            }
          />
        )}
      </div>

      {/* Footer Actions: Fill Form */}
      <div className="pt-3 border-t border-slate-200/80 mt-4 space-y-1.5">
        {hasValidationErrors && (
          <p className="text-[11px] text-rose-600 text-center font-medium">
            Please resolve field validation errors before auto-filling.
          </p>
        )}

        <Button
          variant="primary"
          fullWidth
          size="lg"
          disabled={hasValidationErrors}
          onClick={handleFillFormSubmit}
          leftIcon={<Send className="w-4 h-4 text-white" />}
          className="bg-brand-600 hover:bg-brand-700 shadow-md"
        >
          Auto Fill Web Form
        </Button>
      </div>
    </div>
  );
};
