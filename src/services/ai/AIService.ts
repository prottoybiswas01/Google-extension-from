import { ExtractedFormData } from '../../types';
import { fieldDetector } from '../fieldDetector';

export function sanitizeExtractedFormData(parsed: Record<string, unknown>): ExtractedFormData {
  const getStr = (val: unknown): string | null => {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'undefined') {
      return null;
    }
    return str;
  };

  return {
    student_name: getStr(parsed.student_name),
    father_name: getStr(parsed.father_name),
    mother_name: getStr(parsed.mother_name),
    phone: getStr(parsed.phone),
    email: getStr(parsed.email),
    date_of_birth: getStr(parsed.date_of_birth),
    gender: getStr(parsed.gender),
    nid: getStr(parsed.nid),
    present_address: getStr(parsed.present_address),
    permanent_address: getStr(parsed.permanent_address),
    course: getStr(parsed.course),
    trade: getStr(parsed.trade),
    education: getStr(parsed.education),
    blood_group: getStr(parsed.blood_group),
    religion: getStr(parsed.religion),
    nationality: getStr(parsed.nationality),
    remarks: getStr(parsed.remarks),

    username: getStr(parsed.username),
    name_bangla: getStr(parsed.name_bangla),
    emergency_contact: getStr(parsed.emergency_contact),
    password: getStr(parsed.password),
    father_occupation: getStr(parsed.father_occupation),
    mother_occupation: getStr(parsed.mother_occupation),
    pwd: getStr(parsed.pwd),
    marital_status: getStr(parsed.marital_status),
    permanent_division: getStr(parsed.permanent_division),
    permanent_district: getStr(parsed.permanent_district),
    permanent_upazila: getStr(parsed.permanent_upazila),
    permanent_post_office: getStr(parsed.permanent_post_office),
    rural_urban: getStr(parsed.rural_urban),
    present_division: getStr(parsed.present_division),
    present_district: getStr(parsed.present_district),
    present_upazila: getStr(parsed.present_upazila),
    present_post_office: getStr(parsed.present_post_office),
    board_university: getStr(parsed.board_university),
    institute_name: getStr(parsed.institute_name),
    passing_year: getStr(parsed.passing_year),
    tvet_certificate: getStr(parsed.tvet_certificate),
    ethnic_minority: getStr(parsed.ethnic_minority),
    company_name: getStr(parsed.company_name),
    designation: getStr(parsed.designation),
    skill_training_past: getStr(parsed.skill_training_past),
    employment_status: getStr(parsed.employment_status),
    monthly_income: getStr(parsed.monthly_income),
  };
}

export class AIService {
  /**
   * Performs 100% local client-side field extraction directly inside the browser extension.
   */
  async extractStructuredData(
    _providerType: string,
    ocrText: string,
    _apiKey: string,
    _imageDataUrl?: string
  ): Promise<ExtractedFormData> {
    console.log('[AIService] Running 100% local browser field extraction engine.');

    const detected = fieldDetector.detectFields(ocrText);
    const d = detected.detectedFields;

    return sanitizeExtractedFormData(d as Record<string, unknown>);
  }
}

export const aiService = new AIService();
