/**
 * Barcode Scanning and Decoding Service (Code128, EAN-13, Code39)
 */

export class BarcodeService {
  /**
   * Scans document canvas or image for linear barcode values.
   */
  async scanBarcode(imageSource: Blob | string): Promise<string | null> {
    try {
      if ('BarcodeDetector' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13'],
        });
        const img = await this.loadImage(imageSource);
        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0) {
          return barcodes[0].rawValue || null;
        }
      }
    } catch (e) {
      console.warn('[BarcodeService] Scan error:', e);
    }
    return null;
  }

  private loadImage(source: Blob | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      if (typeof source === 'string') {
        img.src = source;
      } else {
        img.src = URL.createObjectURL(source);
      }
    });
  }
}

export const barcodeService = new BarcodeService();
