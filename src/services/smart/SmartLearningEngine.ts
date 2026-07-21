import { ExtractedFormData } from '../../types';

export class SmartLearningEngine {
  private learnedMappings: Map<string, string> = new Map();

  /**
   * Learns from manual user edits to improve future field predictions.
   */
  learnCorrection(fieldKey: keyof ExtractedFormData, originalValue: string | null, correctedValue: string): void {
    if (originalValue && correctedValue) {
      this.learnedMappings.set(originalValue.toLowerCase().trim(), correctedValue.trim());
      console.log(`[SmartLearning] Learned correction for ${fieldKey}: ${originalValue} -> ${correctedValue}`);
    }
  }

  /**
   * Predicts or suggests correction for an unreadable or low confidence value.
   */
  predictCorrection(value: string | null): string | null {
    if (!value) return null;
    const lookup = this.learnedMappings.get(value.toLowerCase().trim());
    return lookup || value;
  }

  /**
   * Detects duplicate form extractions based on student name and phone.
   */
  isDuplicateForm(a: ExtractedFormData, b: ExtractedFormData): boolean {
    if (!a.phone || !b.phone) return false;
    const phoneMatch = a.phone.replace(/\D/g, '') === b.phone.replace(/\D/g, '');
    const nameMatch = a.student_name && b.student_name && a.student_name.toLowerCase() === b.student_name.toLowerCase();
    return Boolean(phoneMatch || nameMatch);
  }
}

export const smartLearningEngine = new SmartLearningEngine();
