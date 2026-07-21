import { OCRProvider } from '../../types';
import { IOCRProvider } from './types';
import { TesseractOCRProvider } from './providers/tesseract';
import { GoogleVisionOCRProvider } from './providers/googleVision';

export class OCRService {
  private providers: Record<OCRProvider, IOCRProvider>;

  constructor() {
    this.providers = {
      tesseract: new TesseractOCRProvider(),
      google_cloud: new GoogleVisionOCRProvider(),
      custom_api: new TesseractOCRProvider(),
    };
  }

  /**
   * Performs OCR on the provided image using selected provider.
   */
  async extractText(
    providerType: OCRProvider,
    image: Blob | string,
    apiKey?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const selectedProvider = this.providers[providerType];
    const defaultProvider = this.providers.tesseract;
    const provider = selectedProvider || defaultProvider;

    console.log(`[OCRService] Running OCR with provider: ${provider.name}`);

    try {
      const rawText = await provider.extractText(image, apiKey, onProgress);
      if (!rawText || rawText.trim().length === 0) {
        console.log('[OCRService] Primary provider returned empty result. Retrying with Tesseract...');
        if (providerType !== 'tesseract') {
          return await this.providers.tesseract.extractText(image, apiKey, onProgress);
        }
      }
      return rawText;
    } catch (primaryError) {
      console.log(`[OCRService] Primary OCR provider note (${providerType}). Falling back to Tesseract OCR engine.`);
      if (providerType !== 'tesseract') {
        return await this.providers.tesseract.extractText(image, apiKey, onProgress);
      }
      throw primaryError;
    }
  }
}

export const ocrService = new OCRService();
