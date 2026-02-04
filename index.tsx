import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { RoutineItem, TaskItem, CardItem, Tab, Theme, WeekDay } from './types';

// --- Utilities ---
const formatTime = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const timeToMinutes = (timeStr: string) => {
  try {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (h === 12) h = 0;
    let total = h * 60 + m;
    if (modifier === 'PM') total += 720;
    return total;
  } catch {
    return 360; // Default 6:00 AM
  }
};

const getTodayISO = () => new Date().toISOString().split('T')[0];

const DEFAULT_ROUTINE: RoutineItem[] = [
  { id: 'r1', label: 'Morning Ritual', duration: 45 },
  { id: 'r2', label: 'Deep Work Focus', duration: 120 },
  { id: 'r3', label: 'Lunch & Relax', duration: 60 },
  { id: 'r4', label: 'Skill Building', duration: 90 },
  { id: 'r5', label: 'Evening Review', duration: 30 },
];

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// --- Sub-Components ---

const RoutineItemRow: React.FC<{ 
  slot: { item: RoutineItem; start: number; end: number }; 
  onUpdate: (id: string, updates: Partial<RoutineItem>) => void;
  onRemove: (id: string) => void;
  onDragStart: () => void;
  onDrop: () => void;
}> = ({ slot, onUpdate, onRemove, onDragStart, onDrop }) => {
  const [localLabel, setLocalLabel] = useState(slot.item.label);
  const [localDuration, setLocalDuration] = useState(slot.item.duration.toString());

  useEffect(() => {
    setLocalLabel(slot.item.label);
    setLocalDuration(slot.item.duration.toString());
  }, [slot.item.id, slot.item.label, slot.item.duration]);

  return (
    <div 
      draggable={true}
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={`flex items-center p-5 border-b border-[var(--border)] last:border-b-0 group transition-all hover:bg-white/10 cursor-grab active:cursor-grabbing ${slot.item.isFixed ? 'border-l-4 border-l-[var(--accent)]' : ''}`}
    >
      <div className="w-24 text-right pr-6 shrink-0">
        <span className="text-xs font-black text-[var(--text-muted)] opacity-70">{formatTime(slot.start)}</span>
      </div>
      <div className="flex-grow">
        <div className="flex items-center gap-3">
          <input 
            className="text-base text-[var(--text-main)] w-full font-medium"
            value={localLabel}
            onChange={(e) => {
              setLocalLabel(e.target.value);
              onUpdate(slot.item.id, { label: e.target.value });
            }}
            placeholder="New Activity..."
          />
          <button 
            onClick={() => onUpdate(slot.item.id, { isFixed: !slot.item.isFixed, fixedStartTime: slot.item.isFixed ? undefined : slot.start })}
            className={`text-[9px] px-3 py-1 rounded-full border transition-all font-black tracking-widest ${slot.item.isFixed ? 'bg-[var(--accent)] text-white border-transparent' : 'text-[var(--text-muted)] border-[var(--border)] hover:bg-white/50'}`}
          >
            {slot.item.isFixed ? 'ANCHORED' : 'FLEXIBLE'}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <input 
            type="number"
            className="text-[10px] w-12 text-[var(--text-muted)] font-bold focus:text-[var(--accent)]"
            value={localDuration}
            onChange={(e) => {
              setLocalDuration(e.target.value);
              const val = parseInt(e.target.value) || 0;
              onUpdate(slot.item.id, { duration: val });
            }}
          />
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">mins • Ends {formatTime(slot.end)}</span>
        </div>
      </div>
      <button 
        onClick={() => onRemove(slot.item.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-red-500/50 hover:text-red-500 transition-all"
      >
        ✕
      </button>
    </div>
  );
};

const TaskRow: React.FC<{ 
  task: TaskItem; 
  onUpdate: (updates: Partial<TaskItem>) => void; 
  onRemove: () => void 
}> = ({ task, onUpdate, onRemove }) => {
  const [localText, setLocalText] = useState(task.text);

  useEffect(() => {
    setLocalText(task.text);
  }, [task.id, task.text]);

  const isAlert = task.isAlert;

  return (
    <div className={`flex items-center group py-2 px-3 rounded-xl transition-all ${isAlert ? 'bg-red-50/10' : ''}`}>
      <input 
        type="checkbox" 
        checked={task.completed} 
        onChange={() => onUpdate({ completed: !task.completed })} 
        className={`w-6 h-6 rounded-full border-2 border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer bg-white/20 ${isAlert ? 'border-red-400' : ''}`} 
      />
      <div className="flex-grow ml-4 flex flex-col">
        <input 
          value={localText} 
          onChange={e => {
            setLocalText(e.target.value);
            onUpdate({ text: e.target.value });
          }} 
          className={`w-full text-base transition-all ${task.completed ? 'line-through text-[var(--text-muted)] opacity-40' : (isAlert ? 'text-red-500 font-bold' : 'text-[var(--text-main)]')}`}
          placeholder="Type a task..."
        />
        {isAlert && <span className="text-[9px] text-red-400 font-black uppercase tracking-widest mt-0.5">Alert: Missed Task</span>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isAlert && (
          <button 
            onClick={() => onUpdate({ isDaily: !task.isDaily })}
            title={task.isDaily ? "Disable Daily Recurrence" : "Make Daily Task"}
            className={`p-1.5 rounded-lg text-[10px] font-black tracking-tighter border transition-all ${task.isDaily ? 'bg-emerald-500 text-white border-emerald-500' : 'text-[var(--text-muted)] border-[var(--border)] hover:bg-white/40'}`}
          >
            DAILY
          </button>
        )}
        <button 
          onClick={onRemove} 
          className="text-red-500/30 hover:text-red-500 transition-all p-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('routine');
  
  // Theme States
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('vtm_theme_v4') as Theme) || 'default');
  const [customBgUrl, setCustomBgUrl] = useState(() => localStorage.getItem('vtm_custom_bg_v4') || '');
  const [customBaseStyle, setCustomBaseStyle] = useState<Theme>(() => (localStorage.getItem('vtm_custom_base_v4') as Theme) || 'default');
  const [showDesigner, setShowDesigner] = useState(false);

  // Settings
  const [weekStartDay, setWeekStartDay] = useState<WeekDay>(() => parseInt(localStorage.getItem('vtm_week_start') || '1') as WeekDay);
  const [lastCheckDate, setLastCheckDate] = useState(() => localStorage.getItem('vtm_last_check') || '');

  // Data States
  const [wakeUpTime, setWakeUpTime] = useState(() => localStorage.getItem('vtm_wakeup_v4') || '06:00 AM');
  const [routine, setRoutine] = useState<RoutineItem[]>(() => JSON.parse(localStorage.getItem('vtm_routine_v4') || JSON.stringify(DEFAULT_ROUTINE)));
  const [todayTasks, setTodayTasks] = useState<TaskItem[]>(() => JSON.parse(localStorage.getItem('vtm_today_v4') || '[]'));
  const [tomorrowTasks, setTomorrowTasks] = useState<TaskItem[]>(() => JSON.parse(localStorage.getItem('vtm_tomorrow_v4') || '[]'));
  const [thisWeekTasks, setThisWeekTasks] = useState<TaskItem[]>(() => JSON.parse(localStorage.getItem('vtm_week_v4') || '[]'));
  const [alertTasks, setAlertTasks] = useState<TaskItem[]>(() => JSON.parse(localStorage.getItem('vtm_alerts_v4') || '[]'));
  const [goals, setGoals] = useState<CardItem[]>(() => JSON.parse(localStorage.getItem('vtm_goals_v4') || '[]'));
  const [dreams, setDreams] = useState<CardItem[]>(() => JSON.parse(localStorage.getItem('vtm_dreams_v4') || '[]'));
  
  const [quickInput, setQuickInput] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'custom') {
      document.documentElement.setAttribute('data-base', customBaseStyle === 'custom' ? 'default' : customBaseStyle);
      document.documentElement.style.setProperty('--custom-url', `url('${customBgUrl}')`);
    } else {
      document.documentElement.removeAttribute('data-base');
    }
    localStorage.setItem('vtm_theme_v4', theme);
    localStorage.setItem('vtm_custom_bg_v4', customBgUrl);
    localStorage.setItem('vtm_custom_base_v4', customBaseStyle);
  }, [theme, customBgUrl, customBaseStyle]);

  // Persistent Sync
  useEffect(() => {
    localStorage.setItem('vtm_wakeup_v4', wakeUpTime);
    localStorage.setItem('vtm_routine_v4', JSON.stringify(routine));
    localStorage.setItem('vtm_today_v4', JSON.stringify(todayTasks));
    localStorage.setItem('vtm_tomorrow_v4', JSON.stringify(tomorrowTasks));
    localStorage.setItem('vtm_week_v4', JSON.stringify(thisWeekTasks));
    localStorage.setItem('vtm_alerts_v4', JSON.stringify(alertTasks));
    localStorage.setItem('vtm_goals_v4', JSON.stringify(goals));
    localStorage.setItem('vtm_dreams_v4', JSON.stringify(dreams));
    localStorage.setItem('vtm_week_start', weekStartDay.toString());
    localStorage.setItem('vtm_last_check', lastCheckDate);
  }, [wakeUpTime, routine, todayTasks, tomorrowTasks, thisWeekTasks, alertTasks, goals, dreams, weekStartDay, lastCheckDate]);

  // Rollover Logic
  useEffect(() => {
    const todayStr = getTodayISO();
    if (todayStr !== lastCheckDate) {
      // 1. Rollover Today Tasks to Alerts
      const missedToday = todayTasks.filter(t => !t.completed).map(t => ({ ...t, isAlert: true }));
      
      // 2. Identify Daily Tasks to respawn
      const dailyToRespawn = todayTasks.filter(t => t.isDaily).map(t => ({
        ...t,
        id: `daily-${Date.now()}-${t.text}`,
        completed: false,
        isAlert: false,
        createdAt: todayStr
      }));

      // 3. Week Rollover Check
      let newAlerts = [...alertTasks, ...missedToday];
      let updatedThisWeek = [...thisWeekTasks];
      const now = new Date();
      const currentDay = now.getDay(); // 0-6
      
      // Check if we hit a new week
      // Simple logic: if today's day of week matches weekStartDay and it's a new day
      if (currentDay === weekStartDay && lastCheckDate !== '') {
        const missedWeek = thisWeekTasks.filter(t => !t.completed).map(t => ({ ...t, isAlert: true }));
        newAlerts = [...newAlerts, ...missedWeek];
        updatedThisWeek = [];
      }

      setAlertTasks(newAlerts);
      setTodayTasks([...dailyToRespawn]); // Fresh start with daily tasks
      setThisWeekTasks(updatedThisWeek);
      setLastCheckDate(todayStr);
    }
  }, [lastCheckDate, todayTasks, thisWeekTasks, alertTasks, weekStartDay]);

  const scheduledRoutine = useMemo(() => {
    let currentTime = timeToMinutes(wakeUpTime);
    return routine.map((item) => {
      const start = item.isFixed && item.fixedStartTime !== undefined ? item.fixedStartTime : currentTime;
      const end = start + item.duration;
      currentTime = end;
      return { item, start, end };
    }).sort((a, b) => a.start - b.start);
  }, [routine, wakeUpTime]);

  const onDrop = useCallback((idx: number) => {
    if (draggedIdx === null) return;
    const newRoutine = [...routine];
    const item = newRoutine.splice(draggedIdx, 1)[0];
    newRoutine.splice(idx, 0, item);
    setRoutine(newRoutine);
    setDraggedIdx(null);
  }, [draggedIdx, routine]);

  const StylePresets = [
    { id: 'default', label: 'Classic', color: 'bg-blue-400' },
    { id: 'green-leaves', label: 'Jungle', color: 'bg-emerald-500' },
    { id: 'aroma-coffee', label: 'Coffee', color: 'bg-orange-800' },
    { id: 'honeycomb', label: 'Honey', color: 'bg-yellow-500' },
    { id: 'blue-winter', label: 'Arctic', color: 'bg-sky-300' },
    { id: 'dark-night', label: 'Night', color: 'bg-slate-900' }
  ];

  const ThemePanel = () => (
    <div className="flex flex-col items-center gap-4 mb-12">
      <div className="flex flex-wrap justify-center gap-4">
        {StylePresets.map(t => (
          <button 
            key={t.id}
            onClick={() => setTheme(t.id as Theme)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 transition-all hover:scale-105 ${theme === t.id ? 'border-[var(--accent)] bg-white/20' : 'border-transparent bg-white/10 opacity-70'}`}
          >
            <span className={`w-3 h-3 rounded-full ${t.color}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
        <button 
          onClick={() => {
            setTheme('custom');
            setShowDesigner(true);
          }}
          className={`flex items-center gap-2 px-6 py-2 rounded-2xl border-2 transition-all hover:scale-105 ${theme === 'custom' ? 'border-[var(--accent)] bg-white/20' : 'border-transparent bg-white/10 opacity-70'}`}
        >
          <span className="text-lg">🎨</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Custom Theme</span>
        </button>
      </div>

      {showDesigner && theme === 'custom' && (
        <div className="designer-panel glass p-8 rounded-[2.5rem] w-full max-w-2xl mt-4 shadow-2xl border-white/30">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-main)]">Theme Designer</h3>
            <button onClick={() => setShowDesigner(false)} className="text-xs font-bold text-[var(--text-muted)] hover:text-red-500">Close Designer</button>
          </div>
          
          <div className="space-y-6 text-left">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-2">Background Image URL</label>
              <input 
                className="w-full glass p-4 rounded-2xl text-sm text-[var(--text-main)] border border-white/20"
                placeholder="Paste image URL here... (Unsplash link, etc.)"
                value={customBgUrl}
                onChange={(e) => setCustomBgUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-3">Choose a Color Style Preset</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {StylePresets.map(preset => (
                  <button 
                    key={preset.id}
                    onClick={() => setCustomBaseStyle(preset.id as Theme)}
                    className={`flex items-center justify-center gap-3 p-3 rounded-xl border-2 transition-all ${customBaseStyle === preset.id ? 'border-[var(--accent)] bg-white/20' : 'border-transparent bg-black/5'}`}
                  >
                    <span className={`w-3 h-3 rounded-full ${preset.color}`}></span>
                    <span className="text-[9px] font-black uppercase tracking-widest">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-32">
      <header className="pt-24 pb-8 text-center px-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <img src="/gemini3.svg" alt="Vivek Task Manager logo" className="w-12 h-12" />
          <h1 className="text-6xl font-black tracking-tighter text-[var(--text-main)] drop-shadow-sm">Vivek Task Manager</h1>
        </div>
        <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.8em] mb-12 opacity-80">Design Your Day</p>
        <ThemePanel />
      </header>

      <div className="sticky top-8 z-50 px-4 flex justify-center mb-16">
        <nav className="glass p-2 rounded-[2rem] shadow-2xl flex gap-1 border border-white/20">
          {(['routine', 'tasks', 'goals', 'dreams'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-10 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === t ? 'tab-active' : 'text-[var(--text-muted)] hover:bg-white/10'}`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      <main className="px-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'routine' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="content-card p-10 flex items-center justify-between shadow-2xl">
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Day Starts At</span>
              <input 
                className="text-4xl font-light text-[var(--accent)] border-b-2 border-[var(--accent)] w-44 text-center"
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
              />
            </div>
            <div className="content-card shadow-2xl overflow-hidden divide-y divide-[var(--border)]">
              {scheduledRoutine.map((slot, idx) => (
                <RoutineItemRow 
                  key={slot.item.id}
                  slot={slot}
                  onUpdate={(id, u) => setRoutine(prev => prev.map(r => r.id === id ? {...r, ...u} : r))}
                  onRemove={(id) => setRoutine(prev => prev.filter(r => r.id !== id))}
                  onDragStart={() => setDraggedIdx(idx)}
                  onDrop={() => onDrop(idx)}
                />
              ))}
            </div>
            <button 
              onClick={() => setRoutine([...routine, { id: Date.now().toString(), label: '', duration: 30 }])}
              className="w-full py-6 border-4 border-dashed border-[var(--border)] rounded-[2.5rem] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-white/20 transition-all text-xs font-black uppercase tracking-widest"
            >
              + Expand Routine
            </button>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-12">
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
              <div className="w-full relative group">
                <input 
                  className="w-full content-card px-12 py-8 text-2xl text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:opacity-40 shadow-2xl focus:shadow-[var(--accent)]/10"
                  placeholder="What's the goal for today?"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickInput.trim()) {
                      setTodayTasks([{ id: Date.now().toString(), text: quickInput, completed: false, createdAt: getTodayISO() }, ...todayTasks]);
                      setQuickInput('');
                    }
                  }}
                />
                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">Add with Enter</div>
              </div>
              
              <div className="flex items-center gap-6 glass px-6 py-3 rounded-2xl border-white/20">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Week starts on:</span>
                <select 
                  className="bg-transparent text-[11px] font-bold text-[var(--text-main)] outline-none cursor-pointer"
                  value={weekStartDay}
                  onChange={(e) => setWeekStartDay(parseInt(e.target.value) as WeekDay)}
                >
                  {WEEK_DAYS.map((day, idx) => (
                    <option key={day} value={idx} className="bg-[var(--bg-color)] text-black">{day}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[
                { title: 'Today', list: todayTasks, set: setTodayTasks, color: 'emerald' },
                { title: 'Tomorrow', list: tomorrowTasks, set: setTomorrowTasks, color: 'indigo' },
                { title: 'This Week', list: thisWeekTasks, set: setThisWeekTasks, color: 'amber' }
              ].map(col => (
                <div key={col.title} className="content-card p-12 shadow-2xl flex flex-col min-h-[500px]">
                  <h2 className="text-3xl font-light text-[var(--text-main)] mb-10 flex items-center justify-between shrink-0">
                    <span className="flex items-center gap-4">
                      <span className={`w-4 h-4 bg-${col.color}-400 rounded-full shadow-lg`}></span> {col.title}
                    </span>
                    <button 
                      onClick={() => col.set([{ id: Date.now().toString(), text: '', completed: false, createdAt: getTodayISO() }, ...col.list])}
                      className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]"
                    >
                      + New
                    </button>
                  </h2>
                  <div className="space-y-6 flex-grow overflow-y-auto">
                    {col.list.map(t => (
                      <TaskRow 
                        key={t.id} 
                        task={t} 
                        onUpdate={(u) => col.set(col.list.map(x => x.id === t.id ? {...x, ...u} : x))}
                        onRemove={() => col.set(col.list.filter(x => x.id !== t.id))}
                      />
                    ))}
                    {col.list.length === 0 && <p className="text-sm text-[var(--text-muted)] italic opacity-30 text-center py-10">Clear mind, clear tasks.</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Alert List at the Bottom */}
            <div className="max-w-4xl mx-auto">
              <div className="content-card p-10 border-red-500/20 shadow-2xl bg-red-500/5">
                <h2 className="text-2xl font-black text-red-500 mb-8 flex items-center gap-4 uppercase tracking-[0.2em]">
                  <span className="animate-pulse">⚠️</span> Alerts & Missed Tasks
                </h2>
                <div className="space-y-4">
                  {alertTasks.map(t => (
                    <TaskRow 
                      key={t.id} 
                      task={t} 
                      onUpdate={(u) => setAlertTasks(alertTasks.map(x => x.id === t.id ? {...x, ...u} : x))}
                      onRemove={() => setAlertTasks(alertTasks.filter(x => x.id !== t.id))}
                    />
                  ))}
                  {alertTasks.length === 0 && <p className="text-sm text-[var(--text-muted)] italic opacity-30 text-center py-6">No missed tasks. Keep up the momentum!</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'goals' || activeTab === 'dreams') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {(activeTab === 'goals' ? goals : dreams).map(item => (
              <div key={item.id} className="content-card overflow-hidden shadow-2xl group transition-all duration-500 hover:-translate-y-2">
                <div className="h-64 bg-black/10 relative overflow-hidden">
                  {item.image && <img src={item.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input 
                    placeholder="Vision Image URL..."
                    className="absolute bottom-6 left-6 right-6 glass px-6 py-3 text-[11px] rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-all text-[var(--text-main)] font-bold"
                    value={item.image}
                    onChange={e => {
                      const setter = activeTab === 'goals' ? setGoals : setDreams;
                      const list = activeTab === 'goals' ? goals : dreams;
                      setter(list.map(x => x.id === item.id ? {...x, image: e.target.value} : x));
                    }}
                  />
                </div>
                <div className="p-10">
                  <input 
                    className="text-2xl font-bold text-[var(--text-main)] w-full mb-4 border-b-2 border-transparent focus:border-[var(--accent)]"
                    value={item.title}
                    onChange={e => {
                      const setter = activeTab === 'goals' ? setGoals : setDreams;
                      const list = activeTab === 'goals' ? goals : dreams;
                      setter(list.map(x => x.id === item.id ? {...x, title: e.target.value} : x));
                    }}
                    placeholder="Vision Name..."
                  />
                  <textarea 
                    className="text-sm text-[var(--text-muted)] w-full h-36 resize-none leading-relaxed"
                    value={item.info}
                    onChange={e => {
                      const setter = activeTab === 'goals' ? setGoals : setDreams;
                      const list = activeTab === 'goals' ? goals : dreams;
                      setter(list.map(x => x.id === item.id ? {...x, info: e.target.value} : x));
                    }}
                    placeholder="What does this vision look like?"
                  />
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={() => {
                        const setter = activeTab === 'goals' ? setGoals : setDreams;
                        const list = activeTab === 'goals' ? goals : dreams;
                        setter(list.filter(x => x.id !== item.id));
                      }}
                      className="text-[10px] font-black uppercase text-red-500/40 hover:text-red-500 tracking-widest"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button 
              onClick={() => {
                const setter = activeTab === 'goals' ? setGoals : setDreams;
                const list = activeTab === 'goals' ? goals : dreams;
                setter([{ id: Date.now().toString(), title: '', image: '', info: '' }, ...list]);
              }}
              className="content-card border-4 border-dashed border-[var(--border)] h-[600px] flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all bg-white/5 opacity-60"
            >
              <div className="text-7xl font-thin mb-6">+</div>
              <span className="text-sm font-black uppercase tracking-[0.4em]">New Vision</span>
            </button>
          </div>
        )}
      </main>

      <footer className="fixed bottom-10 left-0 w-full text-center opacity-30 pointer-events-none px-4">
        <p className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[1em]">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);