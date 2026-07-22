import { AIProvider, ExtractedFormData } from '../../types';
import { IAIProvider } from './types';
import { GeminiProvider, sanitizeExtractedFormData } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { localPythonProvider } from './LocalPythonProvider';
import { fieldDetector } from '../fieldDetector';

export class AIService {
  private providers: Record<string, IAIProvider>;

  constructor() {
    this.providers = {
      local_python: localPythonProvider,
      gemini: new GeminiProvider(),
      openai: new OpenAIProvider(),
      claude: new GeminiProvider(),
    };
  }

  /**
   * Processes OCR text and optional image using the selected AI Provider.
   * If local_python is selected or no API key is provided, uses local free extraction engines.
   */
  async extractStructuredData(
    providerType: AIProvider,
    ocrText: string,
    apiKey: string,
    imageDataUrl?: string
  ): Promise<ExtractedFormData> {
    // If provider is local_python, execute local python provider directly
    if (providerType === 'local_python' || !providerType) {
      console.log('[AIService] Executing extraction via Local Python Engine.');
      try {
        return await localPythonProvider.extractData(ocrText, '', imageDataUrl);
      } catch (localPyErr) {
        console.warn('[AIService] Local Python Engine error. Falling back to built-in offline field detector:', localPyErr);
        return this.offlineAiExtraction(ocrText);
      }
    }

    const selectedProvider = this.providers[providerType];
    const defaultProvider = localPythonProvider;
    const provider = selectedProvider || defaultProvider;

    if (!provider) {
      throw new Error('AI Provider initialization failed.');
    }

    // If API Key is provided for cloud provider, execute cloud provider request
    if (apiKey && apiKey.trim().length > 0) {
      console.log(`[AIService] Executing extraction via ${provider.name} with API Key.`);
      try {
        return await provider.extractData(ocrText, apiKey, imageDataUrl);
      } catch (cloudError) {
        console.warn(`[AIService] Cloud provider (${provider.name}) error. Falling back to local offline AI parser:`, cloudError);
      }
    }

    // Fallback Local Offline AI Extractor
    console.log('[AIService] Using local offline AI extractor (No API Key required).');
    return this.offlineAiExtraction(ocrText);
  }

  /**
   * Dynamic Local Offline AI Extractor
   * Maps fields strictly from detected OCR text rules. Unknown or unreadable fields return null.
   */
  private offlineAiExtraction(ocrText: string): ExtractedFormData {
    const detected = fieldDetector.detectFields(ocrText);
    const d = detected.detectedFields;

    const dynamicData: Record<string, unknown> = {
      student_name: d.student_name || null,
      father_name: d.father_name || null,
      mother_name: d.mother_name || null,
      phone: d.phone || null,
      email: d.email || null,
      date_of_birth: d.date_of_birth || null,
      gender: d.gender || null,
      nid: d.nid || null,
      present_address: d.present_address || null,
      permanent_address: d.permanent_address || null,
      course: d.course || null,
      trade: d.trade || null,
      education: d.education || null,
      blood_group: d.blood_group || null,
      religion: d.religion || null,
      nationality: d.nationality || null,
      remarks: d.remarks || null,
    };

    return sanitizeExtractedFormData(dynamicData);
  }
}

export const aiService = new AIService();
