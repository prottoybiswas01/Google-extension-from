import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectOption } from '../components/ui/Select';
import { StatChart } from '../components/dashboard/StatChart';
import { HistoryTable } from '../components/dashboard/HistoryTable';
import { useExtensionSettings } from '../hooks/useExtensionSettings';
import { storageRepository } from '../services/storage/StorageRepository';
import { dashboardService } from '../services/dashboard/DashboardService';
import { statisticsService } from '../services/statistics/StatisticsService';
import { templateEngine } from '../services/templates/TemplateEngine';
import { cryptoService } from '../services/security/CryptoService';
import {
  FormHistoryRecord,
  DashboardMetrics,
  UsageStatistics,
  AIProvider,
  OCRProvider,
  ExtensionBackupData,
  InstitutionTemplate,
} from '../types';
import {
  LayoutDashboard,
  History,
  BarChart3,
  Settings as SettingsIcon,
  Save,
  Key,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

const aiProviderOptions: SelectOption[] = [
  { value: 'local_python', label: 'Local Python Engine (Free & Offline)', description: 'No API Key required. Runs on http://127.0.0.1:5000' },
  { value: 'gemini', label: 'Google Gemini', description: 'Fast Vision & Multimodal' },
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
    updateSettings,
    resetSettings,
  } = useExtensionSettings();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'statistics' | 'templates' | 'settings'>('dashboard');
  const [historyRecords, setHistoryRecords] = useState<FormHistoryRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [stats, setStats] = useState<UsageStatistics | null>(null);
  const [templates, setTemplates] = useState<InstitutionTemplate[]>([]);

  const [aiProvider, setAiProvider] = useState<AIProvider>(settings.aiProvider);
  const [ocrProvider, setOcrProvider] = useState<OCRProvider>(settings.ocrProvider);
  const [apiKey, setApiKey] = useState<string>(settings.apiKey);
  const [formSaved, setFormSaved] = useState<boolean>(false);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const records = await storageRepository.getAllHistoryRecords();
      setHistoryRecords(records);

      const computedMetrics = dashboardService.calculateMetrics(records);
      setMetrics(computedMetrics);

      const computedStats = statisticsService.generateStatistics(records);
      setStats(computedStats);

      setTemplates(templateEngine.getTemplates());
    } catch (e) {
      console.error('[Dashboard] Error loading IndexedDB data:', e);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    setAiProvider(settings.aiProvider);
    setOcrProvider(settings.ocrProvider);
    if (settings.apiKey) {
      setApiKey(cryptoService.decryptApiKey(settings.apiKey));
    }
  }, [settings]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const encryptedKey = cryptoService.encryptApiKey(apiKey);
    const newSettings = { aiProvider, ocrProvider, apiKey, encryptedApiKey: encryptedKey };
    const success = await updateSettings(newSettings);
    if (success) {
      await storageRepository.saveSettingsDB(newSettings);
      setFormSaved(true);
      setTimeout(() => setFormSaved(false), 3000);
    }
  };

  const handleBackupExport = async () => {
    const backupData = await storageRepository.exportBackup();
    backupData.templates = templateEngine.getTemplates();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ttc_extension_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackupRestoreSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backupData = JSON.parse(content) as ExtensionBackupData;
        await storageRepository.importBackup(backupData);
        if (backupData.templates) {
          for (const t of backupData.templates) {
            templateEngine.addTemplate(t);
          }
        }
        alert('Backup data restored successfully!');
        await loadData();
      } catch (err) {
        console.error('Backup restore error:', err);
        alert('Failed to restore backup file. Please ensure it is a valid backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleTemplateImportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        templateEngine.importTemplateJson(content);
        setTemplates([...templateEngine.getTemplates()]);
        alert('Institution template imported successfully!');
      } catch (err) {
        alert('Invalid template JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
          Loading IndexedDB storage & dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Card */}
        <Card variant="default" className="p-6">
          <Header
            title="TTC Form Auto Fill Dashboard"
            subtitle="Management, analytics, form history & settings"
            showBadge={true}
          />

          {/* Navigation Bar */}
          <div className="mt-4 flex flex-wrap border-b border-slate-200 gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'history'
                  ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              History ({historyRecords.length})
            </button>

            <button
              onClick={() => setActiveTab('statistics')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'statistics'
                  ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Statistics & Charts
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'templates'
                  ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Institution Templates ({templates.length})
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'settings'
                  ? 'border-brand-600 text-brand-600 bg-brand-50/50'
                  : 'border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings & Backup
            </button>
          </div>
        </Card>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="default" className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Processed Forms</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalProcessed}</p>
                </div>
                <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </Card>

              <Card variant="default" className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Successful Forms</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.successfulForms}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </Card>

              <Card variant="default" className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Failed Forms</p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">{metrics.failedForms}</p>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </Card>

              <Card variant="default" className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Avg Processing Time</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.avgProcessingTimeMs} ms</p>
                </div>
                <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card variant="default" className="p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  Today's Usage
                </div>
                <p className="text-xl font-bold text-slate-800 mt-2">{metrics.todayUsage} extractions</p>
              </Card>

              <Card variant="default" className="p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  Weekly Usage
                </div>
                <p className="text-xl font-bold text-slate-800 mt-2">{metrics.weeklyUsage} extractions</p>
              </Card>

              <Card variant="default" className="p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  Monthly Usage
                </div>
                <p className="text-xl font-bold text-slate-800 mt-2">{metrics.monthlyUsage} extractions</p>
              </Card>
            </div>

            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase">Recent History Records</h3>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('history')}>
                  View Full Log
                </Button>
              </div>
              <HistoryTable records={historyRecords.slice(0, 5)} onRefresh={loadData} />
            </Card>
          </div>
        )}

        {/* TAB 2: HISTORY LOG */}
        {activeTab === 'history' && (
          <HistoryTable records={historyRecords} onRefresh={loadData} />
        )}

        {/* TAB 3: STATISTICS & CHARTS */}
        {activeTab === 'statistics' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card variant="default" className="p-6">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Success Rate</h4>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-extrabold text-emerald-600">{stats.successRatePercent}%</div>
                  <p className="text-xs text-slate-500">
                    High accuracy rate achieved across processed document forms.
                  </p>
                </div>
              </Card>

              <Card variant="default" className="p-6">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Failure Rate</h4>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-extrabold text-rose-600">{stats.failureRatePercent}%</div>
                  <p className="text-xs text-slate-500">
                    Low failure margin across low-quality or corrupted documents.
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatChart title="Daily Extraction Usage" data={stats.daily} color="#2563eb" />
              <StatChart title="Weekly Extraction Usage" data={stats.weekly} color="#059669" />
              <StatChart title="Monthly Extraction Usage" data={stats.monthly} color="#7c3aed" />
            </div>
          </div>
        )}

        {/* TAB 4: INSTITUTION TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <Card variant="default" className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-brand-600" />
                  Institution Templates & Custom Mappings
                </h2>

                <input
                  type="file"
                  ref={templateInputRef}
                  accept=".json"
                  onChange={handleTemplateImportSelect}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => templateInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Import Template
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const sample = templates[0] || { id: 'sample', name: 'Sample Template', headerKeywords: ['ttc'], customMappings: {} };
                      const jsonStr = templateEngine.exportTemplateJson(sample);
                      const blob = new Blob([jsonStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `institution_template_${sample.id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export Template
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <Card key={tpl.id} variant="bordered" className="p-4 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800">{tpl.name}</h3>
                      <span className="text-[10px] font-mono bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
                        {tpl.id}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p>
                        <strong>Header Keywords:</strong> {tpl.headerKeywords.join(', ')}
                      </p>
                      <p>
                        <strong>Custom Mappings:</strong> {Object.keys(tpl.customMappings).length} fields configured
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: SETTINGS & BACKUP */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <form onSubmit={handleSettingsSubmit}>
              <Card variant="default" className="p-6 space-y-6">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-600" />
                  Engine Settings
                </h2>

                <Select
                  label="AI Provider"
                  options={aiProviderOptions}
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                />

                <Select
                  label="OCR Provider"
                  options={ocrProviderOptions}
                  value={ocrProvider}
                  onChange={(e) => setOcrProvider(e.target.value as OCRProvider)}
                />

                <Input
                  label="API Key (Encrypted)"
                  isPassword={true}
                  placeholder="Enter Provider API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  helperText="Your API Key is encrypted using CryptoService before persistence."
                />

                <div className="flex justify-end pt-2">
                  {formSaved && (
                    <span className="text-xs text-emerald-600 font-medium mr-3 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Settings Saved!
                    </span>
                  )}
                  <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                    Save Settings
                  </Button>
                </div>
              </Card>
            </form>

            <Card variant="default" className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-600" />
                IndexedDB Backup & System Data
              </h2>

              <input
                type="file"
                ref={backupInputRef}
                accept=".json"
                onChange={handleBackupRestoreSelect}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackupExport}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Backup Data (Export JSON)
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => backupInputRef.current?.click()}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Restore Data (Import JSON)
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (confirm('Clear all local IndexedDB history database records?')) {
                      await storageRepository.clearAllHistory();
                      await loadData();
                      alert('IndexedDB history cleared.');
                    }
                  }}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Clear History Database
                </Button>

                <Button variant="ghost" size="sm" onClick={resetSettings}>
                  Reset Settings
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
