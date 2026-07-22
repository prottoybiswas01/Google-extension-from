import { IAIProvider } from './types';
import { ExtractedFormData } from '../../types';
import { sanitizeExtractedFormData } from './GeminiProvider';

export class LocalPythonProvider implements IAIProvider {
  name = 'Local Python Engine (Free & Offline)';

  private serverUrl = 'http://127.0.0.1:5000/api/extract';
  private healthUrl = 'http://127.0.0.1:5000/api/health';

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(this.healthUrl, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async extractData(
    ocrText: string,
    _apiKey: string,
    imageDataUrl?: string
  ): Promise<ExtractedFormData> {
    try {
      const payload: { image?: string; text?: string } = {};

      if (imageDataUrl) {
        payload.image = imageDataUrl;
      }
      if (ocrText) {
        payload.text = ocrText;
      }

      const response = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Local Python Server returned status code ${response.status}. Please make sure 'run_server.bat' is running on your PC.`
        );
      }

      const resJson = (await response.json()) as {
        success?: boolean;
        data?: Record<string, unknown>;
        error?: string;
      };

      if (!resJson.success || !resJson.data) {
        throw new Error(resJson.error || 'Local Python Engine failed to process form payload.');
      }

      return sanitizeExtractedFormData(resJson.data);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error(
          "Could not connect to Local Python Server at http://127.0.0.1:5000. Please launch 'run_server.bat' or run 'python python_server/server.py' on your computer."
        );
      }
      throw err;
    }
  }
}

export const localPythonProvider = new LocalPythonProvider();
