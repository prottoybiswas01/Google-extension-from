import {
  ExtractedFormData,
  FieldReviewItem,
  ConfidenceLevel,
  ReviewSummaryMetrics,
} from '../../types';
import { validationEngine } from './ValidationEngine';

const FIELD_LABEL_MAP: Record<keyof ExtractedFormData, { label: string; required?: boolean }> = {
  student_name: { label: 'Student Name', required: true },
  father_name: { label: "Father's Name" },
  mother_name: { label: "Mother's Name" },
  phone: { label: 'Phone Number', required: true },
  email: { label: 'Email Address' },
  date_of_birth: { label: 'Date of Birth' },
  gender: { label: 'Gender' },
  nid: { label: 'NID / Identity Number' },
  present_address: { label: 'Present Address' },
  permanent_address: { label: 'Permanent Address' },
  course: { label: 'Course' },
  trade: { label: 'Trade / Technology' },
  education: { label: 'Educational Qualification' },
  blood_group: { label: 'Blood Group' },
  religion: { label: 'Religion' },
  nationality: { label: 'Nationality' },
  remarks: { label: 'Remarks / Notes' },
};

export class ConfidenceAnalyzer {
  /**
   * Evaluates raw extracted data and generates initial FieldReviewItem array.
   */
  analyzeExtractedData(
    data: ExtractedFormData,
    detectedFieldsHint?: Partial<ExtractedFormData>
  ): FieldReviewItem[] {
    const keys = Object.keys(FIELD_LABEL_MAP) as Array<keyof ExtractedFormData>;

    return keys.map((key) => {
      const config = FIELD_LABEL_MAP[key];
      const val = data[key];
      const hintVal = detectedFieldsHint?.[key];

      let confidenceScore = 90;
      let confidenceLevel: ConfidenceLevel = 'high';

      if (!val || val.trim() === '') {
        confidenceScore = 0;
        confidenceLevel = 'low';
      } else {
        // Boost if both OCR detection hint and AI extraction agree
        if (hintVal && hintVal.toLowerCase() === val.toLowerCase()) {
          confidenceScore = 95;
          confidenceLevel = 'high';
        } else if (val.length < 2) {
          confidenceScore = 45;
          confidenceLevel = 'low';
        } else if (/\?|/.test(val)) {
          confidenceScore = 30;
          confidenceLevel = 'low';
        } else {
          confidenceScore = 75;
          confidenceLevel = 'medium';
        }
      }

      // Run validation
      const validation = validationEngine.validateField(key, val);
      if (!validation.isValid) {
        confidenceLevel = 'low';
        confidenceScore = Math.min(confidenceScore, 40);
      }

      return {
        key,
        label: config.label,
        value: val,
        originalValue: val,
        confidence: confidenceLevel,
        confidenceScore,
        status: val && val.trim() !== '' ? 'matched' : 'missing',
        validationError: validation.error,
        required: config.required,
      };
    });
  }

  /**
   * Computes Summary Metrics for Review Page display.
   */
  computeSummaryMetrics(items: FieldReviewItem[]): ReviewSummaryMetrics {
    const totalFields = items.length;
    let matchedCount = 0;
    let missingCount = 0;
    let editedCount = 0;
    let ignoredCount = 0;
    let totalScore = 0;

    for (const item of items) {
      totalScore += item.confidenceScore;
      if (item.status === 'ignored') {
        ignoredCount++;
      } else if (item.status === 'edited') {
        editedCount++;
      } else if (!item.value || item.value.trim() === '') {
        missingCount++;
      } else {
        matchedCount++;
      }
    }

    const activeCount = totalFields - ignoredCount;
    const overallConfidenceScore = activeCount > 0 ? Math.round(totalScore / totalFields) : 0;

    return {
      totalFields,
      matchedCount,
      missingCount,
      editedCount,
      ignoredCount,
      overallConfidenceScore,
    };
  }
}

export const confidenceAnalyzer = new ConfidenceAnalyzer();
