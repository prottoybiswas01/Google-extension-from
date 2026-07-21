/**
 * Stage 4: OCR Text Cleaning & Artifact Stripping Utility
 */

export function cleanOcrText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  let cleaned = rawText;

  // 1. Remove non-printable control characters
  cleaned = cleaned.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // 2. Remove common OCR scanner artifacts (~, ^, |, ``, {}, [])
  cleaned = cleaned.replace(/[~^|`\\\[\]{}]/g, ' ');

  // 3. Remove sequences of random isolated punctuation noise (e.g. "... ,, --")
  cleaned = cleaned.replace(/([.,:;!?\-_])\1{2,}/g, '$1');

  // 4. Normalize multiple spaces into single spaces
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // 5. Clean empty lines or lines with only 1-2 random noise characters
  const cleanedLines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (line.length === 0) return false;
      // Filter out lines that consist purely of non-alphanumeric noise
      if (line.length <= 2 && /^[^a-zA-Z0-9\u0980-\u09FF]+$/.test(line)) {
        return false;
      }
      return true;
    });

  return cleanedLines.join('\n');
}
