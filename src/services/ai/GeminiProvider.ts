import { IAIProvider } from './types';
import { ExtractedFormData } from '../../types';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';

export class GeminiProvider implements IAIProvider {
  name = 'Google Gemini';

  async extractData(
    ocrText: string,
    apiKey: string,
    imageDataUrl?: string
  ): Promise<ExtractedFormData> {
    if (!apiKey) {
      throw new Error(
        'Gemini API key is required. Please add your Google Gemini API key in Extension Settings.'
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const contentsParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(ocrText)}` },
    ];

    if (imageDataUrl && imageDataUrl.includes('base64,')) {
      const mimeType = imageDataUrl.substring(imageDataUrl.indexOf(':') + 1, imageDataUrl.indexOf(';'));
      const base64Data = imageDataUrl.split(',')[1];
      if (base64Data) {
        contentsParts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: base64Data,
          },
        });
      }
    }

    const requestBody = {
      contents: [{ parts: contentsParts }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errJson = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(
        errJson.error?.message || `Gemini API request failed with status code ${response.status}`
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Gemini API returned an empty response.');
    }

    return this.parseAndValidateJson(responseText);
  }

  private parseAndValidateJson(rawText: string): ExtractedFormData {
    const cleanedText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      const parsed = JSON.parse(cleanedText) as Record<string, unknown>;
      return sanitizeExtractedFormData(parsed);
    } catch (e) {
      console.error('[Gemini JSON Parsing Error]:', e, rawText);
      throw new Error('Failed to parse structured JSON from Gemini response.');
    }
  }
}

export function sanitizeExtractedFormData(parsed: Record<string, unknown>): ExtractedFormData {
  const getStr = (val: unknown): string | null => {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'undefined') {
      return null;
    }
    return str;
  };

  return {
    student_name: getStr(parsed.student_name),
    father_name: getStr(parsed.father_name),
    mother_name: getStr(parsed.mother_name),
    phone: getStr(parsed.phone),
    email: getStr(parsed.email),
    date_of_birth: getStr(parsed.date_of_birth),
    gender: getStr(parsed.gender),
    nid: getStr(parsed.nid),
    present_address: getStr(parsed.present_address),
    permanent_address: getStr(parsed.permanent_address),
    course: getStr(parsed.course),
    trade: getStr(parsed.trade),
    education: getStr(parsed.education),
    blood_group: getStr(parsed.blood_group),
    religion: getStr(parsed.religion),
    nationality: getStr(parsed.nationality),
    remarks: getStr(parsed.remarks),
  };
}
