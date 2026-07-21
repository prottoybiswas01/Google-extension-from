/**
 * QR Code Detection and Decoding Service
 */

export class QRService {
  /**
   * Scans an image blob or HTMLImageElement for embedded QR code data.
   */
  async scanQrCode(imageSource: Blob | string): Promise<string | null> {
    try {
      // Use native BarcodeDetector API if supported in Chromium
      if ('BarcodeDetector' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const img = await this.loadImage(imageSource);
        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0) {
          return barcodes[0].rawValue || null;
        }
      }
    } catch (e) {
      console.warn('[QRService] BarcodeDetector scan failed or not supported:', e);
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

export const qrService = new QRService();
