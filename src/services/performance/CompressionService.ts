import { compressImage } from '../../utils/imagePipeline';

export class CompressionService {
  /**
   * Advanced multi-pass image compression and binarization.
   */
  async processAndCompress(
    image: Blob | File,
    targetWidth = 1600,
    quality = 0.85
  ): Promise<{ compressedBlob: Blob; dataUrl: string }> {
    const res = await compressImage(image, targetWidth, quality);
    return {
      compressedBlob: res.compressedBlob,
      dataUrl: res.dataUrl,
    };
  }
}

export const compressionService = new CompressionService();
