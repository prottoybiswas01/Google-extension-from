import { AIProvider, ExtractedFormData } from '../../types';
import { IAIProvider } from './types';
import { GeminiProvider } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';

export class AIService {
  private providers: Record<string, IAIProvider>;

  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      openai: new OpenAIProvider(),
      claude: new GeminiProvider(), // Default fallback to Gemini format
    };
  }

  /**
   * Processes OCR text and optional image using the selected AI Provider.
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

    console.log(`[AIService] Executing extraction via ${provider.name}`);

    if (!apiKey || apiKey.trim() === '') {
      throw new Error(
        `API Key missing for ${provider.name}. Please open Settings and enter your API Key.`
      );
    }

    return await provider.extractData(ocrText, apiKey, imageDataUrl);
  }
}

export const aiService = new AIService();
