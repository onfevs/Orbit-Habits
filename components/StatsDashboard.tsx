import React, { useMemo } from 'react';
import { Habit, DailyLog, UserSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { formatDateKey, calculateStreak, calculateCriticalDays, getDaysInMonth, getSmartInsights } from '../utils';
import clsx from 'clsx';
import { Flame, Trophy, AlertTriangle, TrendingUp, ArrowUpRight, Medal, Star, Info, XCircle, CalendarRange, Target, ArrowRight, ShieldAlert, Sparkles, Lightbulb, BarChart3 } from 'lucide-react';
import { CHART_THEME, WEEK_DAYS } from '../constants';
import YearlyHeatmap from './YearlyHeatmap';

interface StatsDashboardProps {
  habits: Habit[];
  logs: { [habitId: string]: DailyLog };
  settings?: UserSettings;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ habits, logs, settings }) => {
  
  // Smart Insights
  const insights = useMemo(() => getSmartInsights(habits, logs), [habits, logs]);

  // Helper to determine flame color based on streak length
  const getFlameColor = (streak: number) => {
    if (streak === 0) return "text-slate-500";
    if (streak < 3) return "text-primary-soft";
    if (streak < 7) return "text-primary";
    return "text-orange-500 animate-pulse";
  };

  // 1. Completion rate, Streaks, Critical Days per habit
  const habitStats = useMemo(() => {
    return habits.map(h => {
      const streaks = calculateStreak(logs[h.id] || {});
      // Pass the habit object and startDayOfWeek to calculateCriticalDays
      const criticalDays = calculateCriticalDays(h, logs[h.id] || {}, settings?.startDayOfWeek ?? 1);
      
      // Calculate completion over last 30 days
      let completed30Days = 0;
      const today = new Date();
      for(let i=0; i<30; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        if (logs[h.id]?.[formatDateKey(d)] === 'completed') {
          completed30Days++;
        }
      }

      // Calculate Weekly Progress
      let weeklyCompleted = 0;
      const startOfWeek = new Date();
      const currentDay = startOfWeek.getDay(); 
      const startDay = settings?.startDayOfWeek ?? 1; 
      
      const distance = (currentDay - startDay + 7) % 7;
      startOfWeek.setDate(startOfWeek.getDate() - distance);
      startOfWeek.setHours(0,0,0,0);
      
      for (let i = 0; i < 7; i++) {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          if (logs[h.id]?.[formatDateKey(d)] === 'completed') {
              weeklyCompleted++;
          }
      }

      // Adjust weeklyProgress calculation to reflect meeting the goal
      let weeklyProgress = 0;
      if (h.goalDaysPerWeek && h.goalDaysPerWeek > 0) {
        weeklyProgress = Math.min(100, Math.round((weeklyCompleted / h.goalDaysPerWeek) * 100));
      } else {
        // If no specific goalDaysPerWeek (implies 7/7 by default, or 100% if all done)
        weeklyProgress = Math.min(100, Math.round((weeklyCompleted / 7) * 100));
      }


      return {
        name: h.name,
        completed: completed30Days, 
        weeklyCompleted,
        weeklyGoal: h.goalDaysPerWeek || 7,
        weeklyProgress, // Use the adjusted weeklyProgress
        color: h.color,
        icon: h.icon,
        description: h.description,
        currentStreak: streaks.current,
        bestStreak: streaks.longest,
        criticalDays
      };
    });
  }, [habits, logs, settings]);

  // Logic to prioritize and sort Critical Habits
  const criticalHabits = useMemo(() => {
      return habitStats
        .filter(h => h.criticalDays.length > 0)
        .sort((a, b) => {
            // 1. Sort by total critical days (Impact)
            if (b.criticalDays.length !== a.criticalDays.length) {
                return b.criticalDays.length - a.criticalDays.length;
            }
            // 2. Sort by most recent date (Urgency)
            const dateA = new Date(a.criticalDays[0]).getTime();
            const dateB = new Date(b.criticalDays[0]).getTime();
            return dateB - dateA;
        });
  }, [habitStats]);

  // Helper to format Critical Ranges
  const formatCriticalRanges = (dates: string[]) => {
      if (dates.length === 0) return [];
      const sortedDates = dates.map(d => new Date(d)).sort((a,b) => b.getTime() - a.getTime());
      const ranges: { start: Date, end: Date }[] = [];
      if (sortedDates.length > 0) {
          let start = sortedDates[0];
          let end = sortedDates[0];
          for (let i = 1; i < sortedDates.length; i++) {
              const current = sortedDates[i];
              const prev = sortedDates[i-1];
              const diffTime = Math.abs(prev.getTime() - current.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              if (diffDays <= 1 && current.getMonth() === prev.getMonth()) {
                  end = current; 
              } else {
                  ranges.push({ start, end });
                  start = current;
                  end = current;
              }
          }
          ranges.push({ start, end });
      }
      return ranges;
  };

  // 2. Daily trend
  const dailyTrend = useMemo(() => {
    const data = [];
    const today = new Date();
    const daysToShow = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    for(let i=1; i<=daysToShow; i++) {
        const d = new Date(today.getFullYear(), today.getMonth(), i);
        if (d > today) break;
        const key = formatDateKey(d);
        let dayCompleted = 0;
        let dayMissed = 0;
        habits.forEach(h => {
            if(logs[h.id]?.[key] === 'completed') dayCompleted++;
            if(logs[h.id]?.[key] === 'failed') dayMissed++;
        });
        data.push({
            date: d.getDate(), 
            completed: dayCompleted,
            missed: dayMissed
        });
    }
    return data;
  }, [habits, logs]);

  // NEW: Weekly Activity Bar Chart
  const weeklyActivityData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayName = WEEK_DAYS[d.getDay()];
        const key = formatDateKey(d);
        let completedCount = 0;
        habits.forEach(h => {
            if (logs[h.id]?.[key] === 'completed') completedCount++;
        });
        data.push({
            day: dayName,
            completed: completedCount
        });
    }
    return data; 
  }, [habits, logs]);

  // 3. Cumulative Comparison Data
  const comparisonData = useMemo(() => {
     const today = new Date();
     const thisMonth = today.getMonth();
     const thisYear = today.getFullYear();
     const prevDate = new Date(today);
     prevDate.setMonth(prevDate.getMonth() - 1);
     const prevMonth = prevDate.getMonth();
     const prevYear = prevDate.getFullYear();
     const maxDays = Math.max(
         getDaysInMonth(thisYear, thisMonth),
         getDaysInMonth(prevYear, prevMonth)
     );
     const data = [];
     let accumCurrent = 0;
     let accumPrev = 0;
     for(let d=1; d<=maxDays; d++) {
         const dateCurrent = new Date(thisYear, thisMonth, d);
         const datePrev = new Date(prevYear, prevMonth, d);
         let dailyCurrent = 0;
         if (dateCurrent <= today) {
             const key = formatDateKey(dateCurrent);
             habits.forEach(h => { if(logs[h.id]?.[key] === 'completed') dailyCurrent++; });
             accumCurrent += dailyCurrent;
         }
         let dailyPrev = 0;
         if (d <= getDaysInMonth(prevYear, prevMonth)) {
             const key = formatDateKey(datePrev);
             habits.forEach(h => { if(logs[h.id]?.[key] === 'completed') dailyPrev++; });
             accumPrev += dailyPrev;
         }
         data.push({
             day: d,
             current: dateCurrent <= today ? accumCurrent : null,
             prev: accumPrev
         });
     }
     return data;
  }, [habits, logs]);

  // 5. Weekday Performance
  const radarData = useMemo(() => {
      const counts = [0,0,0,0,0,0,0]; 
      const totals = [0,0,0,0,0,0,0];
      const today = new Date();
      for(let i=0; i<60; i++) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dayIndex = d.getDay();
          const key = formatDateKey(d);
          habits.forEach(h => {
             totals[dayIndex]++;
             if(logs[h.id]?.[key] === 'completed') {
                 counts[dayIndex]++;
             }
          });
      }
      return WEEK_DAYS.map((day, i) => ({
          subject: day,
          A: totals[i] > 0 ? Math.round((counts[i] / totals[i]) * 100) : 0,
          fullMark: 100
      }));
  }, [habits, logs]);

  // 4. Overall Pie Data - Adjusted to include color and percentage
  const pieData = useMemo(() => {
      let totalCompleted = 0;
      let totalMissed = 0;
      let totalUnmarked = 0;
      const today = new Date();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      for (let i=1; i<=daysInMonth; i++) {
          const d = new Date(today.getFullYear(), today.getMonth(), i);
          if (d > today) continue;
          const key = formatDateKey(d);
          habits.forEach(h => {
              const s = logs[h.id]?.[key];
              if (s === 'completed') totalCompleted++;
              else if (s === 'failed') totalMissed++;
              else totalUnmarked++;
          });
      }

      const rawData = [
          { name: 'Cumplidos', value: totalCompleted, color: CHART_THEME.success },
          { name: 'No cumplidos', value: totalMissed, color: CHART_THEME.danger },
          { name: 'Sin marcar', value: totalUnmarked, color: CHART_THEME.gold },
      ];

      const totalOverall = totalCompleted + totalMissed + totalUnmarked;
      
      return rawData.map(item => ({
        ...item,
        percent: totalOverall > 0 ? (item.value / totalOverall) * 100 : 0
      }));
  }, [habits, logs]);

  return (
    <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4 text-text font-sans">
      
      {/* Smart Insights Banner */}
      <section className="bg-gradient-to-r from-surface to-slate-800 border border-primary/20 rounded-xl p-6 shadow-gold relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={100} />
          </div>
          <div className="flex items-start gap-4 relative z-10">
              <div className="bg-primary/20 p-3 rounded-full text-primary">
                  <Lightbulb size={24} />
              </div>
              <div>
                  <h2 className="text-xl font-serif font-bold text-white mb-2">Insights de Rendimiento</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm font-sans">
                      <div>
                          <p className="text-muted text-xs">Día más productivo</p>
                          <p className="text-lg font-bold text-primary">{insights.bestDay}</p>
                      </div>
                      <div>
                          <p className="text-muted text-xs">Total Hábitos (Vida)</p>
                          <p className="text-lg font-bold text-white">{insights.totalCompleted}</p>
                      </div>
                      <div>
                          <p className="text-muted text-xs">MVP de la Semana</p>
                          <p className="text-lg font-bold text-success truncate">{insights.bestHabit}</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Yearly Heatmap */}
      <section className="bg-surface border border-slate-700 rounded-xl p-6 shadow-strong">
          <h2 className="text-primary font-serif font-semibold mb-4 flex items-center gap-2 text-lg">
              <CalendarRange size={20} /> Mapa de Constancia Anual
          </h2>
          <YearlyHeatmap habits={habits} logs={logs} />
      </section>

      {/* 4 Column Dashboard Layout */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Col 1: Trend */}
          <div className="bg-background border border-slate-700 rounded-xl p-4 shadow-strong flex flex-col md:col-span-1 lg:col-span-1">
             <h2 className="text-primary font-serif font-semibold mb-1 flex items-center gap-2 text-sm">
                 <TrendingUp size={16} /> Tendencia Diaria
             </h2>
             <p className="text-xs text-muted mb-4 font-sans">Cumplidos por día (Mes)</p>
             <div className="h-40 min-h-[160px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrend}>
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} height={20} />
                        <YAxis hide={true} domain={[0, 'dataMax + 1']} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#151922', borderColor: CHART_THEME.gold, color: '#fff', fontSize: '10px' }}
                            itemStyle={{ color: CHART_THEME.gold }}
                        />
                        <Line type="monotone" dataKey="completed" stroke={CHART_THEME.goldSoft} strokeWidth={3} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Col 2: Comparison */}
          <div className="bg-surface border border-slate-700 rounded-xl p-4 flex flex-col shadow-strong md:col-span-1 lg:col-span-1">
             <h2 className="text-primary font-serif font-semibold mb-1 flex items-center gap-2 text-sm">
                 <CalendarRange size={16} /> Ritmo Mensual
             </h2>
             <p className="text-xs text-muted mb-4 font-sans">Acumulado vs Anterior</p>
             <div className="h-40 min-h-[160px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={comparisonData}>
                        <defs>
                            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_THEME.success} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={CHART_THEME.success} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="day" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} height={20} />
                        <YAxis hide={true} domain={[0, 'dataMax + 1']} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#151922', borderColor: '#334155', color: '#fff', fontSize: '10px' }} 
                            labelFormatter={(label) => `Día ${label}`}
                        />
                        <Area type="monotone" dataKey="prev" stroke="#94a3b8" fillOpacity={0.1} fill="#94a3b8" name="Mes Anterior" strokeDasharray="3 3" />
                         <Area type="monotone" dataKey="current" stroke={CHART_THEME.success} fillOpacity={1} fill="url(#colorCurrent)" name="Este Mes" />
                    </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Col 3: Weekly Activity */}
          <div className="bg-background border border-slate-700 rounded-xl p-4 flex flex-col shadow-strong md:col-span-1 lg:col-span-1">
             <h2 className="text-primary font-serif font-semibold mb-1 flex items-center gap-2 text-sm">
                 <BarChart3 size={16} /> Actividad Semanal
             </h2>
             <p className="text-xs text-muted mb-4 font-sans">Últimos 7 días</p>
             <div className="h-32 min-h-[128px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivityData}>
                        <XAxis dataKey="day" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis hide={true} domain={[0, 'dataMax + 1']} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{ backgroundColor: '#151922', borderColor: '#334155', color: '#fff', fontSize: '10px' }} />
                        <Bar dataKey="completed" fill={CHART_THEME.gold} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Col 4: Distribution */}
          <div className="bg-surface border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center shadow-strong md:col-span-1 lg:col-span-1">
             <h2 className="text-primary font-serif font-semibold mb-1 text-sm w-full text-left">Distribución</h2>
             <div className="h-48 w-full"> {/* Increased height from h-40 to h-48 */}
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={pieData} 
                            innerRadius={30} // Reduced radius
                            outerRadius={45} // Reduced radius
                            paddingAngle={5} 
                            dataKey="value" 
                            stroke="none"
                            // Removed the problematic label prop
                            fill="white" // Ensure label text is white
                        >
                            <Cell fill={CHART_THEME.success} />
                            <Cell fill={CHART_THEME.danger} />
                            <Cell fill={CHART_THEME.gold} />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#151922', borderRadius: '8px', border: 'none', fontSize: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 font-sans">
                 {pieData.map((item, index) => (
                    <div className="flex items-center gap-1" key={item.name}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-[8px] text-muted">{item.name}</span> {/* Reduced font size to 8px */}
                        {item.percent > 0 && ( // Only show if percentage is meaningful
                            <span className="text-[8px] font-bold ml-0.5" style={{ color: item.color }}> {/* Reduced font size and margin */}
                                {item.percent.toFixed(0)}%
                            </span>
                        )}
                    </div>
                ))}
             </div>
          </div>
      </section>

      {/* Weekday Radar Chart */}
      <section className="bg-surface border border-slate-700 rounded-xl p-6 shadow-strong relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-primary font-serif font-semibold flex items-center gap-2 text-lg">
                  <Target size={20} /> Consistencia Semanal
              </h2>
          </div>
          <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'sans-serif' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Consistencia" dataKey="A" stroke={CHART_THEME.success} fill={CHART_THEME.success} fillOpacity={0.4} />
                    <Tooltip contentStyle={{ backgroundColor: '#151922', borderColor: '#334155', color: '#fff' }} formatter={(value) => [`${value}%`, 'Cumplimiento']} />
                </RadarChart>
             </ResponsiveContainer>
          </div>
      </section>

      {/* Performance By Habit */}
      <section className="bg-surface border border-slate-700 rounded-xl p-6 shadow-strong">
          <h2 className="text-primary font-serif font-semibold mb-6 text-lg">Rendimiento por Hábito (30 días)</h2>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={habitStats} layout="vertical" barSize={12} margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'sans-serif' }} />
                    <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.03)'}} 
                        contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            borderColor: 'rgba(255,255,255,0.1)', 
                            color: '#f1f5f9',
                            borderRadius: '8px',
                        }}
                    />
                    <Bar dataKey="completed" name="Días Cumplidos" radius={[0, 4, 4, 0]}>
                        {habitStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || CHART_THEME.success} />
                        ))}
                    </Bar>
                 </BarChart>
             </ResponsiveContainer>
          </div>
      </section>

      {/* Critical Days & Streaks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Critical Days */}
          <div className="bg-surface border border-slate-700 rounded-xl p-0 overflow-hidden shadow-strong flex flex-col">
             <div className="p-6 pb-2">
                <div className="flex items-center gap-2 mb-1 text-danger">
                    <ShieldAlert size={20} />
                    <h3 className="font-serif font-semibold text-lg">Atención Prioritaria</h3>
                </div>
                <p className="text-xs text-muted font-sans">Interrupciones de racha ordenadas por impacto.</p>
             </div>

             <div className="flex-1 p-4 space-y-3 font-sans">
                {criticalHabits.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-success/5 rounded-xl border border-success/10 mx-2">
                        <div className="bg-success/20 p-3 rounded-full mb-3 text-success">
                             <Star size={24} />
                        </div>
                        <p className="text-sm font-medium text-slate-200">¡Todo bajo control!</p>
                        <p className="text-xs text-muted mt-1">Has mantenido tus rachas estables recientemente.</p>
                    </div>
                ) : (
                    criticalHabits.slice(0, 4).map((stat, index) => {
                        const ranges = formatCriticalRanges(stat.criticalDays);
                        const isTopPriority = index === 0;

                        return (
                            <div 
                                key={stat.name} 
                                className={clsx(
                                    "flex flex-col gap-2 rounded-xl transition-all",
                                    isTopPriority 
                                        ? "bg-gradient-to-r from-danger/10 to-transparent border-l-4 border-danger p-4" 
                                        : "bg-slate-800/40 border border-slate-700/50 p-3 opacity-90 hover:opacity-100"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className={clsx("truncate font-medium", isTopPriority ? "text-white text-base" : "text-slate-300 text-sm")}>
                                            {stat.name}
                                        </span>
                                        <div className="flex items-center justify-center bg-danger/20 text-danger text-[10px] font-bold px-1.5 py-0.5 rounded border border-danger/30">
                                            x{stat.criticalDays.length}
                                        </div>
                                    </div>
                                    
                                    <button className={clsx("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors", isTopPriority ? "text-danger hover:text-white" : "text-slate-500 hover:text-slate-300")}>
                                        {isTopPriority ? "Planificar" : "Revisar"} <ArrowRight size={10} />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 items-center">
                                    {ranges.slice(0, 3).map((range, i) => {
                                        const opacityClass = i === 0 ? "opacity-100" : (i === 1 ? "opacity-70" : "opacity-50");
                                        const dayStr = range.start.getDate() === range.end.getDate() 
                                            ? `${range.start.getDate()}`
                                            : `${range.end.getDate()}-${range.start.getDate()}`;

                                        const monthStr = range.start.toLocaleDateString('es-ES', { month: 'short' });
                                        
                                        return (
                                            <div key={i} className={clsx("flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-mono", isTopPriority ? "bg-background border-danger/30 text-danger-200" : "bg-background border-slate-600 text-slate-400", opacityClass)}>
                                                <XCircle size={10} className={isTopPriority ? "text-danger" : "text-slate-500"} />
                                                <span>{dayStr} {monthStr}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
             </div>
          </div>

          {/* Active Streaks */}
          <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-strong">
              <div className="flex items-center gap-2 mb-4 text-primary">
                 <Trophy size={20} />
                 <h3 className="font-serif font-semibold text-lg">Mejores Rachas Activas</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 font-sans">
                 {habitStats.sort((a,b) => b.currentStreak - a.currentStreak).slice(0, 6).map((stat, i) => (
                     <div key={stat.name} className="group/tooltip relative bg-background p-3 rounded-lg border border-slate-800 flex flex-col items-center text-center hover:border-primary/40 transition-colors cursor-help">
                         <div className="flex items-center gap-2 mb-1 w-full justify-center relative">
                             {i === 0 && <Medal size={14} className="text-yellow-400 absolute left-0" />}
                             <span className="text-xs text-slate-300 truncate font-medium">{stat.name}</span>
                         </div>
                         <div className={clsx("flex items-center gap-1 font-bold text-lg", getFlameColor(stat.currentStreak))}>
                             <Flame size={16} fill="currentColor" />
                             {stat.currentStreak}
                         </div>
                     </div>
                 ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default StatsDashboard;