import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  format, 
  isSameDay, 
  startOfMonth, 
  differenceInDays, 
  parseISO, 
  isAfter, 
  isBefore, 
  subDays,
  startOfDay
} from 'date-fns';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  RoutineItem, 
  TaskItem as TaskItemType, 
  DailyProgress, 
  Tab, 
  Theme, 
  CardItem, 
  CustomTheme 
} from './types';
import { themePresets } from './presets';
import { DashboardStats } from './src/components/DashboardStats';
import { ProgressChart } from './src/components/ProgressChart';
import { StudyCalendar } from './src/components/StudyCalendar';
import { TaskForm } from './src/components/TaskForm';
import { TaskList } from './src/components/TaskList';
import { RoutineList } from './src/components/RoutineList';
import { Layout, CheckSquare, List, Target, Sparkles, Settings, LogOut, User as UserIcon, Github, Globe } from 'lucide-react';

const DEFAULT_ROUTINE: RoutineItem[] = [
  { id: 'r1', label: 'Morning Ritual', duration: 45 },
  { id: 'r2', label: 'Deep Work Focus', duration: 120 },
  { id: 'r3', label: 'Lunch & Relax', duration: 60 },
  { id: 'r4', label: 'Skill Building', duration: 90 },
  { id: 'r5', label: 'Evening Review', duration: 30 },
];

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
    return 360; 
  }
};

const AutoExpandingTextarea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}> = ({ value, onChange, className, placeholder, onKeyDown }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
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
      onKeyDown={onKeyDown}
      onInput={adjustHeight}
    />
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('vtm_theme_v6') as Theme) || 'default');
  const [wakeUpTime, setWakeUpTime] = useState(() => localStorage.getItem('vtm_wakeup_v6') || '06:00 AM');
  
  // Theme Customization State
  const [customBgUrl, setCustomBgUrl] = useState(() => localStorage.getItem('vtm_custom_bg_v6') || '');
  const [customBaseStyle, setCustomBaseStyle] = useState<Theme>(() => (localStorage.getItem('vtm_custom_base_v6') as Theme) || 'default');
  const [savedThemes, setSavedThemes] = useState<CustomTheme[]>(() => JSON.parse(localStorage.getItem('vtm_saved_themes_v6') || '[]'));
  const [showDesigner, setShowDesigner] = useState(false);
  const [themeDraftName, setThemeDraftName] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);

  const [isProfileMenuPinned, setIsProfileMenuPinned] = useState(false);
  const [isProfileMenuHover, setIsProfileMenuHover] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isProfileMenuOpen = isProfileMenuPinned || isProfileMenuHover;

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuPinned(false);
        setIsProfileMenuHover(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const designerRef = useRef<HTMLDivElement>(null);

  // Core Data
  const [tasks, setTasks] = useState<TaskItemType[]>(() => JSON.parse(localStorage.getItem('vtm_tasks_v6') || '[]'));
  const [routine, setRoutine] = useState<RoutineItem[]>(() => JSON.parse(localStorage.getItem('vtm_routine_v6') || JSON.stringify(DEFAULT_ROUTINE)));
  const [progressData, setProgressData] = useState<DailyProgress[]>(() => JSON.parse(localStorage.getItem('vtm_progress_v6') || '[]'));
  const [goals, setGoals] = useState<CardItem[]>(() => JSON.parse(localStorage.getItem('vtm_goals_v6') || '[]'));
  const [dreams, setDreams] = useState<CardItem[]>(() => JSON.parse(localStorage.getItem('vtm_dreams_v6') || '[]'));

  // Monthly Reset Logic
  useEffect(() => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const storedMonthKey = localStorage.getItem('vtm_month_key');

    if (storedMonthKey && storedMonthKey !== currentMonthKey) {
      // It's a new month! Reset progress but keep tasks
      setProgressData([]);
      localStorage.setItem('vtm_progress_v6', '[]');
    }
    localStorage.setItem('vtm_month_key', currentMonthKey);
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('vtm_theme_v6', theme);
    localStorage.setItem('vtm_wakeup_v6', wakeUpTime);
    localStorage.setItem('vtm_tasks_v6', JSON.stringify(tasks));
    localStorage.setItem('vtm_routine_v6', JSON.stringify(routine));
    localStorage.setItem('vtm_progress_v6', JSON.stringify(progressData));
    localStorage.setItem('vtm_goals_v6', JSON.stringify(goals));
    localStorage.setItem('vtm_dreams_v6', JSON.stringify(dreams));
    localStorage.setItem('vtm_custom_bg_v6', customBgUrl);
    localStorage.setItem('vtm_custom_base_v6', customBaseStyle);
    localStorage.setItem('vtm_saved_themes_v6', JSON.stringify(savedThemes));

    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'custom') {
      document.documentElement.setAttribute('data-base', customBaseStyle === 'custom' ? 'default' : customBaseStyle);
      document.documentElement.style.setProperty('--custom-url', `url('${customBgUrl}')`);
    } else {
      document.documentElement.removeAttribute('data-base');
    }
  }, [theme, wakeUpTime, tasks, routine, progressData, goals, dreams, customBgUrl, customBaseStyle, savedThemes]);

  // Task Filtering Logic (Repeat Interval)
  const todayTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return tasks.filter(task => {
      const start = startOfDay(parseISO(task.startDate));
      const diff = differenceInDays(today, start);
      return diff >= 0 && diff % task.repeatInterval === 0;
    });
  }, [tasks]);

  // Scheduled Routine Calculation
  const scheduledRoutine = useMemo(() => {
    let currentTime = timeToMinutes(wakeUpTime);
    return routine.map((item) => {
      const start = item.isFixed && item.fixedStartTime !== undefined ? item.fixedStartTime : currentTime;
      const end = start + item.duration;
      currentTime = end;
      return { item, start, end };
    }).sort((a, b) => a.start - b.start);
  }, [routine, wakeUpTime]);

  // Stats Calculations
  const totalHoursMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return progressData
      .filter(p => {
        const d = parseISO(p.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => acc + curr.totalHours, 0);
  }, [progressData]);

  const streaks = useMemo(() => {
    const sortedDates = progressData
      .filter(p => p.totalHours > 0)
      .map(p => p.date)
      .sort((a, b) => b.localeCompare(a));

    if (sortedDates.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // Check if current streak is active (today or yesterday)
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      let checkDate = parseISO(sortedDates[0]);
      for (let i = 0; i < sortedDates.length; i++) {
        if (isSameDay(parseISO(sortedDates[i]), checkDate)) {
          current++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let lastDate: Date | null = null;
    const allDatesSorted = [...sortedDates].sort((a, b) => a.localeCompare(b));
    for (const dateStr of allDatesSorted) {
      const date = parseISO(dateStr);
      if (lastDate && differenceInDays(date, lastDate) === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      longest = Math.max(longest, tempStreak);
      lastDate = date;
    }

    return { current, longest };
  }, [progressData]);

  // Handlers
  const handleAddTask = (taskData: Omit<TaskItemType, 'id' | 'completed' | 'createdAt'>) => {
    const newTask: TaskItemType = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
  };

  const handleUpdateTask = (id: string, updates: Partial<TaskItemType>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));

    // Update progress if task is completed/uncompleted
    if (updates.completed !== undefined) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      setProgressData(prev => {
        const existing = prev.find(p => p.date === today);
        if (existing) {
          const newCompletedTasks = updates.completed 
            ? [...existing.completedTasks, id]
            : existing.completedTasks.filter(tid => tid !== id);
          
          const newTotalHours = updates.completed
            ? existing.totalHours + task.hours
            : existing.totalHours - task.hours;

          return prev.map(p => p.date === today ? { ...p, completedTasks: newCompletedTasks, totalHours: Math.max(0, newTotalHours) } : p);
        } else if (updates.completed) {
          return [...prev, { date: today, totalHours: task.hours, completedTasks: [id] }];
        }
        return prev;
      });
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleUpdateRoutine = (id: string, updates: Partial<RoutineItem>) => {
    setRoutine(routine.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleRemoveRoutine = (id: string) => {
    setRoutine(routine.filter(r => r.id !== id));
  };

  const handleAddRoutine = () => {
    const newItem: RoutineItem = {
      id: Date.now().toString(),
      label: '',
      duration: 30,
    };
    setRoutine([...routine, newItem]);
  };

  const handleReorderRoutine = (draggedIdx: number, targetIdx: number) => {
    const newRoutine = [...routine];
    const [removed] = newRoutine.splice(draggedIdx, 1);
    newRoutine.splice(targetIdx, 0, removed);
    setRoutine(newRoutine);
  };

  const handleSaveTheme = () => {
    if (!themeDraftName.trim()) return;
    const newTheme: CustomTheme = {
      id: Date.now().toString(),
      name: themeDraftName,
      bgUrl: customBgUrl,
      baseStyle: customBaseStyle
    };
    setSavedThemes([newTheme, ...savedThemes]);
    setThemeDraftName('');
  };

  const handleDeleteTheme = (id: string) => {
    setSavedThemes(savedThemes.filter(t => t.id !== id));
  };

  const handleAddGoal = () => {
    const newGoal: CardItem = {
      id: Date.now().toString(),
      title: '',
      image: '',
      info: '',
      progress: 0
    };
    setGoals([...goals, newGoal]);
  };

  const handleAddDream = () => {
    const newDream: CardItem = {
      id: Date.now().toString(),
      title: '',
      image: '',
      info: ''
    };
    setDreams([...dreams, newDream]);
  };

  const handleAiMagic = async (item: CardItem, isGoal: boolean) => {
    if (!item.title) return;
    setIsAILoading(true);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I have a ${isGoal ? 'goal' : 'dream'} titled: "${item.title}". Context: "${item.info}". 
        Provide an Unsplash image URL matching the theme. 
        Also, suggest EXACTLY THREE actionable tasks: 
        1. One task for today.
        2. One task for tomorrow.
        3. One task for later this week.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              imageUrl: { type: Type.STRING, description: 'Direct Unsplash image URL.' },
              todayTask: { type: Type.STRING, description: 'Task to do today.' },
              tomorrowTask: { type: Type.STRING, description: 'Task to do tomorrow.' },
              weekTask: { type: Type.STRING, description: 'Task for this week.' }
            },
            required: ["imageUrl", "todayTask", "tomorrowTask", "weekTask"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      const setter = isGoal ? setGoals : setDreams;
      const list = isGoal ? goals : dreams;
      setter(list.map(x => x.id === item.id ? { ...x, image: data.imageUrl } : x));

      const today = new Date().toISOString().split('T')[0];
      handleAddTask({ text: data.todayTask, hours: 1, repeatInterval: 1, startDate: today });
    } catch (error) {
      console.error('AI request failed', error);
    } finally {
      setIsAILoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark-night' ? 'default' : 'dark-night';
    setTheme(newTheme);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDesigner = () => {
    const newState = !showDesigner;
    setShowDesigner(newState);
    if (newState) {
      setTimeout(() => {
        designerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* AI Loading Overlay */}
      {isAILoading && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/20 backdrop-blur-md animate-fadeIn">
          <div className="glass p-8 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-2xl border-white/20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[var(--accent)] animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.3em]">AI is Dreaming</p>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60 mt-1">Crafting your vision...</p>
            </div>
          </div>
        </div>
      )}

      {/* Developer Profile Section */}
      <div className="fixed top-2 right-2 sm:top-6 sm:right-6 z-[100] flex items-center gap-2 sm:gap-4">
        <div
          ref={profileMenuRef}
          className="relative"
          onMouseEnter={() => setIsProfileMenuHover(true)}
          onMouseLeave={() => setIsProfileMenuHover(false)}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileMenuPinned((prev) => !prev);
            }}
            className="glass p-2 pr-5 sm:pr-6 rounded-full flex items-center gap-2 sm:gap-3 border-white/30 backdrop-blur-3xl shadow-2xl hover:bg-white/10 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-[var(--accent)] shadow-lg">
              <img 
                src="/public/gemini3.svg" 
                alt="Developer Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Vivek Pawar</span>
              <span className="text-[8px] font-bold text-[var(--text-muted)] opacity-60 uppercase tracking-tighter">Developer</span>
            </div>
          </div>

          {/* Click / Hover Menu */}
          <div
            className={`absolute top-full right-0 mt-3 w-48 glass p-4 rounded-3xl border-white/20 shadow-2xl transition-all ${isProfileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
          >
            <div className="space-y-2">
              <a 
                href="https://github.com/vivekpawar3010" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-all">
                  <Github className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9px] font-black text-[var(--text-main)] uppercase tracking-widest">GitHub</span>
              </a>
              <a 
                href="https://www.linkedin.com/in/vivekbpawar/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-all">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[9px] font-black text-[var(--text-main)] uppercase tracking-widest">Portfolio</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <header className="pt-16 sm:pt-20 pb-10 text-center px-4">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-[var(--text-main)] mb-1 drop-shadow-sm">ZenDay</h1>
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.8em] mb-12 opacity-50">Master Your Moment</p>

        {showDesigner && (
          <div ref={designerRef} className="designer-panel glass p-8 rounded-[2.5rem] w-full max-w-2xl mx-auto shadow-2xl border-white/20 text-left mb-10 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-3 opacity-60">Visual Blueprint</label>
                  <input className="w-full glass p-4 rounded-xl text-xs text-[var(--text-main)] border border-white/10" placeholder="Paste Unsplash URL..." value={customBgUrl} onChange={(e) => setCustomBgUrl(e.target.value)} />
                </div>
                
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-3 opacity-60">Base Palette</label>
                  <div className="grid grid-cols-4 gap-2">
                    {themePresets.presets.map(preset => (
                      <div key={preset.id} className="relative group/preset">
                        <button 
                          onClick={() => setCustomBaseStyle(preset.id as Theme)} 
                          className={`w-full h-8 rounded-lg border-2 ${customBaseStyle === preset.id ? 'border-[var(--accent)]' : 'border-transparent'} ${preset.color} shadow-sm transition-all hover:scale-105`}
                        ></button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black/80 text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/preset:opacity-100 transition-opacity pointer-events-none z-50">
                          {preset.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)] space-y-4">
                  <input className="w-full glass p-4 rounded-xl text-xs font-bold text-[var(--text-main)] border border-white/10" placeholder="New Theme Name..." value={themeDraftName} onChange={(e) => setThemeDraftName(e.target.value)} />
                  <button onClick={handleSaveTheme} className="w-full py-4 rounded-xl bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98]">Save Theme</button>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] block mb-3 opacity-60">Your Library</label>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {savedThemes.map(st => (
                    <div key={st.id} className="group relative flex items-center gap-3 glass p-3 rounded-2xl border-white/10 hover:bg-white/20 transition-all">
                      <div className="absolute -top-2 -left-2 px-2 py-1 rounded bg-black/80 text-[7px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        Apply Theme
                      </div>
                      <div onClick={() => { setCustomBgUrl(st.bgUrl); setCustomBaseStyle(st.baseStyle); setTheme('custom'); }} className="w-10 h-10 rounded-xl overflow-hidden shrink-0 cursor-pointer shadow-sm">
                        <img src={st.bgUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      </div>
                      <div onClick={() => { setCustomBgUrl(st.bgUrl); setCustomBaseStyle(st.baseStyle); setTheme('custom'); }} className="flex-grow cursor-pointer min-w-0">
                        <p className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest truncate">{st.name}</p>
                        <p className="text-[8px] font-bold text-[var(--text-muted)] opacity-50 uppercase">{st.baseStyle}</p>
                      </div>
                      <button onClick={() => handleDeleteTheme(st.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500/30 hover:text-red-500 transition-all shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowDesigner(false)} className="mt-6 w-full py-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40 hover:opacity-100">Close Designer</button>
          </div>
        )}
      </header>

      <div className="sticky top-0 z-50 px-2 flex justify-center mb-10 pt-4">
        <nav className="glass p-2 rounded-[2rem] shadow-2xl flex gap-1 border-white/30 backdrop-blur-3xl overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Layout },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
            { id: 'routine', label: 'Routine', icon: List },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'dreams', label: 'Dreams', icon: Sparkles },
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as Tab)} 
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'tab-active' : 'text-[var(--text-muted)] hover:bg-white/10'}`}
            >
              <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <main className="px-4 sm:px-6 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="animate-fadeIn">
            <DashboardStats 
              totalHoursMonth={totalHoursMonth}
              currentStreak={streaks.current}
              longestStreak={streaks.longest}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                <TaskList 
                  title="Today's Focus"
                  tasks={todayTasks}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                />
                <ProgressChart progressData={progressData} />
              </div>
              <div>
                <StudyCalendar progressData={progressData} allTasks={tasks} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="max-w-3xl mx-auto animate-fadeIn">
            <TaskForm onAddTask={handleAddTask} />
            <TaskList 
              title="All Tasks"
              tasks={tasks}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}

        {activeTab === 'routine' && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <div className="content-card p-6 sm:p-8 flex items-center justify-between shadow-xl mb-8">
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Wake Up Time</span>
              <input 
                type="text" 
                className="text-xl font-black text-[var(--accent)] text-right w-32 focus:outline-none"
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
              />
            </div>
            <RoutineList 
              scheduledRoutine={scheduledRoutine}
              onUpdate={handleUpdateRoutine}
              onRemove={handleRemoveRoutine}
              onAdd={handleAddRoutine}
              onReorder={handleReorderRoutine}
            />
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {goals.map(goal => (
              <div key={goal.id} className="content-card overflow-hidden shadow-xl group">
                <div className="relative h-48 bg-black/10">
                  {goal.image ? (
                    <img src={goal.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-20">No Visual</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <button 
                    onClick={() => handleAiMagic(goal, true)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full glass border-white/40 flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all"
                  >
                    ✨
                  </button>
                </div>
                <div className="p-6">
                  <input 
                    className="w-full text-lg font-black text-[var(--text-main)] mb-2 placeholder:opacity-20 bg-transparent outline-none"
                    placeholder="Goal Title..."
                    value={goal.title}
                    onChange={(e) => setGoals(goals.map(g => g.id === goal.id ? { ...g, title: e.target.value } : g))}
                  />
                  <AutoExpandingTextarea 
                    className="w-full text-xs text-[var(--text-muted)] font-medium leading-relaxed opacity-60 bg-transparent outline-none resize-none"
                    placeholder="Describe the outcome..."
                    value={goal.info}
                    onChange={(val) => setGoals(goals.map(g => g.id === goal.id ? { ...g, info: val } : g))}
                  />
                  <div className="mt-6 pt-6 border-t border-[var(--border)] flex justify-between items-center">
                    <button onClick={() => setGoals(goals.filter(g => g.id !== goal.id))} className="text-[8px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-all">Remove</button>
                    <div className="flex items-center gap-2">
                       <div className="w-20 h-1 bg-black/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--accent)]" style={{ width: `${goal.progress || 0}%` }}></div>
                       </div>
                       <span className="text-[9px] font-black text-[var(--text-muted)]">{goal.progress || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={handleAddGoal} className="content-card h-64 border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-4 opacity-40 hover:opacity-100 transition-all group">
               <span className="text-4xl group-hover:scale-110 transition-transform">＋</span>
               <span className="text-[10px] font-black uppercase tracking-widest">New Goal</span>
            </button>
          </div>
        )}

        {activeTab === 'dreams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {dreams.map(dream => (
              <div key={dream.id} className="content-card overflow-hidden shadow-xl group">
                <div className="relative h-64 bg-black/10">
                  {dream.image ? (
                    <img src={dream.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Vision Missing</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
                  <button 
                    onClick={() => handleAiMagic(dream, false)}
                    className="absolute bottom-6 right-6 w-12 h-12 rounded-full glass border-white/40 flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all"
                  >
                    ✨
                  </button>
                  <div className="absolute bottom-6 left-6 right-6">
                    <input 
                      className="w-full text-xl font-black text-white placeholder:text-white/30 drop-shadow-lg bg-transparent outline-none"
                      placeholder="Dream Name..."
                      value={dream.title}
                      onChange={(e) => setDreams(dreams.map(d => d.id === dream.id ? { ...d, title: e.target.value } : d))}
                    />
                  </div>
                </div>
                <div className="p-6">
                  <AutoExpandingTextarea 
                    className="w-full text-xs text-[var(--text-muted)] font-medium leading-relaxed opacity-60 bg-transparent outline-none resize-none"
                    placeholder="What does this look like?"
                    value={dream.info}
                    onChange={(val) => setDreams(dreams.map(d => d.id === dream.id ? { ...d, info: val } : d))}
                  />
                  <div className="mt-6 flex justify-between">
                    <button onClick={() => setDreams(dreams.filter(d => d.id !== dream.id))} className="text-[8px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-all">Discard</button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={handleAddDream} className="content-card h-80 border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-4 opacity-40 hover:opacity-100 transition-all group">
               <span className="text-4xl group-hover:scale-110 transition-transform">＋</span>
               <span className="text-[10px] font-black uppercase tracking-widest">New Vision</span>
            </button>
          </div>
        )}
      </main>

      {/* Theme Switcher */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4">
        <div className="relative group">
          <button 
            onClick={toggleDesigner}
            className={`w-12 h-12 rounded-full glass border-white/40 shadow-xl flex items-center justify-center hover:scale-110 transition-all ${showDesigner ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-main)]'}`}
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <div className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg glass border-white/20 text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
            Theme Designer
          </div>
        </div>

        <div className="relative group">
          <button 
            onClick={toggleTheme}
            className="w-12 h-12 rounded-full glass border-white/40 shadow-xl flex items-center justify-center hover:scale-110 transition-all"
          >
            <Settings className="w-5 h-5 text-[var(--text-main)]" />
          </button>
          <div className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg glass border-white/20 text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
            Toggle Dark Mode
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
