import React from 'react';
import { Flame, Trophy, Clock } from 'lucide-react';

interface DashboardStatsProps {
  totalHoursMonth: number;
  currentStreak: number;
  longestStreak: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalHoursMonth,
  currentStreak,
  longestStreak,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="content-card p-6 flex items-center gap-4 shadow-xl">
        <div className="p-3 bg-blue-500/10 rounded-2xl">
          <Clock className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Total Study Hours</p>
          <p className="text-2xl font-black text-[var(--text-main)]">{totalHoursMonth} hrs <span className="text-xs font-medium opacity-50">this month</span></p>
        </div>
      </div>

      <div className="content-card p-6 flex items-center gap-4 shadow-xl">
        <div className="p-3 bg-orange-500/10 rounded-2xl">
          <Flame className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Current Streak</p>
          <p className="text-2xl font-black text-[var(--text-main)]">{currentStreak} days</p>
        </div>
      </div>

      <div className="content-card p-6 flex items-center gap-4 shadow-xl">
        <div className="p-3 bg-yellow-500/10 rounded-2xl">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <div>
          <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Longest Streak</p>
          <p className="text-2xl font-black text-[var(--text-main)]">{longestStreak} days</p>
        </div>
      </div>
    </div>
  );
};
