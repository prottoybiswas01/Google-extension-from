import React, { useState } from 'react';
import { FormHistoryRecord } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { historyService } from '../../services/history/HistoryService';
import {
  Download,
  Trash2,
  Eye,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export interface HistoryTableProps {
  records: FormHistoryRecord[];
  onRefresh: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ records, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [selectedRecord, setSelectedRecord] = useState<FormHistoryRecord | null>(null);

  // Filtered records
  const filteredRecords = records.filter((rec) => {
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const name = rec.extractedJson.student_name?.toLowerCase() || '';
    const phone = rec.extractedJson.phone?.toLowerCase() || '';
    const inst = rec.institution.toLowerCase();

    return name.includes(query) || phone.includes(query) || inst.includes(query) || rec.id.includes(query);
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this history record?')) {
      await historyService.deleteRecord(id);
      onRefresh();
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear ALL extraction history? This cannot be undone.')) {
      await historyService.clearHistory();
      onRefresh();
    }
  };

  const handleExportCsv = () => {
    const csvContent = historyService.generateCsv(filteredRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form_extraction_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonContent = JSON.stringify(filteredRecords, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form_extraction_history_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter, and Export Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search by student name, phone, institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-40">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'success', label: 'Successful Only' },
                { value: 'failed', label: 'Failed Only' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'success' | 'failed')}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            leftIcon={<FileCode className="w-3.5 h-3.5" />}
          >
            Export JSON
          </Button>

          {records.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAll}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear History
            </Button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Processing Time</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No extraction history records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {record.extractedJson.student_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {record.extractedJson.phone || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {record.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {record.processingTimeMs} ms
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded transition-colors"
                        title="View Record Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record View Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase">
                Extraction Details - {selectedRecord.id}
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Original Image</h4>
                <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-center max-h-56">
                  {selectedRecord.uploadedImage ? (
                    <img
                      src={selectedRecord.uploadedImage}
                      alt="Record Source"
                      className="max-h-48 object-contain rounded"
                    />
                  ) : (
                    <p className="text-xs text-slate-400">No image data stored.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Extracted JSON</h4>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg max-h-56 overflow-y-auto font-mono text-[11px]">
                  {JSON.stringify(selectedRecord.extractedJson, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
