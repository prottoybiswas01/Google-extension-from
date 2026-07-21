import { IAIProvider } from './types';
import { ExtractedFormData } from '../../types';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import { sanitizeExtractedFormData } from './GeminiProvider';

export class OpenAIProvider implements IAIProvider {
  name = 'OpenAI (GPT-4o)';

  async extractData(
    ocrText: string,
    apiKey: string,
    imageDataUrl?: string
  ): Promise<ExtractedFormData> {
    if (!apiKey) {
      throw new Error(
        'OpenAI API key is missing. Please enter your OpenAI API Key in Extension Settings.'
      );
    }

    const messages: Array<{
      role: 'system' | 'user';
      content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (imageDataUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: buildUserPrompt(ocrText) },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: buildUserPrompt(ocrText),
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages,
      }),
    });

    if (!response.ok) {
      const errJson = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(
        errJson.error?.message || `OpenAI API returned status error ${response.status}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string };
      }>;
    };

    const responseContent = data.choices?.[0]?.message?.content;
    if (!responseContent) {
      throw new Error('OpenAI API returned an empty completion.');
    }

    try {
      const parsed = JSON.parse(responseContent) as Record<string, unknown>;
      return sanitizeExtractedFormData(parsed);
    } catch (e) {
      console.error('[OpenAI JSON Parse Error]:', e, responseContent);
      throw new Error('Failed to parse structured JSON response from OpenAI.');
    }
  }
}
