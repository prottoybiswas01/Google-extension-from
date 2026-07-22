import { IAIProvider } from './types';
import { ExtractedFormData } from '../../types';
import { sanitizeExtractedFormData } from './GeminiProvider';

export class LocalPythonProvider implements IAIProvider {
  name = 'Local Python Engine (Free & Offline)';

  private primaryUrl = 'http://127.0.0.1:5000/api/extract';
  private fallbackUrl = 'http://localhost:5000/api/extract';
  private healthUrl = 'http://127.0.0.1:5000/api/health';

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(this.healthUrl, { method: 'GET' });
      return res.ok;
    } catch {
      try {
        const res2 = await fetch('http://localhost:5000/api/health', { method: 'GET' });
        return res2.ok;
      } catch {
        return false;
      }
    }
  }

  async extractData(
    ocrText: string,
    _apiKey: string,
    imageDataUrl?: string
  ): Promise<ExtractedFormData> {
    const payload: { image?: string; text?: string } = {};

    if (imageDataUrl) {
      payload.image = imageDataUrl;
    }
    if (ocrText) {
      payload.text = ocrText;
    }

    let response: Response | null = null;
    let lastError: Error | null = null;

    // Try 127.0.0.1 first
    try {
      response = await fetch(this.primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // Try localhost fallback if primary failed
    if (!response || !response.ok) {
      try {
        response = await fetch(this.fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        if (!lastError) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }
    }

    if (!response || !response.ok) {
      const statusMsg = response ? `Status ${response.status}` : lastError?.message || 'Network failure';
      throw new Error(
        `Could not connect to Local Python Server (${statusMsg}). Please ensure 'run_server.bat' is running.`
      );
    }

    const resJson = (await response.json()) as {
      success?: boolean;
      data?: Record<string, unknown>;
      error?: string;
    };

    if (!resJson.success || !resJson.data) {
      throw new Error(resJson.error || 'Local Python Engine returned empty extraction data.');
    }

    return sanitizeExtractedFormData(resJson.data);
  }
}

export const localPythonProvider = new LocalPythonProvider();
