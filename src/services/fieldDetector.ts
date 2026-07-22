import { ExtractedFormData } from '../types';

/**
 * Stage 5: Rule-Based & Regex Field Detection Engine
 * Enhanced pattern matcher for English & Bengali document forms (PDFs, Images, Certificates).
 */

export interface FieldDetectionResult {
  detectedFields: Partial<ExtractedFormData>;
  confidenceMap: Record<keyof ExtractedFormData, number>;
}

// Known form label headers & placeholder texts to prevent capturing labels/placeholders as values
const FORM_HEADER_KEYWORDS = [
  'student name', 'full name', 'applicant name', 'father\'s name', 'father name', 'mother\'s name', 'mother name',
  'father\'s occupation', 'mother\'s occupation', 'contact number', 'emergency contact', 'phone', 'mobile',
  'email', 'date of birth', 'dob', 'gender', 'sex', 'national id', 'nid', 'passport', 'personal with disability', 'pwd',
  'religion', 'blood group', 'marital status', 'permanent division', 'permanent district', 'permanent upazila',
  'permanent post office', 'rural or urban', 'permanent address', 'present address', 'present division',
  'present district', 'present upazila', 'present post office', 'board/university', 'highest educational level',
  'highest education institute name', 'passing year', 'tvet certificate', 'ethnic minority', 'company name',
  'designation', 'skill training', 'employment status', 'monthly income', 'course', 'trade', 'nationality', 'remarks',
  'enter your', 'enter full name', 'choose a', 'select marital', 'select blood', 'mm/dd/yyyy', 'choose file', 'no file chosen'
];

function isHeaderOrPlaceholder(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  const lower = text.trim().toLowerCase();

  // If text matches or is contained in header keywords list
  for (const kw of FORM_HEADER_KEYWORDS) {
    if (lower === kw || lower.startsWith('enter ') || lower.startsWith('choose ') || lower.startsWith('select ')) {
      return true;
    }
  }

  // Exact header matches
  if (/^(name|student|father'?s?\s*name|mother'?s?\s*name|email|phone|mobile|nid|dob|address)$/i.test(lower)) {
    return true;
  }

  return false;
}

const FIELD_REGEX_PATTERNS: Array<{
  key: keyof ExtractedFormData;
  patterns: RegExp[];
}> = [
  {
    key: 'student_name',
    patterns: [
      /(?:full\s*name(?:\s*\[english\])?|student\s*name|applicant\s*name|name\s*of\s*student|শিক্ষার্থীর\s*নাম|নাম)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([A-Za-z0-9.\s]{2,60})/i,
    ],
  },
  {
    key: 'name_bangla',
    patterns: [
      /(?:full\s*name\s*\[?bangla\]?|বাংলায়\s*নাম|নাম\s*\(বাংলা\))\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'username',
    patterns: [
      /(?:username|user\s*name|ইউজারনেম)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([a-zA-Z0-9_.\-]{3,30})/i,
    ],
  },
  {
    key: 'father_name',
    patterns: [
      /(?:father'?s?\s*name(?:\s*\[english\])?|father\s*name|পিতার\s*নাম|বাবার\s*নাম)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([A-Za-z0-9.\s]{2,60})/i,
    ],
  },
  {
    key: 'father_occupation',
    patterns: [
      /(?:father'?s?\s*occupation|পিতার\s*পেশা|বাবার\s*পেশা)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'mother_name',
    patterns: [
      /(?:mother'?s?\s*name(?:\s*\[english\])?|mother\s*name|মাতার\s*নাম|মার\s*নাম)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([A-Za-z0-9.\s]{2,60})/i,
    ],
  },
  {
    key: 'mother_occupation',
    patterns: [
      /(?:mother'?s?\s*occupation|মাতার\s*পেশা|মার\s*পেশা)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'phone',
    patterns: [
      /(?:contact\s*number|phone|mobile|tel|মোবাইল|ফোন)\s*(?:\/[^:\n]+)?\s*(?:\([^)]*\))?\s*[:;\-\=]\s*(\+?[0-9\s\-]{10,18})/i,
      /(\+?880\s*1[3-9][0-9\s\-]{8,12})/,
      /(01[3-9][0-9\s\-]{8,10})/,
    ],
  },
  {
    key: 'emergency_contact',
    patterns: [
      /(?:emergency\s*contact(?:\s*no)?|জরুরী\s*যোগাযোগ)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*(\+?[0-9\s\-]{10,18})/i,
    ],
  },
  {
    key: 'email',
    patterns: [
      /(?:email|e-mail|ইমেইল)\s*(?:address)?\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i,
      /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/,
    ],
  },
  {
    key: 'date_of_birth',
    patterns: [
      /(?:date\s*of\s*birth|dob|birth\s*date|জন্ম\s*তারিখ)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([0-9]{1,4}\s+[A-Za-z]+\s+[0-9]{2,4}|[0-9]{1,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,4})/i,
      /([0-9]{2,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/,
    ],
  },
  {
    key: 'gender',
    patterns: [
      /(?:gender|sex|লিঙ্গ)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*(Male|Female|Other|পুরুষ|মহিলা)/i,
    ],
  },
  {
    key: 'nid',
    patterns: [
      /(?:nid|birth\s*certificate|passport|national\s*id|brn|identity\s*no|জাতীয়\s*পরিচয়পত্র)\s*(?:\/[^:\n]+)?\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([0-9]{10,18})/i,
      /(\b[0-9]{10,18}\b)/,
    ],
  },
  {
    key: 'pwd',
    patterns: [
      /(?:personal\s*with\s*disability|pwd|প্রতিবন্ধী)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*(Yes|No|হ্যাঁ|না)/i,
    ],
  },
  {
    key: 'religion',
    patterns: [
      /(?:religion|ধর্ম)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*(Islam|Hinduism|Christianity|Buddhism|ইসলাম|হিন্দু)/i,
    ],
  },
  {
    key: 'blood_group',
    patterns: [
      /(?:blood\s*group|রক্তের\s*গ্রুপ)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([ABO][\+\-](?:\s*\([^)]*\))?)/i,
    ],
  },
  {
    key: 'marital_status',
    patterns: [
      /(?:marital\s*status|বৈবাহিক\s*অবস্থা)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*(Single|Married|Unmarried|Divorced|অবিবাহিত|বিবাহিত)/i,
    ],
  },
  {
    key: 'permanent_division',
    patterns: [
      /(?:permanent\s*division|division)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([A-Za-z\s]+)/i,
    ],
  },
  {
    key: 'permanent_district',
    patterns: [
      /(?:permanent\s*district|district)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([A-Za-z\s]+)/i,
    ],
  },
  {
    key: 'permanent_upazila',
    patterns: [
      /(?:permanent\s*upazila|upazila|উপজেলা)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([A-Za-z\s]+)/i,
    ],
  },
  {
    key: 'permanent_post_office',
    patterns: [
      /(?:permanent\s*post\s*office|post\s*office|পোস্ট\s*অফিস)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'rural_urban',
    patterns: [
      /(?:from\s*rural\s*or\s*urban\s*area|rural|urban)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*(Rural|Urban|গ্রাম|শহর)/i,
    ],
  },
  {
    key: 'permanent_address',
    patterns: [
      /(?:permanent\s*address|স্থায়ী\s*ঠিকানা)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'present_address',
    patterns: [
      /(?:present\s*address|current\s*address|বর্তমান\s*ঠিকানা)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'board_university',
    patterns: [
      /(?:board\/university|board|university|বোর্ড|বিশ্ববিদ্যালয়)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'education',
    patterns: [
      /(?:highest\s*educational\s*level|qualification|education|degree)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'institute_name',
    patterns: [
      /(?:highest\s*education\s*institute\s*name|institute\s*name|institution|প্রতিষ্ঠানের\s*নাম)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'passing_year',
    patterns: [
      /(?:highest\s*education\s*passing\s*year|passing\s*year|পাশের\s*সাল)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([0-9]{4})/i,
    ],
  },
  {
    key: 'tvet_certificate',
    patterns: [
      /(?:tvet\s*certificate)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*(Yes|No|হ্যাঁ|না)/i,
    ],
  },
  {
    key: 'ethnic_minority',
    patterns: [
      /(?:ethnic\s*minority|ক্ষুদ্র\s*নৃগোষ্ঠী)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*(Yes|No|হ্যাঁ|না)/i,
    ],
  },
  {
    key: 'company_name',
    patterns: [
      /(?:company\s*name|কোম্পানির\s*নাম)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'designation',
    patterns: [
      /(?:designation|পদবী)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'skill_training_past',
    patterns: [
      /(?:received\s*any\s*skill\s*training\s*in\s*the\s*past\??)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'employment_status',
    patterns: [
      /(?:employment\s*status\s*before\s*training|employment\s*status)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'monthly_income',
    patterns: [
      /(?:amount\s*of\s*monthly\s*income|monthly\s*income|মাসিক\s*আয়)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([0-9,.]+)/i,
    ],
  },
  {
    key: 'course',
    patterns: [
      /(?:course|program|কোর্স)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'trade',
    patterns: [
      /(?:trade|department|technology|ট্রেড|ডিপার্টমেন্ট)\s*(?:\/[^:\n]+)?\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
  {
    key: 'nationality',
    patterns: [
      /(?:nationality|জাতীয়তা)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([A-Za-z]+|বাংলাদেশী)/i,
    ],
  },
  {
    key: 'remarks',
    patterns: [
      /(?:remarks|comments|মন্তব্য)\s*(?:\([^)]*\))?\s*[:;\-\=]\s*([^\n:]+)/i,
    ],
  },
];

export class FieldDetector {
  detectFields(cleanedText: string): FieldDetectionResult {
    const detectedFields: Partial<ExtractedFormData> = {};
    const confidenceMap: Record<keyof ExtractedFormData, number> = {
      student_name: 0, father_name: 0, mother_name: 0, phone: 0, email: 0,
      date_of_birth: 0, gender: 0, nid: 0, present_address: 0, permanent_address: 0,
      course: 0, trade: 0, education: 0, blood_group: 0, religion: 0, nationality: 0,
      remarks: 0, username: 0, name_bangla: 0, emergency_contact: 0, password: 0,
      father_occupation: 0, mother_occupation: 0, pwd: 0, marital_status: 0,
      permanent_division: 0, permanent_district: 0, permanent_upazila: 0,
      permanent_post_office: 0, rural_urban: 0, present_division: 0,
      present_district: 0, present_upazila: 0, present_post_office: 0,
      board_university: 0, institute_name: 0, passing_year: 0, tvet_certificate: 0,
      ethnic_minority: 0, company_name: 0, designation: 0, skill_training_past: 0,
      employment_status: 0, monthly_income: 0,
    };

    const lines = cleanedText.split('\n').map((l) => l.trim());

    for (const item of FIELD_REGEX_PATTERNS) {
      // 1. Direct Regex Pattern Matching
      for (const pattern of item.patterns) {
        const match = pattern.exec(cleanedText);
        if (match && match[1]) {
          const matchedValue = match[1].trim();
          if (!isHeaderOrPlaceholder(matchedValue)) {
            detectedFields[item.key] = matchedValue;
            confidenceMap[item.key] = 0.9;
            break;
          }
        }
      }

      // 2. Line-by-Line Strict Pattern Matching
      if (!detectedFields[item.key]) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;

          for (const pattern of item.patterns) {
            const match = pattern.exec(line);
            if (match && match[1]) {
              const matchedValue = match[1].trim();
              if (!isHeaderOrPlaceholder(matchedValue)) {
                detectedFields[item.key] = matchedValue;
                confidenceMap[item.key] = 0.85;
                break;
              }
            }
          }
          if (detectedFields[item.key]) break;

          // 3. Proximity Search: If line i matches label keyword, check line i+1 for actual non-header value
          const labelKeywords = [item.key.replace(/_/g, ' ')];
          const isLabelLine = labelKeywords.some((kw) => line.toLowerCase().includes(kw));
          if (isLabelLine && i + 1 < lines.length) {
            const nextLine = (lines[i + 1] || '').trim();
            if (nextLine.length > 0 && !isHeaderOrPlaceholder(nextLine)) {
              detectedFields[item.key] = nextLine;
              confidenceMap[item.key] = 0.75;
              break;
            }
          }
        }
      }
    }

    return { detectedFields, confidenceMap };
  }
}

export const fieldDetector = new FieldDetector();
