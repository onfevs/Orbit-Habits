import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Habit, HabitStatus, DailyNotes, CalendarViewMode } from '../types';
import { getMonthDates, formatDateKey, getHolidays, isWeeklyGoalMet } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, X, Cake,
  Activity, Book, Briefcase, Coffee, Droplets, 
  Dumbbell, Heart, Moon, Music, Sun, Zap, Utensils,
  Footprints, Globe, Shield, Snowflake, Brain,
  PartyPopper, Sparkles, BookOpen, LayoutGrid, Circle, List
} from 'lucide-react';
import { CHART_THEME, WEEK_DAYS } from '../constants';
import clsx from 'clsx';
import gsap from 'gsap';

const IconMap: { [key: string]: React.ElementType } = {
  Activity, Book, Briefcase, Coffee, Droplets, 
  Dumbbell, Heart, Moon, Music, Sun, Zap, Utensils,
  Footprints, Globe, Shield, Snowflake, Brain
};

interface CircularCalendarProps {
  currentDate: Date;
  habits: Habit[];
  logs: { [habitId: string]: { [date: string]: HabitStatus } };
  notes?: DailyNotes;
  onToggleStatus: (habitId: string, date: Date, status: HabitStatus) => void;
  onSaveNote?: (date: Date, content: string) => void;
  onMonthChange: (offset: number) => void;
  showHolidays?: boolean;
  birthday?: string; // MM-DD
  startDayOfWeek?: number; // 0=Sun, 1=Mon
}

interface HoverState {
    date: Date;
    x: number;
    y: number;
    isBirthday: boolean;
    holidayName?: string;
    colorTheme?: string; // For dynamic tooltip color
}

const CircularCalendar: React.FC<CircularCalendarProps> = ({
  currentDate,
  habits,
  logs,
  notes = {},
  onToggleStatus,
  onSaveNote,
  onMonthChange,
  showHolidays = true,
  birthday,
  startDayOfWeek = 1
}) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [hoveredDay, setHoveredDay] = useState<HoverState | null>(null);
  const [localNote, setLocalNote] = useState('');
  const [viewMode, setViewMode] = useState<CalendarViewMode>('circular');

  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  
  const prevLogsRef = useRef(logs);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getMonthDates(year, month), [year, month]);
  const holidays = useMemo(() => getHolidays(year), [year]);

  const radius = 145; 
  const center = 180; 

  // Initialize note state when modal opens
  useEffect(() => {
      if (selectedDay) {
          const key = formatDateKey(selectedDay);
          setLocalNote(notes[key] || '');
      }
  }, [selectedDay, notes]);

  // Scroll to Today when switching to List View
  useEffect(() => {
      if (viewMode === 'list') {
          // Small timeout to allow render
          setTimeout(() => {
              const todayKey = formatDateKey(new Date());
              const el = dayRefs.current[todayKey];
              if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Optional: Flash effect via GSAP
                  gsap.fromTo(el, 
                      { backgroundColor: CHART_THEME.gold, scale: 1.05 }, 
                      { backgroundColor: '', scale: 1, duration: 1, clearProps: 'all' }
                  );
              }
          }, 300);
      }
  }, [viewMode]);

  const getPosition = (index: number, total: number, r: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      angle: angle
    };
  };

  const monthlyStats = useMemo(() => {
    let completed = 0;
    let total = 0;
    days.forEach(d => {
      const k = formatDateKey(d);
      habits.forEach(h => {
        total++;
        if (logs[h.id]?.[k] === 'completed') completed++;
      });
    });
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [days, habits, logs]);

  const pieData = [
    { name: 'Completed', value: monthlyStats.completed },
    { name: 'Remaining', value: monthlyStats.total - monthlyStats.completed },
  ];

  // --- LOGIC: Color Calculation ---
  const getDayColorClass = (completedCount: number, totalHabits: number, isPast: boolean, isHoliday: boolean) => {
      if (totalHabits === 0) return { bg: "bg-surface", text: "text-muted", border: "border-slate-700", type: 'neutral' };
      
      // 0. No habits completed
      if (completedCount === 0) {
           // Holiday Priority: If it's a holiday and nothing is done, show holiday color
           if (isHoliday) {
               return {
                   bg: "bg-indigo-900/50",
                   text: "text-indigo-200 font-semibold",
                   border: "border-indigo-500/50",
                   shadow: "shadow-[0_0_10px_rgba(99,102,241,0.3)]",
                   type: 'holiday'
               };
           }

           return isPast 
             ? { bg: "bg-slate-900/30", text: "text-slate-700/60", border: "border-slate-800/50", type: 'neutral' } 
             : { bg: "bg-surface", text: "text-muted", border: "border-slate-700", type: 'neutral' };
      }

      const ratio = completedCount / totalHabits;

      // 1. Perfect (100%) -> Radiant Green
      if (ratio === 1) {
          return { 
              bg: "bg-gradient-to-br from-emerald-400 to-emerald-600", 
              text: "text-white font-bold", 
              border: "border-emerald-400",
              shadow: "shadow-neon-green",
              type: 'success'
          };
      }
      
      // 2. Good (>= 50% + 1 approx) -> Gold/Yellow
      if (ratio >= 0.5) {
           return {
               bg: "bg-gradient-to-br from-amber-300 to-orange-400",
               text: "text-black font-bold",
               border: "border-amber-400",
               shadow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]",
               type: 'warning'
           };
      }

      // 3. Bad (< 50%) -> Red
      return {
          bg: "bg-gradient-to-br from-red-500 to-red-700",
          text: "text-white",
          border: "border-red-500",
          shadow: "shadow-[0_0_10px_rgba(239,68,68,0.4)]",
          type: 'danger'
      };
  };

  // GSAP Flash Animation on Status Change
  useEffect(() => {
    const prevLogs = prevLogsRef.current;
    days.forEach(day => {
        const dateKey = formatDateKey(day);
        let statusChanged = false;

        for (const habit of habits) {
            const prev = prevLogs[habit.id]?.[dateKey];
            const curr = logs[habit.id]?.[dateKey];
            if (prev !== curr) {
                statusChanged = true;
                break;
            }
        }

        if (statusChanged) {
            const el = dayRefs.current[dateKey];
            if (el) {
                gsap.fromTo(el, 
                    { scale: 1.4, zIndex: 100 },
                    { scale: 1, zIndex: 'auto', duration: 0.6, ease: "elastic.out(1, 0.5)" }
                );
            }
        }
    });
    prevLogsRef.current = logs;
  }, [logs, days, habits]);

  // Entrance Animation when View Mode Changes
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".day-node", 
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, stagger: { amount: 0.1, grid: "auto", from: "center" }, ease: "back.out(1.2)" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [viewMode, days]);

  const handleMouseEnter = (date: Date, isBirthday: boolean, holidayName: string | undefined, colorType: string, e: React.MouseEvent) => {
    if (window.innerWidth < 768) return; 
    if (!isBirthday && !holidayName) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const parentRect = containerRef.current?.getBoundingClientRect();
    if (!parentRect) return;

    const x = rect.left - parentRect.left + rect.width / 2;
    const y = rect.top - parentRect.top - 12;

    // Determine tooltip theme based on color type
    let theme = "indigo"; // Default holiday
    if (colorType === 'success') theme = "emerald";
    if (colorType === 'warning') theme = "amber";
    if (colorType === 'danger') theme = "red";
    if (isBirthday) theme = "pink";

    setHoveredDay({ date, isBirthday, holidayName, x, y, colorTheme: theme });
  };

  const handleDayClick = (date: Date, e: React.MouseEvent) => {
    gsap.to(e.currentTarget, { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 });
    setSelectedDay(date);
  };

  const handleSaveLocalNote = () => {
      if (selectedDay && onSaveNote) {
          onSaveNote(selectedDay, localNote);
      }
  };

  // --- RENDER HELPERS ---
  const renderDayNode = (date: Date, index: number, total: number) => {
      const dateKey = formatDateKey(date);
      const holidayName = showHolidays ? holidays[dateKey] : undefined;
      const isHoliday = !!holidayName;
      const hasNote = notes[dateKey] && notes[dateKey].trim().length > 0;
      
      const currentMMDD = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const isBirthday = birthday === currentMMDD;
      
      const isToday = formatDateKey(new Date()) === dateKey;
      const isSelected = selectedDay && formatDateKey(selectedDay) === dateKey;
      const isPast = date.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

      // --- LOGIC UPDATE: CHECK FOR COMPLETED OR WEEKLY GOAL MET ---
      let effectiveCompletedCount = 0;
      habits.forEach(h => {
        const status = logs[h.id]?.[dateKey];
        
        if (status === 'completed') {
            effectiveCompletedCount++;
        } else {
            // Check if user already hit the weekly goal for this habit in this week
            const goalMet = isWeeklyGoalMet(h, date, logs[h.id] || {}, startDayOfWeek);
            if (goalMet) {
                // If goal met, we count this "failed" or "skipped" day as a success (Rest Day)
                // for the purpose of the visual color indicator
                effectiveCompletedCount++;
            }
        }
      });

      const colors = getDayColorClass(effectiveCompletedCount, habits.length, isPast, isHoliday);

      // Birthday override style for ALL views
      const birthdayClasses = "bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 text-white font-bold border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.6)] animate-pulse-slow";

      // Positional styles based on View Mode
      let style: React.CSSProperties = {};
      let className = clsx(
          "day-node relative flex items-center justify-center transition-all cursor-pointer focus:outline-none touch-manipulation",
          // Priority: Birthday > Standard Colors
          isBirthday ? birthdayClasses : clsx(colors.bg, colors.text, colors.border, colors.shadow),
          "border hover:z-20",
          // Today flash effect
          isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background z-30 animate-flash" : "",
          isSelected ? "scale-110 z-40 ring-2 ring-white" : ""
      );

      // View Specific Styles
      if (viewMode === 'circular') {
          const pos = getPosition(index, total, radius);
          style = { 
              left: `calc(50% + ${pos.x - center}px - 16px)`, 
              top: `calc(50% + ${pos.y - center}px - 16px)`,
              position: 'absolute'
          };
          className += " w-8 h-8 rounded-full text-xs font-medium";
          // Extra glow for circular view birthday specifically
          if (isBirthday) {
             className += " border-2";
          }
      } else if (viewMode === 'grid') {
          className += " w-full aspect-square rounded-xl text-sm font-semibold hover:scale-105 shadow-sm";
      } else if (viewMode === 'list') {
          className += " w-full p-4 rounded-xl justify-between px-6 mb-2 hover:translate-x-1";
      }

      // Icon for list view
      const renderListContent = () => (
          <>
             <span className="font-bold flex items-center gap-2 font-sans text-sm">
                 {date.getDate()} <span className="text-xs font-normal opacity-70 uppercase tracking-wide">{WEEK_DAYS[date.getDay()]}</span>
                 {isHoliday && <span className={clsx("text-[10px] px-1.5 py-0.5 rounded ml-2 truncate max-w-[100px]", isBirthday ? "bg-white/20 text-white" : "bg-indigo-500/20 text-indigo-300")}>{holidayName}</span>}
                 {isBirthday && <Cake size={14} className="animate-bounce" />}
                 {isToday && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">HOY</span>}
             </span>
             <div className="flex gap-1">
                 {habits.slice(0, 5).map(h => (
                     <div key={h.id} className={clsx("w-2 h-2 rounded-full", logs[h.id]?.[dateKey] === 'completed' ? "bg-white" : "bg-black/20")}></div>
                 ))}
             </div>
          </>
      );

      return (
        <button
          key={dateKey}
          ref={(el) => { dayRefs.current[dateKey] = el; }}
          onClick={(e) => handleDayClick(date, e)}
          onMouseEnter={(e) => handleMouseEnter(date, isBirthday, holidayName, colors.type, e)}
          onMouseLeave={() => setHoveredDay(null)}
          className={className}
          style={style}
        >
           {viewMode === 'list' ? renderListContent() : (
               <>
                 {isBirthday ? <Cake size={viewMode === 'grid' ? 14 : 14} className="animate-bounce" /> : date.getDate()}
                 {hasNote && !isSelected && (
                     <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full border border-background"></div>
                 )}
               </>
           )}
        </button>
      );
  };

  // Helper for dynamic Tooltip colors
  const getTooltipClasses = (theme?: string) => {
      switch(theme) {
          case 'emerald': return "from-emerald-600 via-green-600 to-teal-800 border-emerald-400/40";
          case 'amber': return "from-amber-500 via-orange-600 to-red-700 border-amber-400/40";
          case 'red': return "from-red-600 via-red-700 to-rose-900 border-red-400/40";
          case 'pink': return "from-pink-500 via-purple-600 to-indigo-700 border-pink-400/40";
          default: return "from-indigo-600 via-violet-600 to-purple-800 border-indigo-400/40"; // Default Holiday Indigo
      }
  };

  const getArrowColor = (theme?: string) => {
      switch(theme) {
          case 'emerald': return "bg-teal-800";
          case 'amber': return "bg-red-700";
          case 'red': return "bg-rose-900";
          case 'pink': return "bg-indigo-700";
          default: return "bg-purple-800";
      }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center select-none pb-10 font-sans z-10">
      
      {/* Date Navigation & View Toggle */}
      <div className="w-full flex flex-col gap-4 px-4 z-20 mb-6">
          <div className="flex justify-between items-center w-full">
            <button 
                onClick={() => onMonthChange(-1)} 
                className="p-2 rounded-full bg-surface border border-slate-700 hover:border-primary/50 text-text transition-colors shadow-soft active:scale-95"
            >
                <ChevronLeft size={20} />
            </button>
            <h2 className="text-2xl font-serif font-bold text-primary tracking-wide">
                {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
                onClick={() => onMonthChange(1)} 
                className="p-2 rounded-full bg-surface border border-slate-700 hover:border-primary/50 text-text transition-colors shadow-soft active:scale-95"
            >
                <ChevronRight size={20} />
            </button>
          </div>

          {/* View Selector Tabs */}
          <div className="flex justify-center bg-surface/50 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm self-center">
             {[
                 { id: 'circular', icon: Circle },
                 { id: 'grid', icon: LayoutGrid },
                 { id: 'list', icon: List }
             ].map((v) => (
                 <button
                    key={v.id}
                    onClick={() => setViewMode(v.id as CalendarViewMode)}
                    className={clsx(
                        "p-2 rounded-lg transition-all",
                        viewMode === v.id ? "bg-primary text-black shadow-md" : "text-slate-400 hover:text-white"
                    )}
                 >
                     <v.icon size={16} />
                 </button>
             ))}
          </div>
      </div>

      {/* --- CIRCULAR VIEW --- */}
      {viewMode === 'circular' && (
        <div className="relative w-[360px] h-[360px] mt-4 mb-8">
            <div className="absolute inset-0 rounded-full border border-slate-800/40 scale-[0.85]" />
            <div className="absolute inset-0 rounded-full border border-slate-800/20 scale-[1.1]" />

            <div className="center-chart absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-40 h-40 relative flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-full shadow-strong border-4 border-slate-800/50 overflow-hidden pointer-events-auto">
                    <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={65} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                                <Cell key="completed" fill={CHART_THEME.success} />
                                <Cell key="remaining" fill="rgba(255,255,255,0.03)" />
                            </Pie>
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-text font-serif">{monthlyStats.percentage}%</span>
                        <span className="text-[10px] text-primary uppercase tracking-wider font-semibold font-sans">Mensual</span>
                    </div>
                </div>
            </div>
            {days.map((date, index) => renderDayNode(date, index, days.length))}
        </div>
      )}

      {/* --- GRID VIEW (Combined Logic) --- */}
      {viewMode === 'grid' && (
          <div className="grid grid-cols-7 gap-3 w-full animate-in fade-in zoom-in-95">
              {/* Weekday Headers */}
              {WEEK_DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider py-2 font-sans">
                      {d}
                  </div>
              ))}
              {/* Padding for start of month */}
              {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
                  <div key={`empty-${i}`} />
              ))}
              {days.map((date, index) => renderDayNode(date, index, days.length))}
          </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
          <div className="w-full flex flex-col gap-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 animate-in slide-in-from-bottom-4">
               {days.map((date, index) => renderDayNode(date, index, days.length))}
          </div>
      )}

        {/* Enhanced Tooltip (Shared) */}
        {hoveredDay && (
            <div 
                ref={tooltipRef}
                className="absolute z-[200] pointer-events-none flex flex-col items-center min-w-[180px]"
                style={{ 
                    left: hoveredDay.x, 
                    top: hoveredDay.y, 
                    transform: 'translate(-50%, -100%)' 
                }}
            >
                <div className={clsx(
                    "rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border relative overflow-hidden flex flex-col items-center justify-center text-center gap-2 bg-gradient-to-br",
                    getTooltipClasses(hoveredDay.colorTheme)
                 )}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 animate-pulse" style={{ backgroundSize: '200% 200%' }}></div>
                    {hoveredDay.isBirthday ? <Cake size={36} className="text-white animate-bounce drop-shadow-xl" /> : <PartyPopper size={36} className="text-white drop-shadow-xl" />}
                    <span className="text-white font-serif font-black text-lg leading-tight drop-shadow-md z-10 px-2">
                        {hoveredDay.isBirthday ? "¡Feliz Cumpleaños!" : hoveredDay.holidayName}
                    </span>
                    <div className="bg-black/30 backdrop-blur-sm px-4 py-1 rounded-full border border-white/20 z-10">
                         <span className="text-white/90 text-[11px] font-sans font-bold uppercase tracking-widest">
                            {hoveredDay.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                         </span>
                    </div>
                </div>
                <div className={clsx("w-4 h-4 rotate-45 transform -translate-y-3 shadow-sm z-[90] mt-[-8px]", getArrowColor(hoveredDay.colorTheme))}></div>
            </div>
        )}

      {/* Today's Summary (Only show if not in list view to avoid clutter) */}
      {viewMode !== 'list' && (
        <div className="w-full max-w-md px-4 mt-8">
            <h3 className="text-sm font-serif font-semibold text-primary-soft uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Resumen de Hoy</h3>
            <div className="space-y-3">
                {habits.map(h => {
                    const todayKey = formatDateKey(new Date());
                    const status = logs[h.id]?.[todayKey];
                    const IconComp = (h.icon && IconMap[h.icon]) ? IconMap[h.icon] : Activity;
                    
                    return (
                        <div key={h.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-slate-700/50 shadow-soft transition-all hover:border-slate-600 hover:bg-surface/80">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 text-muted border border-slate-700">
                                    <IconComp size={14} style={{color: h.color}} />
                                </div>
                                <span className="font-medium text-text font-sans">{h.name}</span>
                            </div>
                            <button 
                            onClick={(e) => {
                                const btn = e.currentTarget;
                                if(status !== 'completed') {
                                    gsap.fromTo(btn, {backgroundColor: CHART_THEME.success, scale: 1.2}, {backgroundColor: CHART_THEME.success, scale: 1, duration: 0.4, clearProps: 'all'});
                                }
                                onToggleStatus(h.id, new Date(), status === 'completed' ? 'none' : 'completed');
                            }}
                            className={clsx(
                                "w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-90",
                                status === 'completed' 
                                    ? "bg-success border-success text-white shadow-lg shadow-success/20" 
                                    : "bg-background border-slate-700 text-slate-500 hover:border-primary/50"
                            )}
                            >
                            {status === 'completed' && <span className="text-lg">✓</span>}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
      )}

      {/* Modal for Past/Future Day Edit - USING PORTAL FOR Z-INDEX FIX */}
      {selectedDay && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div ref={modalRef} className="bg-surface border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-strong relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => { setSelectedDay(null); handleSaveLocalNote(); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-2"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-2xl font-bold font-serif mb-1 text-white flex items-center gap-2">
              {selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
              {birthday && birthday === `${String(selectedDay.getMonth()+1).padStart(2,'0')}-${String(selectedDay.getDate()).padStart(2,'0')}` && (
                 <Cake size={20} className="text-pink-500 animate-bounce" />
              )}
            </h3>
            <p className="text-muted text-sm mb-6 border-b border-slate-800 pb-2 font-sans">
               {selectedDay > new Date() ? 'Planifica para el futuro' : 'Registra tu progreso pasado'}
            </p>

            <div className="space-y-3 mb-6">
              {habits.map(habit => {
                const status = logs[habit.id]?.[formatDateKey(selectedDay)] || 'none';
                return (
                  <div key={habit.id} className="flex items-center justify-between bg-background p-3 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.color }} />
                      <span className="font-medium text-text font-sans">{habit.name}</span>
                    </div>
                    <div className="flex gap-2">
                       <button
                        onClick={(e) => {
                             const btn = e.currentTarget;
                             gsap.fromTo(btn, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: 'back.out' });
                            onToggleStatus(habit.id, selectedDay, status === 'completed' ? 'none' : 'completed');
                        }}
                        className={clsx(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors border shadow-sm active:scale-95",
                          status === 'completed' 
                            ? "bg-success border-success text-white" 
                            : "bg-surface border-slate-600 text-slate-400 hover:bg-slate-800"
                        )}
                      >
                        ✓
                      </button>
                      <button
                        onClick={(e) => {
                             const btn = e.currentTarget;
                             gsap.fromTo(btn, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: 'back.out' });
                            onToggleStatus(habit.id, selectedDay, status === 'failed' ? 'none' : 'failed');
                        }}
                        className={clsx(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors border shadow-sm active:scale-95",
                          status === 'failed' 
                            ? "bg-danger border-danger text-white" 
                            : "bg-surface border-slate-600 text-slate-400 hover:bg-slate-800"
                        )}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-sm text-slate-400 mb-2 font-medium font-sans">
                    <BookOpen size={16} className="text-primary" /> Bitácora del Día
                </label>
                <textarea
                    value={localNote}
                    onChange={(e) => setLocalNote(e.target.value)}
                    onBlur={handleSaveLocalNote}
                    placeholder="Escribe una breve reflexión o nota sobre hoy..."
                    className="w-full h-24 bg-background border border-slate-700 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-primary/50 resize-none placeholder:text-slate-600 font-sans"
                />
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CircularCalendar;