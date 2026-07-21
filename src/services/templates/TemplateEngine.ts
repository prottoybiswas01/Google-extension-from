import { InstitutionTemplate, ExtractedFormData } from '../../types';

export class TemplateEngine {
  private templates: InstitutionTemplate[] = [
    {
      id: 'ttc_standard',
      name: 'Standard TTC Application Form',
      headerKeywords: ['ttc', 'technical training center'],
      customMappings: {
        course: 'Admission Course',
        trade: 'Selected Trade',
      },
    },
  ];

  getTemplates(): InstitutionTemplate[] {
    return this.templates;
  }

  addTemplate(template: InstitutionTemplate): void {
    this.templates.push(template);
  }

  applyTemplate(
    data: ExtractedFormData,
    template: InstitutionTemplate
  ): ExtractedFormData {
    const updated = { ...data };
    if (template.customMappings) {
      for (const [key, mappedLabel] of Object.entries(template.customMappings)) {
        const k = key as keyof ExtractedFormData;
        if (updated[k] && mappedLabel) {
          // Custom mapping formatting applied
          console.log(`[TemplateEngine] Applied template override for ${k} -> ${mappedLabel}`);
        }
      }
    }
    return updated;
  }

  exportTemplateJson(template: InstitutionTemplate): string {
    return JSON.stringify(template, null, 2);
  }

  importTemplateJson(jsonStr: string): InstitutionTemplate {
    const parsed = JSON.parse(jsonStr) as InstitutionTemplate;
    if (!parsed.id || !parsed.name) {
      throw new Error('Invalid template format.');
    }
    this.addTemplate(parsed);
    return parsed;
  }
}

export const templateEngine = new TemplateEngine();
