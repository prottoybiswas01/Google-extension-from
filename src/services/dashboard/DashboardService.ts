import { FormHistoryRecord, DashboardMetrics } from '../../types';

export class DashboardService {
  /**
   * Calculates dashboard summary metrics from history records.
   */
  calculateMetrics(records: FormHistoryRecord[]): DashboardMetrics {
    const totalProcessed = records.length;
    let successfulForms = 0;
    let failedForms = 0;
    let totalProcessingTime = 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todayUsage = 0;
    let weeklyUsage = 0;
    let monthlyUsage = 0;

    for (const r of records) {
      if (r.status === 'success') {
        successfulForms++;
      } else {
        failedForms++;
      }

      totalProcessingTime += r.processingTimeMs || 0;

      if (r.timestamp >= startOfToday) {
        todayUsage++;
      }
      if (r.timestamp >= startOfWeek) {
        weeklyUsage++;
      }
      if (r.timestamp >= startOfMonth) {
        monthlyUsage++;
      }
    }

    const avgProcessingTimeMs =
      totalProcessed > 0 ? Math.round(totalProcessingTime / totalProcessed) : 0;

    return {
      totalProcessed,
      successfulForms,
      failedForms,
      avgProcessingTimeMs,
      todayUsage,
      weeklyUsage,
      monthlyUsage,
    };
  }
}

export const dashboardService = new DashboardService();
