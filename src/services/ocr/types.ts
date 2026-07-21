/**
 * OCR Provider Interface (Strategy Pattern)
 */
export interface IOCRProvider {
  name: string;
  extractText(
    image: Blob | string,
    apiKey?: string,
    onProgress?: (progress: number) => void
  ): Promise<string>;
}
