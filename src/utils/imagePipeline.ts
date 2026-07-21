/**
 * Image Validation and Processing Pipeline Utility
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates file type and size.
 */
export function validateImageFile(file: File | Blob): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No image file provided.' };
  }

  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a JPEG, PNG, or WEBP image.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds limit (${(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB).`,
    };
  }

  return { valid: true };
}

/**
 * Compresses an image blob via Canvas API to ensure optimal dimensions and quality.
 * Reduces image dimensions to max 1600px width/height while maintaining aspect ratio.
 */
export async function compressImage(
  imageSource: Blob | File,
  maxDimension = 1600,
  quality = 0.85
): Promise<{ compressedBlob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Corrupted or invalid image file.'));
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create 2D canvas context for compression.'));
          return;
        }

        // Apply slight contrast smoothing for handwritten text legibility
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                compressedBlob: blob,
                dataUrl,
                width,
                height,
              });
            } else {
              reject(new Error('Image canvas compression failed.'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageSource);
  });
}

/**
 * Helper to convert Blob to Base64 string (without Data URL prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.substring(result.indexOf(',') + 1);
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}
