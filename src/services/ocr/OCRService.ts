import { tesseractOCRProvider } from './providers/tesseract';

export class OCRService {
  /**
   * Performs 100% local client-side OCR on the provided image/canvas using Tesseract.js WASM.
   */
  async extractText(
    _providerType: string,
    image: Blob | string,
    _apiKey?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    console.log('[OCRService] Running local client-side WASM OCR text recognition.');
    return await tesseractOCRProvider.extractText(image, '', onProgress);
  }
}

export const ocrService = new OCRService();
