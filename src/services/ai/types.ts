import { ExtractedFormData } from '../../types';

export interface IAIProvider {
  name: string;
  extractData(
    ocrText: string,
    apiKey: string,
    imageDataUrl?: string
  ): Promise<ExtractedFormData>;
}
