import { ExtractedFormData } from '../../types';

/**
 * Real-time Field Validation Engine for Phase 4 Review Screen
 */

export interface ValidationRuleResult {
  isValid: boolean;
  error?: string;
}

export class ValidationEngine {
  /**
   * Validates a single field value based on its key and value.
   */
  validateField(key: keyof ExtractedFormData, value: string | null, isIgnored = false): ValidationRuleResult {
    if (isIgnored) {
      return { isValid: true };
    }

    // Required fields check
    const requiredFields: Array<keyof ExtractedFormData> = ['student_name', 'phone'];
    if (requiredFields.includes(key) && (!value || value.trim() === '')) {
      return {
        isValid: false,
        error: 'This field is required.',
      };
    }

    if (!value || value.trim() === '') {
      return { isValid: true };
    }

    const trimmed = value.trim();

    switch (key) {
      case 'phone':
        return this.validatePhone(trimmed);

      case 'email':
        return this.validateEmail(trimmed);

      case 'nid':
        return this.validateNid(trimmed);

      case 'date_of_birth':
        return this.validateDate(trimmed);

      default:
        return { isValid: true };
    }
  }

  private validatePhone(phone: string): ValidationRuleResult {
    // Strips spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    const phoneRegex = /^(?:\+?88)?01[3-9]\d{8}$|^[0-9]{10,15}$/;
    if (!phoneRegex.test(cleaned)) {
      return {
        isValid: false,
        error: 'Invalid phone number format (e.g. 01700000000 or 10-15 digits).',
      };
    }
    return { isValid: true };
  }

  private validateEmail(email: string): ValidationRuleResult {
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        error: 'Invalid email address format (e.g. user@example.com).',
      };
    }
    return { isValid: true };
  }

  private validateNid(nid: string): ValidationRuleResult {
    const cleaned = nid.replace(/[\s\-]/g, '');
    const nidRegex = /^(?:\d{10}|\d{13}|\d{17})$/;
    if (!nidRegex.test(cleaned)) {
      return {
        isValid: false,
        error: 'NID must be 10, 13, or 17 numeric digits.',
      };
    }
    return { isValid: true };
  }

  private validateDate(dateStr: string): ValidationRuleResult {
    // Supports YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD
    const dateRegex = /^(?:\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})$/;
    if (!dateRegex.test(dateStr)) {
      return {
        isValid: false,
        error: 'Invalid date format (use YYYY-MM-DD or DD/MM/YYYY).',
      };
    }
    return { isValid: true };
  }
}

export const validationEngine = new ValidationEngine();
