/**
 * Automatic Institution & Form Header Detector
 */

export interface DetectedInstitution {
  name: string;
  confidence: number;
  templateId?: string;
}

export class InstitutionDetector {
  private knownInstitutions = [
    { name: 'Technical Training Center (TTC)', keywords: ['ttc', 'technical training center', 'কারিগরি প্রশিক্ষণ কেন্দ্র'] },
    { name: 'Bangladesh Technical Education Board (BTEB)', keywords: ['bteb', 'technical education board', 'কারিগরি শিক্ষা বোর্ড'] },
    { name: 'Polytechnic Institute', keywords: ['polytechnic', 'পলিটেকনিক ইনস্টিটিউট'] },
  ];

  /**
   * Auto detects institution from raw OCR text.
   */
  detectInstitution(ocrText: string): DetectedInstitution {
    if (!ocrText) {
      return { name: 'Generic Application Form', confidence: 0.5 };
    }

    const textLower = ocrText.toLowerCase();

    for (const inst of this.knownInstitutions) {
      for (const kw of inst.keywords) {
        if (textLower.includes(kw)) {
          return {
            name: inst.name,
            confidence: 0.9,
          };
        }
      }
    }

    return { name: 'Standard Form Document', confidence: 0.7 };
  }
}

export const institutionDetector = new InstitutionDetector();
