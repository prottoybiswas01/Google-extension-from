import { createWorker } from 'tesseract.js';
import { IOCRProvider } from '../types';

export class TesseractOCRProvider implements IOCRProvider {
  name = 'Tesseract.js (Local Offline)';

  async extractText(
    image: Blob | string,
    _apiKey?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    let worker;
    try {
      if (onProgress) onProgress(10);
      worker = await createWorker('eng');

      if (onProgress) onProgress(40);
      const ret = await worker.recognize(image);

      if (onProgress) onProgress(90);
      const extractedText = ret.data.text ? ret.data.text.trim() : '';

      if (onProgress) onProgress(100);
      return extractedText;
    } catch (error) {
      console.error('[OCR Tesseract Error]:', error);
      throw new Error(
        `Local OCR process failed: ${error instanceof Error ? error.message : 'Unknown OCR error'}`
      );
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }
}
