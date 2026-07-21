import React from 'react';
import { ChartDataPoint } from '../../types';

export interface StatChartProps {
  title: string;
  data: ChartDataPoint[];
  color?: string;
  height?: number;
}

export const StatChart: React.FC<StatChartProps> = ({
  title,
  data,
  color = '#2563eb',
  height = 140,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
        <span className="text-[11px] font-semibold text-slate-500">
          Total: {data.reduce((acc, d) => acc + d.value, 0)}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 pt-2 border-t border-slate-100" style={{ height }}>
        {data.map((point, idx) => {
          const barHeightPercent = Math.max(Math.round((point.value / maxValue) * 100), 6);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {point.value}
              </div>
              <div className="w-full bg-slate-100 rounded-t-md overflow-hidden flex items-end h-full">
                <div
                  className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-110"
                  style={{
                    height: `${barHeightPercent}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-600 truncate max-w-full">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
