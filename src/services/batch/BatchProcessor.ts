import { BatchItem, ExtensionSettings, ExtractedFormData } from '../../types';
import { formExtractionPipeline } from '../FormExtractionPipeline';

export class BatchProcessor {
  /**
   * Processes a list of BatchItem files sequentially or with concurrency limits.
   */
  async processBatch(
    items: BatchItem[],
    settings: ExtensionSettings,
    onItemUpdate: (updatedItem: BatchItem) => void
  ): Promise<ExtractedFormData[]> {
    const results: ExtractedFormData[] = [];

    for (const item of items) {
      item.status = 'processing';
      item.progress = 10;
      onItemUpdate({ ...item });

      try {
        const result = await formExtractionPipeline.executePipeline(
          item.file,
          settings,
          (progressState) => {
            item.progress = progressState.progressPercent;
            onItemUpdate({ ...item });
          }
        );

        item.status = 'success';
        item.progress = 100;
        item.result = result;
        onItemUpdate({ ...item });
        results.push(result);
      } catch (err) {
        item.status = 'failed';
        item.error = err instanceof Error ? err.message : 'Batch item extraction failed.';
        onItemUpdate({ ...item });
      }
    }

    return results;
  }
}

export const batchProcessor = new BatchProcessor();
