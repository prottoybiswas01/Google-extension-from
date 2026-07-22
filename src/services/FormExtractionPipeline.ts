import { ExtensionSettings, PipelineProgressState, ExtractedFormData } from '../types';
import { validateImageFile, compressImage } from '../utils/imagePipeline';
import { cleanOcrText } from '../utils/textCleaner';
import { fieldDetector } from './fieldDetector';
import { ocrService } from './ocr/OCRService';
import { aiService } from './ai/AIService';
import { historyService } from './history/HistoryService';
import { pdfService } from './pdf/PDFService';

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
      const startTime = Date.now();

      // ----------------------------------------------------
      // Stage 1 & 2: Image Validation & Pre-processing
      // ----------------------------------------------------
      onProgress({
        step: 'preprocessing',
        progressPercent: 15,
        statusMessage: 'Stage 2/7: Pre-processing document & scaling...',
      });

      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid document file.');
      }

      let processingBlob: Blob = imageFile;
      let pdfExtractedText = '';

      // If document is PDF, convert to image canvas first
      if (pdfService.isPdfFile(imageFile)) {
        const pdfRes = await pdfService.convertPdfToImages(imageFile);
        if (pdfRes.imageBlobs[0]) {
          processingBlob = pdfRes.imageBlobs[0];
        }
        pdfExtractedText = pdfRes.extractedText;
      }

      const compressionResult = await compressImage(processingBlob, 1600, 0.85);

      // ----------------------------------------------------
      // Stage 3: OCR Execution
      // ----------------------------------------------------
      onProgress({
        step: 'ocr',
        progressPercent: 35,
        statusMessage: 'Stage 3/7: Running local client-side WASM OCR text recognition...',
      });

      let rawOcrText = await ocrService.extractText(
        'tesseract_wasm',
        compressionResult.compressedBlob,
        '',
        (ocrProgressPercent) => {
          const scaledPercent = Math.min(35 + Math.round(ocrProgressPercent * 0.25), 60);
          onProgress({
            step: 'ocr',
            progressPercent: scaledPercent,
            statusMessage: `Stage 3/7: Recognizing document text (${ocrProgressPercent}%)...`,
          });
        }
      );

      if (pdfExtractedText && pdfExtractedText.trim().length > 0) {
        rawOcrText = `${pdfExtractedText}\n${rawOcrText}`;
      }

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
      // Stage 6: Field Extraction & Sanitization
      // ----------------------------------------------------
      onProgress({
        step: 'ai_validation',
        progressPercent: 90,
        statusMessage: 'Stage 6/7: Extracting form fields locally in browser...',
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
        settings.aiProvider || 'local_browser',
        promptContextText,
        settings.apiKey || '',
        compressionResult.dataUrl
      );

      const processingTimeMs = Date.now() - startTime;

      // Persist to IndexedDB history
      try {
        await historyService.recordExtraction(
          compressionResult.dataUrl,
          structuredResult,
          'success',
          processingTimeMs
        );
      } catch (err) {
        console.warn('[Pipeline] Failed to save history to IndexedDB:', err);
      }

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
