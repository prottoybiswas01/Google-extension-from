/**
 * Supported AI Providers for form processing
 */
export type AIProvider = 'openai' | 'gemini' | 'claude';

/**
 * Supported OCR Engine Providers
 */
export type OCRProvider = 'tesseract' | 'google_cloud' | 'custom_api';

/**
 * Extension Settings Configuration Interface
 */
export interface ExtensionSettings {
  aiProvider: AIProvider;
  ocrProvider: OCRProvider;
  apiKey: string;
  encryptedApiKey?: string;
  theme?: ThemeMode;
}

/**
 * Theme Mode for Light / Dark Mode Toggle
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Image Upload Status types for Popup UI
 */
export type FormUploadStatus = 'idle' | 'uploading' | 'ready' | 'error';

/**
 * Structure of uploaded form image metadata
 */
export interface UploadedFileData {
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  blob: Blob;
  rawFile?: File;
}

/**
 * Standardized 17-field Form Data extracted from handwritten documents.
 * Unknown or unreadable fields MUST be null.
 */
export interface ExtractedFormData {
  student_name: string | null;
  father_name: string | null;
  mother_name: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nid: string | null;
  present_address: string | null;
  permanent_address: string | null;
  course: string | null;
  trade: string | null;
  education: string | null;
  blood_group: string | null;
  religion: string | null;
  nationality: string | null;
  remarks: string | null;
}

/**
 * Institution Template Definition (Phase 6)
 */
export interface InstitutionTemplate {
  id: string;
  name: string;
  headerKeywords: string[];
  customMappings: Partial<Record<keyof ExtractedFormData, string>>;
}

/**
 * Batch Processing Queue Item (Phase 6)
 */
export interface BatchItem {
  id: string;
  file: File;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  progress: number;
  result?: ExtractedFormData;
  error?: string;
}

/**
 * Notification Item Contract (Phase 6)
 */
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
}

/**
 * Confidence Levels for Review Screen
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Field Status options for Review Screen
 */
export type FieldStatus = 'matched' | 'edited' | 'ignored' | 'missing';

/**
 * Review Item Interface for Phase 4 Field Editor
 */
export interface FieldReviewItem {
  key: keyof ExtractedFormData;
  label: string;
  value: string | null;
  originalValue: string | null;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  status: FieldStatus;
  validationError?: string;
  required?: boolean;
}

/**
 * Metrics summary for Phase 4 Review Page
 */
export interface ReviewSummaryMetrics {
  totalFields: number;
  matchedCount: number;
  missingCount: number;
  editedCount: number;
  ignoredCount: number;
  overallConfidenceScore: number;
}

/**
 * Form History Record stored in IndexedDB (Phase 5)
 */
export interface FormHistoryRecord {
  id: string;
  uploadedImage: string;
  extractedJson: ExtractedFormData;
  date: string;
  timestamp: number;
  institution: string;
  status: 'success' | 'failed';
  processingTimeMs: number;
}

/**
 * Dashboard Metrics Interface (Phase 5)
 */
export interface DashboardMetrics {
  totalProcessed: number;
  successfulForms: number;
  failedForms: number;
  avgProcessingTimeMs: number;
  todayUsage: number;
  weeklyUsage: number;
  monthlyUsage: number;
}

/**
 * Chart Data Point Interface
 */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/**
 * Usage Statistics for Charts (Phase 5)
 */
export interface UsageStatistics {
  daily: ChartDataPoint[];
  weekly: ChartDataPoint[];
  monthly: ChartDataPoint[];
  successRatePercent: number;
  failureRatePercent: number;
}

/**
 * Full Extension Backup Package Interface
 */
export interface ExtensionBackupData {
  version: string;
  exportDate: string;
  settings: ExtensionSettings;
  history: FormHistoryRecord[];
  templates?: InstitutionTemplate[];
}

/**
 * 7-Stage Pipeline Execution Steps
 */
export type ProcessingStep =
  | 'idle'
  | 'preprocessing'
  | 'ocr'
  | 'text_cleaning'
  | 'field_detection'
  | 'ai_validation'
  | 'success'
  | 'error';

/**
 * Pipeline State & Progress details
 */
export interface PipelineProgressState {
  step: ProcessingStep;
  progressPercent: number;
  statusMessage: string;
  extractedText?: string;
  cleanedText?: string;
  detectedFields?: Partial<ExtractedFormData>;
  resultData?: ExtractedFormData;
  error?: string;
}

/**
 * Inter-process message actions between Popup/Options and Service Worker
 */
export type MessageAction = 'GET_SETTINGS' | 'SAVE_SETTINGS' | 'PING';

/**
 * Generic extension message structure
 */
export interface ExtensionMessage<T = Record<string, unknown>> {
  action: MessageAction;
  payload?: T;
}

/**
 * Extension message response contract
 */
export interface ExtensionResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
}
