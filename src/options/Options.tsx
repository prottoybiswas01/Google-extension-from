import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectOption } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useExtensionSettings } from '../hooks/useExtensionSettings';
import { AIProvider, OCRProvider } from '../types';
import { Save, Key, Cpu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const aiProviderOptions: SelectOption[] = [
  { value: 'gemini', label: 'Google Gemini (Recommended)', description: 'Fast Vision & Multimodal' },
  { value: 'openai', label: 'OpenAI GPT-4o', description: 'High Precision OCR & Parsing' },
  { value: 'claude', label: 'Anthropic Claude 3.5 Sonnet', description: 'Advanced Document Analysis' },
];

const ocrProviderOptions: SelectOption[] = [
  { value: 'tesseract', label: 'Tesseract.js (Local)', description: 'Client-side offline processing' },
  { value: 'google_cloud', label: 'Google Cloud Vision API', description: 'Cloud OCR Service' },
  { value: 'custom_api', label: 'Custom API Endpoint', description: 'Self-hosted OCR Service' },
];

export const Options: React.FC = () => {
  const {
    settings,
    isLoading,
    isSaving,
    saveStatusMessage,
    updateSettings,
    resetSettings,
  } = useExtensionSettings();

  const [aiProvider, setAiProvider] = useState<AIProvider>(settings.aiProvider);
  const [ocrProvider, setOcrProvider] = useState<OCRProvider>(settings.ocrProvider);
  const [apiKey, setApiKey] = useState<string>(settings.apiKey);
  const [formSaved, setFormSaved] = useState<boolean>(false);

  useEffect(() => {
    setAiProvider(settings.aiProvider);
    setOcrProvider(settings.ocrProvider);
    setApiKey(settings.apiKey);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateSettings({
      aiProvider,
      ocrProvider,
      apiKey,
    });
    if (success) {
      setFormSaved(true);
      setTimeout(() => setFormSaved(false), 3000);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset settings to defaults?')) {
      await resetSettings();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Main Settings Header */}
        <Card variant="default" className="p-6">
          <Header
            title="TTC Form Auto Fill Settings"
            subtitle="Configure your AI and OCR providers for form parsing"
            showBadge={true}
          />

          <div className="mt-4 flex items-center justify-between bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>
                <strong>Phase 1 Active:</strong> Configuration options saved here will be utilized during Phase 2 API integration.
              </span>
            </div>
            <StatusBadge status="ready" label="Storage Ready" />
          </div>
        </Card>

        {/* Configuration Form Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card variant="default" className="p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-600" />
              Engine Configuration
            </h2>

            {/* AI Provider */}
            <div className="space-y-1">
              <Select
                label="AI Provider"
                options={aiProviderOptions}
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                helperText="Select the AI model responsible for structural form understanding."
              />
            </div>

            {/* OCR Provider */}
            <div className="space-y-1">
              <Select
                label="OCR Provider"
                options={ocrProviderOptions}
                value={ocrProvider}
                onChange={(e) => setOcrProvider(e.target.value as OCRProvider)}
                helperText="Select the Optical Character Recognition engine to extract handwriting."
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-600" />
                Authentication
              </h2>

              {/* API Key Input */}
              <Input
                label="API Key"
                isPassword={true}
                placeholder="Enter your Provider API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                helperText="Your API Key is stored securely in your browser's extension storage."
              />
            </div>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Reset to Defaults
            </Button>

            <div className="flex items-center gap-3">
              {formSaved && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Settings saved!
                </span>
              )}
              {saveStatusMessage && !formSaved && (
                <span className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {saveStatusMessage}
                </span>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
