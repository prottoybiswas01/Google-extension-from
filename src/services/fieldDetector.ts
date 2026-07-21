import { ExtractedFormData } from '../types';

/**
 * Stage 5: Rule-Based & Regex Field Detection Engine
 * Matches standard form field keys in Bengali and English from cleaned OCR text.
 */

export interface FieldDetectionResult {
  detectedFields: Partial<ExtractedFormData>;
  confidenceMap: Record<keyof ExtractedFormData, number>;
}

const FIELD_REGEX_PATTERNS: Array<{
  key: keyof ExtractedFormData;
  patterns: RegExp[];
}> = [
  {
    key: 'student_name',
    patterns: [
      /(?:student\s*name|name\s*of\s*student|applicant\s*name|নাম|শিক্ষার্থীর\s*নাম)\s*[:;\-]\s*([^\n]+)/i,
      /(?:name|নাম)\s*[:;\-]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'father_name',
    patterns: [
      /(?:father'?s?\s*name|father\s*name|পিতার\s*নাম|বাবার\s*নাম)\s*[:;\-]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'mother_name',
    patterns: [
      /(?:mother'?s?\s*name|mother\s*name|মাতার\s*নাম|মার\s*নাম)\s*[:;\-]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'phone',
    patterns: [
      /(?:phone|mobile|contact|tel|মোবাইল|ফোন)\s*[:;\-]\s*([0-9+\s\-]{10,15})/i,
      /(?:01[3-9]\d{8})/,
    ],
  },
  {
    key: 'email',
    patterns: [
      /(?:email|e-mail|ইমেইল)\s*[:;\-]\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i,
      /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/,
    ],
  },
  {
    key: 'date_of_birth',
    patterns: [
      /(?:date\s*of\s*birth|dob|birth\s*date|জন্ম\s*তারিখ)\s*[:;\-]\s*([0-9]{1,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,4})/i,
    ],
  },
  {
    key: 'gender',
    patterns: [
      /(?:gender|sex|লিঙ্গ)\s*[:;\-]\s*(male|female|other|পুরুষ|মহিলা)/i,
    ],
  },
  {
    key: 'nid',
    patterns: [
      /(?:nid|national\s*id|identity\s*no|জাতীয়\s*পরিচয়পত্র|এনআইডি)\s*[:;\-]\s*([0-9]{10,17})/i,
    ],
  },
  {
    key: 'present_address',
    patterns: [
      /(?:present\s*address|current\s*address|বর্তমান\s*ঠিকানা)\s*[:;\-]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'permanent_address',
    patterns: [
      /(?:permanent\s*address|স্থায়ী\s*ঠিকানা)\s*[:;\-]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'course',
    patterns: [
      /(?:course|program|কোর্স)\s*[:;\-]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'trade',
    patterns: [
      /(?:trade|technology|ট্রেড|টেকনোলজি)\s*[:;\-]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'education',
    patterns: [
      /(?:qualification|education|degree|শিক্ষাগত\s*যোগ্যতা)\s*[:;\-]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'blood_group',
    patterns: [
      /(?:blood\s*group|রক্তের\s*গ্রুপ)\s*[:;\-]\s*(A|B|AB|O)[\+\-]/i,
    ],
  },
  {
    key: 'religion',
    patterns: [
      /(?:religion|ধর্ম)\s*[:;\-]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'nationality',
    patterns: [
      /(?:nationality|জাতীয়তা)\s*[:;\-]\s*([^\n]+)/i,
    ],
  },
];

export class FieldDetector {
  detectFields(cleanedText: string): FieldDetectionResult {
    const detectedFields: Partial<ExtractedFormData> = {};
    const confidenceMap: Record<keyof ExtractedFormData, number> = {
      student_name: 0,
      father_name: 0,
      mother_name: 0,
      phone: 0,
      email: 0,
      date_of_birth: 0,
      gender: 0,
      nid: 0,
      present_address: 0,
      permanent_address: 0,
      course: 0,
      trade: 0,
      education: 0,
      blood_group: 0,
      religion: 0,
      nationality: 0,
      remarks: 0,
    };

    for (const item of FIELD_REGEX_PATTERNS) {
      for (const pattern of item.patterns) {
        const match = pattern.exec(cleanedText);
        if (match && match[1]) {
          const matchedValue = match[1].trim();
          if (matchedValue.length > 0) {
            detectedFields[item.key] = matchedValue;
            confidenceMap[item.key] = 0.85;
            break;
          }
        }
      }
    }

    return { detectedFields, confidenceMap };
  }
}

export const fieldDetector = new FieldDetector();
