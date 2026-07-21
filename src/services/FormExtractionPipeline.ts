import { ExtensionSettings, PipelineProgressState, ExtractedFormData } from '../types';
import { validateImageFile, compressImage } from '../utils/imagePipeline';
import { cleanOcrText } from '../utils/textCleaner';
import { fieldDetector } from './fieldDetector';
import { ocrService } from './ocr/OCRService';
import { aiService } from './ai/AIService';

export class FormExtractionPipeline {
  /**
   * Executes the 7-Stage Form Extraction Pipeline:
   * 1. Image ➔ 2. Pre-processing ➔ 3. OCR ➔ 4. Text Cleaning ➔ 5. Field Detection ➔ 6. AI Validation ➔ 7. Structured JSON
   */
  async executePipeline(
    imageFile: Blob | File,
    settings: ExtensionSettings,
    onProgress: (state: PipelineProgressState) => void
  ): Promise<ExtractedFormData> {
    try {
      // ----------------------------------------------------
      // Stage 1 & 2: Image Validation & Pre-processing
      // ----------------------------------------------------
      onProgress({
        step: 'preprocessing',
        progressPercent: 15,
        statusMessage: 'Stage 2/7: Pre-processing image & scaling...',
      });

      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid image file.');
      }

      const compressionResult = await compressImage(imageFile, 1600, 0.85);

      // ----------------------------------------------------
      // Stage 3: OCR Execution
      // ----------------------------------------------------
      onProgress({
        step: 'ocr',
        progressPercent: 35,
        statusMessage: `Stage 3/7: Running OCR text recognition (${settings.ocrProvider})...`,
      });

      const rawOcrText = await ocrService.extractText(
        settings.ocrProvider,
        compressionResult.compressedBlob,
        settings.apiKey,
        (ocrProgressPercent) => {
          const scaledPercent = Math.min(35 + Math.round(ocrProgressPercent * 0.25), 60);
          onProgress({
            step: 'ocr',
            progressPercent: scaledPercent,
            statusMessage: `Stage 3/7: Recognizing OCR text (${ocrProgressPercent}%)...`,
          });
        }
      );

      // ----------------------------------------------------
      // Stage 4: Text Cleaning
      // ----------------------------------------------------
      onProgress({
        step: 'text_cleaning',
        progressPercent: 65,
        statusMessage: 'Stage 4/7: Cleaning OCR noise & stripping artifacts...',
        extractedText: rawOcrText,
      });

      const cleanedText = cleanOcrText(rawOcrText);

      // ----------------------------------------------------
      // Stage 5: Field Detection
      // ----------------------------------------------------
      onProgress({
        step: 'field_detection',
        progressPercent: 78,
        statusMessage: 'Stage 5/7: Detecting form labels & key-value pairs...',
        extractedText: rawOcrText,
        cleanedText,
      });

      const detectionResult = fieldDetector.detectFields(cleanedText);

      // ----------------------------------------------------
      // Stage 6: AI Validation & Ambiguity Resolution
      // ----------------------------------------------------
      onProgress({
        step: 'ai_validation',
        progressPercent: 90,
        statusMessage: `Stage 6/7: AI validating fields (${settings.aiProvider})...`,
        extractedText: rawOcrText,
        cleanedText,
        detectedFields: detectionResult.detectedFields,
      });

      const promptContextText = `
Cleaned OCR Text:
${cleanedText}

Detected Fields Hint:
${JSON.stringify(detectionResult.detectedFields, null, 2)}
`.trim();

      const structuredResult = await aiService.extractStructuredData(
        settings.aiProvider,
        promptContextText,
        settings.apiKey,
        compressionResult.dataUrl
      );

      // ----------------------------------------------------
      // Stage 7: Structured JSON Output
      // ----------------------------------------------------
      onProgress({
        step: 'success',
        progressPercent: 100,
        statusMessage: 'Stage 7/7: Structured JSON generated!',
        extractedText: rawOcrText,
        cleanedText,
        detectedFields: detectionResult.detectedFields,
        resultData: structuredResult,
      });

      return structuredResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during 7-stage pipeline execution.';

      console.error('[Pipeline Execution Error]:', error);

      onProgress({
        step: 'error',
        progressPercent: 0,
        statusMessage: 'Pipeline execution failed.',
        error: errorMessage,
      });

      throw error;
    }
  }
}

export const formExtractionPipeline = new FormExtractionPipeline();
