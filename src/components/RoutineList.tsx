import React, { useState, useEffect, useRef } from 'react';
import { RoutineItem } from '../types';
import { Clock, Anchor, Move, Plus } from 'lucide-react';

interface RoutineListProps {
  scheduledRoutine: { item: RoutineItem; start: number; end: number }[];
  onUpdate: (id: string, updates: Partial<RoutineItem>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onReorder: (draggedIdx: number, targetIdx: number) => void;
}

const formatTime = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const AutoExpandingTextarea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, className, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };
  useEffect(() => { adjustHeight(); }, [value]);
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder={placeholder}
      rows={1}
      onInput={adjustHeight}
    />
  );
};

export const RoutineList: React.FC<RoutineListProps> = ({ scheduledRoutine, onUpdate, onRemove, onAdd, onReorder }) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDrop = (idx: number) => {
    if (draggedIdx !== null) {
      onReorder(draggedIdx, idx);
      setDraggedIdx(null);
    }
  };

  return (
    <div className="content-card shadow-xl overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-[var(--border)] flex justify-between items-center">
        <h3 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Daily Routine</h3>
        <span className="text-[10px] font-black bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 rounded-full uppercase tracking-widest">
          {scheduledRoutine.length} Blocks
        </span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {scheduledRoutine.map((slot, idx) => (
          <div 
            key={slot.item.id}
            draggable
            onDragStart={() => setDraggedIdx(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            className={`flex items-start p-6 hover:bg-white/5 transition-all group cursor-grab active:cursor-grabbing ${slot.item.isFixed ? 'border-l-4 border-l-[var(--accent)]' : ''}`}
          >
            <div className="w-24 shrink-0 pt-1">
              <span className="text-xs font-black text-[var(--text-muted)] opacity-70">{formatTime(slot.start)}</span>
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-1">
                <AutoExpandingTextarea 
                  className="text-sm font-bold text-[var(--text-main)] bg-transparent outline-none w-full resize-none"
                  value={slot.item.label}
                  onChange={(val) => onUpdate(slot.item.id, { label: val })}
                  placeholder="Activity name..."
                />
                <button 
                  onClick={() => onUpdate(slot.item.id, { isFixed: !slot.item.isFixed, fixedStartTime: slot.item.isFixed ? undefined : slot.start })}
                  className={`p-1 rounded-md transition-all ${slot.item.isFixed ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] opacity-30 hover:opacity-100'}`}
                  title={slot.item.isFixed ? 'Anchored' : 'Flexible'}
                >
                  {slot.item.isFixed ? <Anchor className="w-3 h-3" /> : <Move className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  className="w-12 text-[10px] font-bold text-[var(--text-muted)] bg-transparent outline-none border-b border-transparent focus:border-[var(--accent)]"
                  value={slot.item.duration}
                  onChange={(e) => onUpdate(slot.item.id, { duration: parseInt(e.target.value) || 0 })}
                />
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">mins • Ends {formatTime(slot.end)}</span>
              </div>
            </div>

            <button 
              onClick={() => onRemove(slot.item.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-red-500/30 hover:text-red-500 transition-all"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="p-6 bg-white/5 flex justify-center">
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Block
        </button>
      </div>
    </div>
  );
};
