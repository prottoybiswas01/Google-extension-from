import React, { useState, useRef } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { JsonPreview } from '../components/JsonPreview';
import { ProgressBar } from '../components/ProgressBar';
import { ReviewPage } from '../components/review/ReviewPage';
import { useExtensionSettings } from '../hooks/useExtensionSettings';
import { formExtractionPipeline } from '../services/FormExtractionPipeline';
import {
  UploadedFileData,
  FormUploadStatus,
  PipelineProgressState,
  ExtractedFormData,
} from '../types';
import {
  UploadCloud,
  FileImage,
  Settings,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  Info,
  CheckSquare,
} from 'lucide-react';

export const Popup: React.FC = () => {
  const { settings } = useExtensionSettings();
  const [uploadedFile, setUploadedFile] = useState<UploadedFileData | null>(null);
  const [status, setStatus] = useState<FormUploadStatus>('idle');
  const [viewMode, setViewMode] = useState<'upload' | 'review'>('upload');
  const [pipelineState, setPipelineState] = useState<PipelineProgressState>({
    step: 'idle',
    progressPercent: 0,
    statusMessage: '',
  });
  const [extractedData, setExtractedData] = useState<ExtractedFormData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, WEBP).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl: e.target?.result as string,
          blob: file,
        });
        setStatus('ready');
        setExtractedData(null);
        setViewMode('upload');
        setPipelineState({
          step: 'idle',
          progressPercent: 0,
          statusMessage: '',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setStatus('idle');
    setExtractedData(null);
    setViewMode('upload');
    setPipelineState({
      step: 'idle',
      progressPercent: 0,
      statusMessage: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeForm = async () => {
    if (!uploadedFile) return;

    setStatus('uploading');
    try {
      const result = await formExtractionPipeline.executePipeline(
        uploadedFile.blob,
        settings,
        (progress) => {
          setPipelineState(progress);
        }
      );
      setExtractedData(result);
      setStatus('ready');
      setViewMode('review');
    } catch (err) {
      console.error('[Popup] Extraction error:', err);
      setStatus('error');
    }
  };

  const handleOpenSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('../options/index.html', '_blank');
    }
  };

  const handleFillFormTrigger = (reviewedData: ExtractedFormData) => {
    alert(
      `Phase 4 Review Complete!\nReviewed Data ready for Phase 5 Auto Fill:\n\n${JSON.stringify(
        reviewedData,
        null,
        2
      )}`
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isProcessing =
    pipelineState.step !== 'idle' &&
    pipelineState.step !== 'success' &&
    pipelineState.step !== 'error';

  // Render Review Page View Mode
  if (viewMode === 'review' && extractedData) {
    return (
      <ReviewPage
        initialData={extractedData}
        uploadedFile={uploadedFile}
        rawOcrText={pipelineState.extractedText}
        settings={settings}
        onBack={() => setViewMode('upload')}
        onCancel={handleClearFile}
        onRetryOcr={handleAnalyzeForm}
        onRetryAi={handleAnalyzeForm}
        onFillForm={handleFillFormTrigger}
      />
    );
  }

  // Default Upload & Extraction View Mode
  return (
    <div className="w-[420px] p-4 bg-slate-50 min-h-[580px] flex flex-col justify-between select-none">
      <div className="space-y-3">
        {/* Header Component */}
        <Header title="TTC Form Auto Fill" subtitle="OCR + AI Handwritten Form Extraction" />

        {/* Upload Image Section */}
        <Card variant="default" className="p-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
            id="form-image-input"
          />

          {!uploadedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/50 rounded-lg p-4 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center gap-2"
            >
              <div className="p-2.5 rounded-full bg-slate-100 group-hover:bg-brand-100 text-slate-500 group-hover:text-brand-600 transition-colors">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 group-hover:text-brand-700">
                  Upload Handwritten Form Image
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports PNG, JPG, JPEG, WEBP
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<FileImage className="w-3.5 h-3.5" />}
                className="mt-1 text-xs py-1"
              >
                Select File
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Image Uploaded
                </span>
                <button
                  onClick={handleClearFile}
                  disabled={isProcessing}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-2 bg-slate-100/70 rounded-lg border border-slate-200">
                <img
                  src={uploadedFile.previewUrl}
                  alt="Uploaded preview"
                  className="w-12 h-12 object-cover rounded-md border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {uploadedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Action Button: Analyze Form */}
        <div className="space-y-1.5">
          <Button
            variant="primary"
            fullWidth
            disabled={!uploadedFile || isProcessing}
            isLoading={isProcessing}
            onClick={handleAnalyzeForm}
            leftIcon={<Sparkles className="w-4 h-4 text-yellow-300" />}
          >
            {isProcessing
              ? 'Analyzing Form...'
              : extractedData
              ? 'Re-Analyze Form'
              : 'Analyze Form'}
          </Button>

          {extractedData && !isProcessing && (
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              onClick={() => setViewMode('review')}
              leftIcon={<CheckSquare className="w-4 h-4 text-brand-600" />}
            >
              Open Data Review Screen
            </Button>
          )}

          {!settings.apiKey && (
            <p className="text-[11px] text-amber-600 text-center flex items-center justify-center gap-1">
              <Info className="w-3.5 h-3.5" /> Configure your API key in Settings for full AI vision parsing
            </p>
          )}
        </div>

        {/* Pipeline Progress Indicator */}
        <ProgressBar progressState={pipelineState} />

        {/* Retry Button on Failure */}
        {pipelineState.step === 'error' && (
          <Button
            variant="secondary"
            fullWidth
            size="sm"
            onClick={handleAnalyzeForm}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Analysis
          </Button>
        )}

        {/* Extracted JSON Results Preview */}
        {extractedData && <JsonPreview data={extractedData} />}

        {/* Status Overview Card */}
        {!extractedData && pipelineState.step === 'idle' && (
          <Card variant="bordered" className="p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Active Providers
              </h2>
              <StatusBadge
                status={status === 'error' ? 'warning' : status === 'ready' ? 'ready' : 'standby'}
                label={status === 'error' ? 'Error' : status === 'ready' ? 'Ready for Extraction' : 'Phase 4 Ready'}
              />
            </div>
            <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">OCR Engine:</span>
                <span className="font-medium text-slate-800 capitalize">
                  {settings.ocrProvider}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">AI Provider:</span>
                <span className="font-medium text-slate-800 capitalize">
                  {settings.aiProvider}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Footer Settings Button */}
      <div className="pt-3 border-t border-slate-200/80 mt-4">
        <Button
          variant="secondary"
          fullWidth
          size="sm"
          onClick={handleOpenSettings}
          leftIcon={<Settings className="w-4 h-4 text-slate-600" />}
        >
          Open Settings
        </Button>
      </div>
    </div>
  );
};
