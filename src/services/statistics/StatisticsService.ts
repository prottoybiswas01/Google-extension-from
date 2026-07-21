import { FormHistoryRecord, UsageStatistics, ChartDataPoint } from '../../types';

export class StatisticsService {
  /**
   * Generates usage trend charts and success/failure rate statistics.
   */
  generateStatistics(records: FormHistoryRecord[]): UsageStatistics {
    const total = records.length;
    let successCount = 0;
    let failureCount = 0;

    for (const r of records) {
      if (r.status === 'success') successCount++;
      else failureCount++;
    }

    const successRatePercent = total > 0 ? Math.round((successCount / total) * 100) : 0;
    const failureRatePercent = total > 0 ? Math.round((failureCount / total) * 100) : 0;

    return {
      daily: this.buildDailyData(records),
      weekly: this.buildWeeklyData(records),
      monthly: this.buildMonthlyData(records),
      successRatePercent,
      failureRatePercent,
    };
  }

  private buildDailyData(records: FormHistoryRecord[]): ChartDataPoint[] {
    const points: ChartDataPoint[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = d.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const count = records.filter((r) => r.timestamp >= dayStart && r.timestamp < dayEnd).length;
      points.push({ label, value: count });
    }

    return points;
  }

  private buildWeeklyData(records: FormHistoryRecord[]): ChartDataPoint[] {
    const points: ChartDataPoint[] = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekEnd = now.getTime() - i * 7 * 24 * 60 * 60 * 1000;
      const weekStart = weekEnd - 7 * 24 * 60 * 60 * 1000;
      const label = `W${4 - i}`;

      const count = records.filter((r) => r.timestamp >= weekStart && r.timestamp < weekEnd).length;
      points.push({ label, value: count });
    }

    return points;
  }

  private buildMonthlyData(records: FormHistoryRecord[]): ChartDataPoint[] {
    const points: ChartDataPoint[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const monthStart = d.getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();

      const count = records.filter((r) => r.timestamp >= monthStart && r.timestamp < monthEnd).length;
      points.push({ label, value: count });
    }

    return points;
  }
}

export const statisticsService = new StatisticsService();
