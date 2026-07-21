import { FormHistoryRecord, ExtractedFormData } from '../../types';
import { storageRepository } from '../storage/StorageRepository';

export class HistoryService {
  /**
   * Saves a new form extraction execution record into IndexedDB history.
   */
  async recordExtraction(
    uploadedImage: string,
    extractedJson: ExtractedFormData,
    status: 'success' | 'failed',
    processingTimeMs: number,
    institution = 'TTC Technical College'
  ): Promise<FormHistoryRecord> {
    const record: FormHistoryRecord = {
      id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      uploadedImage,
      extractedJson,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      institution: extractedJson.remarks || institution,
      status,
      processingTimeMs,
    };

    await storageRepository.addHistoryRecord(record);
    return record;
  }

  /**
   * Fetches all history records from IndexedDB.
   */
  async getHistory(): Promise<FormHistoryRecord[]> {
    return await storageRepository.getAllHistoryRecords();
  }

  /**
   * Filters and searches history records.
   */
  async searchHistory(
    keyword = '',
    statusFilter: 'all' | 'success' | 'failed' = 'all'
  ): Promise<FormHistoryRecord[]> {
    const all = await this.getHistory();
    const query = keyword.toLowerCase().trim();

    return all.filter((rec) => {
      // Status filter check
      if (statusFilter !== 'all' && rec.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      // Keyword search check against student_name, phone, institution, or id
      const studentName = rec.extractedJson.student_name?.toLowerCase() || '';
      const phone = rec.extractedJson.phone?.toLowerCase() || '';
      const inst = rec.institution.toLowerCase();

      return (
        studentName.includes(query) ||
        phone.includes(query) ||
        inst.includes(query) ||
        rec.id.toLowerCase().includes(query)
      );
    });
  }

  /**
   * Deletes a single history record.
   */
  async deleteRecord(id: string): Promise<void> {
    await storageRepository.deleteHistoryRecord(id);
  }

  /**
   * Clears all history records.
   */
  async clearHistory(): Promise<void> {
    await storageRepository.clearAllHistory();
  }

  /**
   * Exports history records to formatted CSV string.
   */
  generateCsv(records: FormHistoryRecord[]): string {
    const headers = [
      'Record ID',
      'Date',
      'Status',
      'Processing Time (ms)',
      'Student Name',
      'Phone',
      'Email',
      'NID',
      'Date of Birth',
      'Gender',
      'Course',
      'Trade',
    ];

    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${r.date}"`,
      `"${r.status}"`,
      r.processingTimeMs,
      `"${r.extractedJson.student_name || ''}"`,
      `"${r.extractedJson.phone || ''}"`,
      `"${r.extractedJson.email || ''}"`,
      `"${r.extractedJson.nid || ''}"`,
      `"${r.extractedJson.date_of_birth || ''}"`,
      `"${r.extractedJson.gender || ''}"`,
      `"${r.extractedJson.course || ''}"`,
      `"${r.extractedJson.trade || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}

export const historyService = new HistoryService();
