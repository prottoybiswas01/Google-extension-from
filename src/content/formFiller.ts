import { ExtractedFormData } from '../types';

export interface AutoFillResult {
  totalFieldsFilled: number;
  filledFields: string[];
}

type FieldKey = keyof ExtractedFormData;

const FIELD_KEYWORDS: Record<FieldKey, string[]> = {
  username: ['username', 'user name', 'login', 'ইউজারনেম'],
  email: ['email', 'e-mail', 'mail', 'ইমেইল'],
  phone: ['contact number', 'phone', 'mobile', 'cell', 'telephone', 'মোবাইল', 'ফোন'],
  emergency_contact: ['emergency contact', 'emergency phone', 'emergency', 'জরুরী যোগাযোগ'],
  password: ['password', 'pass', 'পাসওয়ার্ড'],

  nid: ['nid', 'national id', 'birth certificate', 'passport', 'identity', 'জাতীয় পরিচয়পত্র'],
  student_name: ['full name', 'full_name', 'fullname', 'name', 'english name', 'student name', 'applicant name', 'শিক্ষার্থীর নাম', 'নাম'],
  name_bangla: ['bangla name', 'name in bangla', 'full name[bangla]', 'বাংলা নাম', 'বাংলায় নাম'],
  father_name: ['father', 'father name', 'father\'s name', 'pitar name', 'পিতার নাম', 'বাবার নাম'],
  father_occupation: ['father occupation', 'father\'s occupation', 'পিতার পেশা'],
  mother_name: ['mother', 'mother name', 'mother\'s name', 'মাতার নাম', 'মার নাম'],
  mother_occupation: ['mother occupation', 'mother\'s occupation', 'মাতার পেশা'],

  gender: ['gender', 'sex', 'লিঙ্গ'],
  date_of_birth: ['dob', 'date of birth', 'birth date', 'birthday', 'mm/dd/yyyy', 'birth', 'জন্ম তারিখ'],
  pwd: ['pwd', 'disability', 'handicapped', 'personal with disability', 'প্রতিবন্ধী'],
  religion: ['religion', 'faith', 'ধর্ম'],
  blood_group: ['blood group', 'blood', 'রক্তের গ্রুপ'],
  marital_status: ['marital status', 'marital', 'marriage', 'বৈবাহিক অবস্থা'],

  permanent_division: ['permanent division', 'division'],
  permanent_district: ['permanent district', 'district'],
  permanent_upazila: ['permanent upazila', 'upazila', 'thana', 'উপজেলা'],
  permanent_post_office: ['permanent post office', 'post office', 'postcode', 'পোস্ট অফিস'],
  rural_urban: ['rural or urban', 'rural', 'urban', 'area'],
  permanent_address: ['permanent address', 'permanent_address', 'স্থায়ী ঠিকানা'],

  present_division: ['present division'],
  present_district: ['present district'],
  present_upazila: ['present upazila'],
  present_post_office: ['present post office'],
  present_address: ['present address', 'current address', 'present_address', 'বর্তমান ঠিকানা'],

  board_university: ['board/university', 'board', 'university', 'বোর্ড', 'বিশ্ববিদ্যালয়'],
  education: ['highest educational level', 'educational level', 'education', 'qualification', 'degree'],
  institute_name: ['highest education institute name', 'institute name', 'institution', 'college', 'school', 'university name'],
  passing_year: ['highest education passing year', 'passing year', 'year of passing', 'passing_year'],
  tvet_certificate: ['tvet certificate', 'tvet'],
  ethnic_minority: ['ethnic minority', 'minority', 'ক্ষুদ্র নৃগোষ্ঠী'],

  company_name: ['company name', 'company', 'employer'],
  designation: ['designation', 'position', 'role', 'job title', 'পদবী'],
  skill_training_past: ['received any skill training', 'skill training', 'past training'],
  employment_status: ['employment status', 'employment'],
  monthly_income: ['amount of monthly income', 'monthly income', 'income', 'salary', 'মাসিক আয়'],

  course: ['course', 'program', 'কোর্স'],
  trade: ['trade', 'department', 'technology', 'ট্রেড'],
  nationality: ['nationality', 'country', 'জাতীয়তা'],
  remarks: ['remarks', 'comments', 'notes', 'মন্তব্য'],
};

export class FormFiller {
  /**
   * Scans document DOM and populates matching form fields with provided ExtractedFormData
   */
  fillWebForm(data: ExtractedFormData): AutoFillResult {
    let fieldsFilledCount = 0;
    const filledFieldsList: string[] = [];

    const elements = Array.from(
      document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]), select, textarea'
      )
    );

    const filledElementsSet = new Set<Element>();

    // Iterate through all key-value entries in ExtractedFormData
    const dataKeys = Object.keys(data) as FieldKey[];

    for (const key of dataKeys) {
      const val = data[key];
      if (!val || typeof val !== 'string' || val.trim() === '') continue;

      const cleanVal = val.trim();
      const keywords = FIELD_KEYWORDS[key] || [key.replace(/_/g, ' ')];

      // Find best matching element in the DOM
      const targetElement = this.findMatchingElement(elements, keywords, filledElementsSet, key);

      if (targetElement) {
        const success = this.setElementValue(targetElement, cleanVal, key);
        if (success) {
          fieldsFilledCount++;
          filledFieldsList.push(key);
          filledElementsSet.add(targetElement);
          this.highlightElement(targetElement);
        }
      }
    }

    this.showPageToast(fieldsFilledCount, filledFieldsList);

    return {
      totalFieldsFilled: fieldsFilledCount,
      filledFields: filledFieldsList,
    };
  }

  private findMatchingElement(
    elements: Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    keywords: string[],
    filledElementsSet: Set<Element>,
    fieldKey: string
  ): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
    let bestMatch: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null = null;
    let highestScore = 0;

    for (const el of elements) {
      if (filledElementsSet.has(el)) continue;

      const score = this.calculateMatchScore(el, keywords, fieldKey);
      if (score > highestScore && score >= 20) {
        highestScore = score;
        bestMatch = el;
      }
    }

    return bestMatch;
  }

  private calculateMatchScore(
    el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    keywords: string[],
    fieldKey: string
  ): number {
    const descriptorText = this.getElementDescriptorText(el).toLowerCase();
    let score = 0;

    // Check exact key match
    if (el.name && el.name.toLowerCase() === fieldKey.toLowerCase()) {
      score += 80;
    }
    if (el.id && el.id.toLowerCase() === fieldKey.toLowerCase()) {
      score += 80;
    }

    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      if (!kw) continue;

      if (descriptorText.includes(kw)) {
        score += 50;
        // Extra boost if descriptor starts with keyword or is exact
        if (descriptorText === kw) {
          score += 40;
        }
      }

      // Check placeholder
      const placeholder = 'placeholder' in el ? (el as HTMLInputElement).placeholder : '';
      if (placeholder && placeholder.toLowerCase().includes(kw)) {
        score += 40;
      }
    }

    return score;
  }

  private getElementDescriptorText(
    el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  ): string {
    const texts: string[] = [];

    if (el.id) {
      texts.push(el.id);
      // Look for associated <label for="id">
      const labelEl = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(el.id)}"]`);
      if (labelEl && labelEl.textContent) {
        texts.push(labelEl.textContent);
      }
    }

    if (el.name) {
      texts.push(el.name);
    }

    if ('placeholder' in el && (el as HTMLInputElement).placeholder) {
      texts.push((el as HTMLInputElement).placeholder);
    }

    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) {
      texts.push(ariaLabel);
    }

    // Check parent label text
    const parentLabel = el.closest('label');
    if (parentLabel && parentLabel.textContent) {
      texts.push(parentLabel.textContent);
    }

    // Check preceding text nodes or table cells
    const parentTd = el.closest('td, th, .form-group, .field, div');
    if (parentTd && parentTd.textContent) {
      // Limit text snippet length
      texts.push(parentTd.textContent.slice(0, 100));
    }

    return texts.join(' ').toLowerCase();
  }

  private setElementValue(
    el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    val: string,
    key: string
  ): boolean {
    try {
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute('type') || '').toLowerCase();

      if (tag === 'select') {
        const selectEl = el as HTMLSelectElement;
        const targetOption = Array.from(selectEl.options).find(
          (opt) =>
            opt.text.trim().toLowerCase() === val.toLowerCase() ||
            opt.value.trim().toLowerCase() === val.toLowerCase() ||
            opt.text.trim().toLowerCase().includes(val.toLowerCase()) ||
            val.toLowerCase().includes(opt.text.trim().toLowerCase())
        );

        if (targetOption) {
          selectEl.value = targetOption.value;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
          selectEl.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }

      if (tag === 'input' && (type === 'radio' || type === 'checkbox')) {
        const inputEl = el as HTMLInputElement;
        const isTrueVal = /^(yes|true|1|male|female|হ্যাঁ)$/i.test(val);
        inputEl.checked = isTrueVal;
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        inputEl.dispatchEvent(new Event('click', { bubbles: true }));
        return true;
      }

      // Standard text / email / tel / date / password inputs
      const inputEl = el as HTMLInputElement | HTMLTextAreaElement;

      // React 16+ setter override trick
      const nativeSetter =
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set ||
        Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;

      if (nativeSetter) {
        nativeSetter.call(inputEl, val);
      } else {
        inputEl.value = val;
      }

      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      inputEl.dispatchEvent(new Event('blur', { bubbles: true }));

      return true;
    } catch (e) {
      console.warn(`[FormFiller] Failed setting value for field ${key}:`, e);
      return false;
    }
  }

  private highlightElement(el: Element) {
    const htmlEl = el as HTMLElement;
    const origOutline = htmlEl.style.outline;
    const origBoxShadow = htmlEl.style.boxShadow;
    const origTransition = htmlEl.style.transition;

    htmlEl.style.transition = 'all 0.4s ease';
    htmlEl.style.outline = '2px solid #10b981';
    htmlEl.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.5)';

    setTimeout(() => {
      htmlEl.style.outline = origOutline;
      htmlEl.style.boxShadow = origBoxShadow;
      htmlEl.style.transition = origTransition;
    }, 4000);
  }

  private showPageToast(count: number, _filledFields: string[]) {
    const existing = document.getElementById('ttc-autofill-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ttc-autofill-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: #0f172a;
      color: #ffffff;
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
      border: 1px solid #10b981;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: ttcSlideIn 0.3s ease-out forwards;
    `;

    toast.innerHTML = `
      <style>
        @keyframes ttcSlideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      </style>
      <div style="background: #10b981; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">
        ✓
      </div>
      <div>
        <div style="font-weight: 600; font-size: 14px; color: #f8fafc;">TTC Form Auto Fill</div>
        <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">
          ${
            count > 0
              ? `Successfully filled <strong>${count}</strong> web form fields!`
              : 'No matching form fields were found on this page.'
          }
        </div>
      </div>
      <button id="ttc-toast-close" style="background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 16px; margin-left: 10px; line-height: 1;">✕</button>
    `;

    document.body.appendChild(toast);

    document.getElementById('ttc-toast-close')?.addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.remove();
      }
    }, 6000);
  }
}

export const formFiller = new FormFiller();
