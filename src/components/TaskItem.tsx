import React, { useState } from 'react';
import { TaskItem as TaskItemType } from '../types';
import { Edit2, Trash2, Check, X, Clock, Repeat } from 'lucide-react';

interface TaskItemProps {
  task: TaskItemType;
  onUpdate: (id: string, updates: Partial<TaskItemType>) => void;
  onDelete: (id: string) => void;
  isOverdue?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate, onDelete, isOverdue }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editHours, setEditHours] = useState(task.hours);

  const handleSave = () => {
    onUpdate(task.id, { text: editText, hours: editHours });
    setIsEditing(false);
  };

  return (
    <div className={`group flex items-center gap-4 p-4 rounded-2xl transition-all border ${
      task.completed 
        ? 'bg-white/5 border-transparent opacity-60' 
        : isOverdue 
          ? 'bg-red-500/10 border-red-500/20' 
          : 'bg-white/10 border-white/10 hover:bg-white/20'
    }`}>
      <button 
        onClick={() => onUpdate(task.id, { completed: !task.completed })}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          task.completed 
            ? 'bg-emerald-500 border-emerald-500 text-white' 
            : 'border-[var(--text-muted)] hover:border-[var(--accent)]'
        }`}
      >
        {task.completed && <Check className="w-4 h-4" />}
      </button>

      <div className="flex-grow min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <input 
              className="w-full bg-white/10 p-2 rounded-lg text-sm text-[var(--text-main)] outline-none border border-[var(--accent)]"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input 
                type="number"
                className="w-20 bg-white/10 p-2 rounded-lg text-sm text-[var(--text-main)] outline-none border border-white/10"
                value={editHours}
                onChange={(e) => setEditHours(parseFloat(e.target.value))}
              />
              <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded-lg"><Check className="w-4 h-4" /></button>
              <button onClick={() => setIsEditing(false)} className="p-2 bg-red-500 text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <>
            <p className={`text-sm font-medium truncate ${task.completed ? 'line-through' : 'text-[var(--text-main)]'}`}>
              {task.text}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                {task.hours}h
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                <Repeat className="w-3 h-3" />
                Every {task.repeatInterval}d
              </div>
              {isOverdue && !task.completed && (
                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Overdue</span>
              )}
            </div>
          </>
        )}
      </div>

      {!isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
