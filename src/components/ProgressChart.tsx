import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DailyProgress } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface ProgressChartProps {
  progressData: DailyProgress[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ progressData }) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const chartData = daysInMonth.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const progress = progressData.find((p) => p.date === dayStr);
    return {
      name: format(day, 'd'),
      hours: progress ? progress.totalHours : 0,
      fullDate: dayStr,
    };
  });

  return (
    <div className="content-card p-6 sm:p-8 shadow-xl mb-8">
      <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6">Monthly Progress</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 800, fill: 'var(--text-muted)' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 800, fill: 'var(--text-muted)' }}
              unit="h"
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{ 
                borderRadius: '1rem', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                background: 'var(--card-bg)',
                backdropFilter: 'blur(16px)',
              }}
              labelStyle={{ fontWeight: 900, fontSize: '12px', color: 'var(--text-main)' }}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.hours > 0 ? 'var(--accent)' : 'rgba(0,0,0,0.1)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
