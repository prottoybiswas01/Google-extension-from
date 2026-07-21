import React, { useState } from 'react';
import { ExtractedFormData } from '../types';
import { Button } from './ui/Button';
import { Copy, Download, Check, FileCode } from 'lucide-react';

export interface JsonPreviewProps {
  data: ExtractedFormData;
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({ data }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form_extracted_data_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const nonNullCount = Object.values(data).filter((v) => v !== null).length;
  const totalCount = Object.keys(data).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <FileCode className="w-4 h-4 text-brand-600" />
          Extracted JSON ({nonNullCount}/{totalCount} fields identified)
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            className="py-1 px-2 text-[11px]"
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="py-1 px-2 text-[11px]"
          >
            Download
          </Button>
        </div>
      </div>

      <div className="relative rounded-lg bg-slate-900 text-slate-100 p-3 max-h-[220px] overflow-y-auto font-mono text-[11px] leading-relaxed border border-slate-800 shadow-inner">
        <pre className="whitespace-pre-wrap break-words">{jsonString}</pre>
      </div>
    </div>
  );
};
