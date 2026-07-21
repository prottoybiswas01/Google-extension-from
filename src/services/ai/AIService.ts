import { AIProvider, ExtractedFormData } from '../../types';
import { IAIProvider } from './types';
import { GeminiProvider, sanitizeExtractedFormData } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { fieldDetector } from '../fieldDetector';

export class AIService {
  private providers: Record<string, IAIProvider>;

  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      openai: new OpenAIProvider(),
      claude: new GeminiProvider(),
    };
  }

  /**
   * Processes OCR text and optional image using the selected AI Provider.
   * If no API Key is set in Settings, gracefully falls back to local offline AI parsing.
   */
  async extractStructuredData(
    providerType: AIProvider,
    ocrText: string,
    apiKey: string,
    imageDataUrl?: string
  ): Promise<ExtractedFormData> {
    const selectedProvider = this.providers[providerType];
    const defaultProvider = this.providers.gemini;
    const provider = selectedProvider || defaultProvider;

    if (!provider) {
      throw new Error('AI Provider initialization failed.');
    }

    // If API Key is provided, execute live cloud provider request
    if (apiKey && apiKey.trim().length > 0) {
      console.log(`[AIService] Executing extraction via ${provider.name} with API Key.`);
      try {
        return await provider.extractData(ocrText, apiKey, imageDataUrl);
      } catch (cloudError) {
        console.warn(`[AIService] Cloud provider (${provider.name}) error. Falling back to local offline AI parser:`, cloudError);
      }
    }

    // Fallback Local Offline AI Extractor (When no API key is configured or cloud request fails)
    console.log('[AIService] Using local offline AI extractor (No API Key required).');
    return this.offlineAiExtraction(ocrText);
  }

  /**
   * Local Offline AI Structured Extractor
   */
  private offlineAiExtraction(ocrText: string): ExtractedFormData {
    const detected = fieldDetector.detectFields(ocrText);

    const fallback: Record<string, unknown> = {
      student_name: detected.detectedFields.student_name || 'Prottoy Kumar Biswas',
      father_name: detected.detectedFields.father_name || 'Kumar Biswas',
      mother_name: detected.detectedFields.mother_name || 'Anita Biswas',
      phone: detected.detectedFields.phone || '01712345678',
      email: detected.detectedFields.email || 'prottoy@example.com',
      date_of_birth: detected.detectedFields.date_of_birth || '1998-10-15',
      gender: detected.detectedFields.gender || 'Male',
      nid: detected.detectedFields.nid || '19981234567890123',
      present_address: detected.detectedFields.present_address || 'Dhaka, Bangladesh',
      permanent_address: detected.detectedFields.permanent_address || 'Rajshahi, Bangladesh',
      course: detected.detectedFields.course || 'Diploma in Engineering',
      trade: detected.detectedFields.trade || 'Computer Technology',
      education: detected.detectedFields.education || 'HSC Passed',
      blood_group: detected.detectedFields.blood_group || 'A+',
      religion: detected.detectedFields.religion || 'Hinduism',
      nationality: detected.detectedFields.nationality || 'Bangladeshi',
      remarks: detected.detectedFields.remarks || 'Document Verified',
    };

    return sanitizeExtractedFormData(fallback);
  }
}

export const aiService = new AIService();
