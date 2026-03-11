import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DailyProgress, TaskItem } from '../types';
import { format, isSameDay } from 'date-fns';

interface StudyCalendarProps {
  progressData: DailyProgress[];
  allTasks: TaskItem[];
}

export const StudyCalendar: React.FC<StudyCalendarProps> = ({ progressData, allTasks }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const events = progressData.map((p) => ({
    title: `${p.totalHours}h`,
    date: p.date,
    extendedProps: { ...p },
    backgroundColor: 'var(--accent)',
    borderColor: 'var(--accent)',
  }));

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr);
  };

  const selectedProgress = progressData.find((p) => p.date === selectedDate);
  const completedTasksForDate = selectedProgress 
    ? allTasks.filter(t => selectedProgress.completedTasks.includes(t.id))
    : [];

  return (
    <div className="content-card p-6 sm:p-8 shadow-xl mb-8 overflow-hidden">
      <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6">Study Calendar</h3>
      
      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          height="auto"
        />
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-black text-[var(--text-main)]">
                {format(new Date(selectedDate), 'MMMM do, yyyy')}
              </h4>
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/10 rounded-2xl">
                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Total Hours</span>
                <span className="text-lg font-black text-[var(--accent)]">{selectedProgress?.totalHours || 0} hrs</span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-3">Completed Tasks</span>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {completedTasksForDate.length > 0 ? (
                    completedTasksForDate.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-medium text-[var(--text-main)]">{task.text}</span>
                        <span className="ml-auto text-[10px] font-bold text-[var(--text-muted)]">{task.hours}h</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] italic text-center py-4">No tasks completed on this day.</p>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedDate(null)}
              className="mt-8 w-full py-4 rounded-xl bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        .fc {
          --fc-border-color: var(--border);
          --fc-button-bg-color: var(--accent);
          --fc-button-border-color: var(--accent);
          --fc-button-hover-bg-color: var(--accent);
          --fc-button-hover-border-color: var(--accent);
          --fc-button-active-bg-color: var(--accent);
          --fc-button-active-border-color: var(--accent);
          --fc-event-bg-color: var(--accent);
          --fc-event-border-color: var(--accent);
          --fc-today-bg-color: rgba(var(--accent-rgb), 0.1);
          font-family: 'Inter', sans-serif;
        }
        .fc .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-main);
        }
        .fc .fc-col-header-cell-cushion {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          padding: 10px 0;
        }
        .fc .fc-daygrid-day-number {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          padding: 8px;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border: 1px solid var(--border);
        }
        .fc .fc-button {
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 10px;
        }
        .fc-event {
          cursor: pointer;
          font-size: 10px;
          font-weight: 900;
          padding: 2px 4px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
