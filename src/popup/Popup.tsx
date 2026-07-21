import React, { useState, useRef } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { UploadedFileData, FormUploadStatus } from '../types';
import {
  UploadCloud,
  FileImage,
  Settings,
  Sparkles,
  CheckCircle2,
  X,
  Info,
} from 'lucide-react';

export const Popup: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileData | null>(null);
  const [status, setStatus] = useState<FormUploadStatus>('idle');
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
        });
        setStatus('ready');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('../options/index.html', '_blank');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-[380px] p-4 bg-slate-50 min-h-[520px] flex flex-col justify-between select-none">
      <div>
        {/* Logo and Title Header */}
        <Header title="TTC Form Auto Fill" subtitle="Handwritten Form Automation" />

        <div className="space-y-3">
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
                    Upload Application Form Image
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
                    Image Selected
                  </span>
                  <button
                    onClick={handleClearFile}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
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

          {/* Analyze Button (Disabled in Phase 1) */}
          <div className="space-y-1">
            <Button
              variant="primary"
              fullWidth
              disabled={true}
              leftIcon={<Sparkles className="w-4 h-4 text-slate-400" />}
              className="bg-slate-300 border-slate-300 text-slate-500 shadow-none cursor-not-allowed hover:bg-slate-300"
            >
              Analyze Form (Phase 2)
            </Button>
            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <Info className="w-3 h-3" /> OCR & AI Analysis active in Phase 2
            </p>
          </div>

          {/* Status Card */}
          <Card variant="bordered" className="p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                System Status
              </h2>
              <StatusBadge status="ready" label="Phase 1 Ready" />
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Extension Engine:</span>
                <span className="font-medium text-slate-800">Manifest V3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Form Parser:</span>
                <span className="font-medium text-slate-700">Standby</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Content Script:</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Injected
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer / Open Settings Button */}
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
