import { ExtractedFormData } from '../types';

/**
 * Stage 5: Rule-Based & Regex Field Detection Engine
 * Enhanced pattern matcher for English & Bengali document forms (PDFs, Images, Certificates).
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
      /(?:student\s*name|applicant\s*name|name\s*of\s*student|শিক্ষার্থীর\s*নাম|নাম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Z0-9.\s]{2,60})/i,
      /Student\s*Name\s*(?:\([^)]*\))?\s*([^\n]+)/i,
    ],
  },
  {
    key: 'father_name',
    patterns: [
      /(?:father'?s?\s*name|father\s*name|পিতার\s*নাম|বাবার\s*নাম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Z0-9.\s]{2,60})/i,
      /Father's\s*Name\s*(?:\([^)]*\))?\s*([^\n]+)/i,
    ],
  },
  {
    key: 'mother_name',
    patterns: [
      /(?:mother'?s?\s*name|mother\s*name|মাতার\s*নাম|মার\s*নাম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Z0-9.\s]{2,60})/i,
      /Mother's\s*Name\s*(?:\([^)]*\))?\s*([^\n]+)/i,
    ],
  },
  {
    key: 'phone',
    patterns: [
      /(?:phone|mobile|contact|tel|মোবাইল|ফোন)\s*(?:\/[^:\n]+)?\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(\+?[0-9\s\-]{10,18})/i,
      /(\+?880\s*1[3-9][0-9\s\-]{8,12})/,
      /(01[3-9][0-9\s\-]{8,10})/,
    ],
  },
  {
    key: 'email',
    patterns: [
      /(?:email|e-mail|ইমেইল)\s*(?:address)?\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i,
      /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/,
    ],
  },
  {
    key: 'date_of_birth',
    patterns: [
      /(?:date\s*of\s*birth|dob|birth\s*date|জন্ম\s*তারিখ)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([0-9]{1,4}\s+[A-Za-z]+\s+[0-9]{2,4}|[0-9]{1,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,4})/i,
    ],
  },
  {
    key: 'gender',
    patterns: [
      /(?:gender|sex|লিঙ্গ)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(Male|Female|Other|পুরুষ|মহিলা)/i,
    ],
  },
  {
    key: 'nid',
    patterns: [
      /(?:national\s*id|nid|brn|identity\s*no|জাতীয়\s*পরিচয়পত্র|এনআইডি)\s*(?:\/[^:\n]+)?\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([0-9]{10,18})/i,
      /(\b[0-9]{10,18}\b)/,
    ],
  },
  {
    key: 'present_address',
    patterns: [
      /(?:present\s*address|current\s*address|বর্তমান\s*ঠিকানা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'permanent_address',
    patterns: [
      /(?:permanent\s*address|স্থায়ী\s*ঠিকানা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'course',
    patterns: [
      /(?:course|program|কোর্স)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'trade',
    patterns: [
      /(?:trade|department|technology|ট্রেড|ডিপার্টমেন্ট)\s*(?:\/[^:\n]+)?\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'education',
    patterns: [
      /(?:qualification|educational\s*qualification|education|degree|শিক্ষাগত\s*যোগ্যতা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)/i,
    ],
  },
  {
    key: 'blood_group',
    patterns: [
      /(?:blood\s*group|রক্তের\s*গ্রুপ)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([ABO][\+\-](?:\s*\([^)]*\))?)/i,
    ],
  },
  {
    key: 'religion',
    patterns: [
      /(?:religion|ধর্ম)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*(Islam|Hinduism|Christianity|Buddhism|ইসলাম|হিন্দু)/i,
    ],
  },
  {
    key: 'nationality',
    patterns: [
      /(?:nationality|জাতীয়তা)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([A-Za-z]+|বাংলাদেশী)/i,
    ],
  },
  {
    key: 'remarks',
    patterns: [
      /(?:remarks|comments|মন্তব্য)\s*(?:\([^)]*\))?\s*[:;\-\s]\s*([^\n]+)/i,
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

    const lines = cleanedText.split('\n').map((l) => l.trim());

    for (const item of FIELD_REGEX_PATTERNS) {
      for (const pattern of item.patterns) {
        const match = pattern.exec(cleanedText);
        if (match && match[1]) {
          const matchedValue = match[1].trim();
          if (matchedValue.length > 0) {
            detectedFields[item.key] = matchedValue;
            confidenceMap[item.key] = 0.9;
            break;
          }
        }
      }

      // Line-by-line fallback pattern matching
      if (!detectedFields[item.key]) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;

          for (const pattern of item.patterns) {
            const match = pattern.exec(line);
            if (match && match[1]) {
              const matchedValue = match[1].trim();
              if (matchedValue.length > 0) {
                detectedFields[item.key] = matchedValue;
                confidenceMap[item.key] = 0.85;
                break;
              }
            }
          }
          if (detectedFields[item.key]) break;
        }
      }
    }

    return { detectedFields, confidenceMap };
  }
}

export const fieldDetector = new FieldDetector();
