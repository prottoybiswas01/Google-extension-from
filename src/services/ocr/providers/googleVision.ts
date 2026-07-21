import { IOCRProvider } from '../types';
import { blobToBase64 } from '../../../utils/imagePipeline';

export class GoogleVisionOCRProvider implements IOCRProvider {
  name = 'Google Cloud Vision API';

  async extractText(
    image: Blob | string,
    apiKey?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (!apiKey) {
      throw new Error(
        'Google Cloud Vision API key is missing. Please configure your API key in Extension Settings.'
      );
    }

    try {
      if (onProgress) onProgress(20);

      let base64Content = '';
      if (typeof image === 'string') {
        base64Content = image.includes(',') ? image.split(',')[1] ?? '' : image;
      } else {
        base64Content = await blobToBase64(image);
      }

      if (onProgress) onProgress(40);

      const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Content },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            },
          ],
        }),
      });

      if (onProgress) onProgress(80);

      if (!response.ok) {
        const errJson = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(
          errJson.error?.message || `Google Cloud Vision request failed with status ${response.status}`
        );
      }

      const data = (await response.json()) as {
        responses?: Array<{
          fullTextAnnotation?: { text?: string };
          textAnnotations?: Array<{ description?: string }>;
        }>;
      };

      const text =
        data.responses?.[0]?.fullTextAnnotation?.text ||
        data.responses?.[0]?.textAnnotations?.[0]?.description ||
        '';

      if (onProgress) onProgress(100);
      return text.trim();
    } catch (error) {
      console.log('[Google Vision Provider Notice]:', error instanceof Error ? error.message : error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to process image with Google Vision OCR.'
      );
    }
  }
}
