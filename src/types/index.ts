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
}

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
