import React, { useMemo } from 'react';
import { Habit, DailyLog, UserSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { formatDateKey, calculateStreak, getDaysInMonth, getSmartInsights, getEffectiveDayStatus, getWeeklyProgress } from '../utils';
import clsx from 'clsx';
import { Flame, Trophy, TrendingUp, Medal, Star, CalendarRange, Target, ArrowRight, Sparkles, Lightbulb, BarChart3, AlertCircle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { CHART_THEME, WEEK_DAYS } from '../constants';
import YearlyHeatmap from './YearlyHeatmap';

interface StatsDashboardProps {
    habits: Habit[];
    logs: { [habitId: string]: DailyLog };
    settings?: UserSettings;
    onNavigateToDashboard?: () => void;
}

const StatsDashboard: React.FC<StatsDashboardProps> = React.memo(({ habits, logs, settings, onNavigateToDashboard }) => {

    const insights = useMemo(() => getSmartInsights(habits, logs), [habits, logs]);
    const startDayOfWeek = settings?.startDayOfWeek ?? 1;

    const getFlameColor = (streak: number) => {
        if (streak === 0) return "text-slate-500";
        if (streak < 3) return "text-primary-soft";
        if (streak < 7) return "text-primary";
        return "text-orange-500 animate-pulse";
    };

    // ── Habit Stats (30 days) ─────────────────────────────────────────────────
    const habitStats = useMemo(() => {
        return habits.map(h => {
            const streaks = calculateStreak(logs[h.id] || {});

            let completed30Days = 0;
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                if (logs[h.id]?.[formatDateKey(d)] === 'completed') completed30Days++;
            }

            const weekProg = getWeeklyProgress(h, logs[h.id] || {}, startDayOfWeek);

            let weeklyProgress = 0;
            if (h.goalDaysPerWeek && h.goalDaysPerWeek > 0) {
                weeklyProgress = Math.min(100, Math.round((weekProg.completed / weekProg.goal) * 100));
            } else {
                weeklyProgress = Math.min(100, Math.round((weekProg.completed / 7) * 100));
            }

            return {
                id: h.id,
                name: h.name,
                completed: completed30Days,
                weeklyCompleted: weekProg.completed,
                weeklyGoal: weekProg.goal,
                weeklyProgress,
                weeklyMet: weekProg.isMet,
                color: h.color,
                icon: h.icon,
                description: h.description,
                currentStreak: streaks.current,
                bestStreak: streaks.longest,
                goalDaysPerWeek: h.goalDaysPerWeek,
            };
        });
    }, [habits, logs, settings]);

    // ── "Hábitos en Riesgo" (replaces "Atención Prioritaria") ─────────────────
    const habitosEnRiesgo = useMemo(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = (day < startDayOfWeek ? day + 7 : day) - startDayOfWeek;
        const daysElapsed = diff + 1; // days gone this week including today
        const daysLeft = 7 - daysElapsed;

        return habits.map(h => {
            const prog = getWeeklyProgress(h, logs[h.id] || {}, startDayOfWeek);
            const needed = prog.goal - prog.completed;
            // At risk if impossible to meet goal with remaining days, OR zero progress halfway through week
            const impossible = needed > daysLeft + 1;
            const zeroMidWeek = prog.completed === 0 && daysElapsed >= 3;
            return { ...h, prog, needed, daysLeft, impossible, zeroMidWeek };
        }).filter(h => !h.prog.isMet && (h.impossible || h.zeroMidWeek || h.prog.completed < h.prog.goal));
    }, [habits, logs, startDayOfWeek]);

    // ── Daily trend (this month) ──────────────────────────────────────────────
    const dailyTrend = useMemo(() => {
        const data = [];
        const today = new Date();
        const daysToShow = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysToShow; i++) {
            const d = new Date(today.getFullYear(), today.getMonth(), i);
            if (d > today) break;
            const key = formatDateKey(d);
            let dayCompleted = 0;
            habits.forEach(h => { if (logs[h.id]?.[key] === 'completed') dayCompleted++; });
            data.push({ date: d.getDate(), completed: dayCompleted });
        }
        return data;
    }, [habits, logs]);

    // ── Weekly activity (last 7 days) ─────────────────────────────────────────
    const weeklyActivityData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const key = formatDateKey(d);
            let completedCount = 0;
            habits.forEach(h => { if (logs[h.id]?.[key] === 'completed') completedCount++; });
            data.push({ day: WEEK_DAYS[d.getDay()], completed: completedCount });
        }
        return data;
    }, [habits, logs]);

    // ── Comparison data ───────────────────────────────────────────────────────
    const comparisonData = useMemo(() => {
        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();
        const prevDate = new Date(today);
        prevDate.setMonth(prevDate.getMonth() - 1);
        const prevMonth = prevDate.getMonth();
        const prevYear = prevDate.getFullYear();
        const maxDays = Math.max(getDaysInMonth(thisYear, thisMonth), getDaysInMonth(prevYear, prevMonth));
        const data = [];
        let accumCurrent = 0;
        let accumPrev = 0;
        for (let d = 1; d <= maxDays; d++) {
            const dateCurrent = new Date(thisYear, thisMonth, d);
            const datePrev = new Date(prevYear, prevMonth, d);
            let dailyCurrent = 0;
            if (dateCurrent <= today) {
                const key = formatDateKey(dateCurrent);
                habits.forEach(h => { if (logs[h.id]?.[key] === 'completed') dailyCurrent++; });
                accumCurrent += dailyCurrent;
            }
            let dailyPrev = 0;
            if (d <= getDaysInMonth(prevYear, prevMonth)) {
                const key = formatDateKey(datePrev);
                habits.forEach(h => { if (logs[h.id]?.[key] === 'completed') dailyPrev++; });
                accumPrev += dailyPrev;
            }
            data.push({ day: d, current: dateCurrent <= today ? accumCurrent : null, prev: accumPrev });
        }
        return data;
    }, [habits, logs]);

    // ── Radar (weekday performance) — respects weekly goals ──────────────────
    const radarData = useMemo(() => {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        const totals = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        for (let i = 0; i < 60; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dayIndex = d.getDay();
            const key = formatDateKey(d);
            habits.forEach(h => {
                totals[dayIndex]++;
                const eff = getEffectiveDayStatus(h, d, logs[h.id] || {}, startDayOfWeek);
                if (eff === 'completed' || eff === 'rest') counts[dayIndex]++;
            });
        }
        return WEEK_DAYS.map((day, i) => ({
            subject: day,
            A: totals[i] > 0 ? Math.round((counts[i] / totals[i]) * 100) : 0,
            fullMark: 100
        }));
    }, [habits, logs, startDayOfWeek]);

    // ── Pie data — adds "Descanso" category ──────────────────────────────────
    const pieData = useMemo(() => {
        let totalCompleted = 0;
        let totalMissed = 0;
        let totalRest = 0;
        let totalUnmarked = 0;
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(today.getFullYear(), today.getMonth(), i);
            if (d > today) continue;
            habits.forEach(h => {
                const eff = getEffectiveDayStatus(h, d, logs[h.id] || {}, startDayOfWeek);
                if (eff === 'completed') totalCompleted++;
                else if (eff === 'rest') totalRest++;
                else if (eff === 'failed') totalMissed++;
                else totalUnmarked++;
            });
        }
        const rawData = [
            { name: 'Cumplidos', value: totalCompleted, color: CHART_THEME.success },
            { name: 'Descanso programado', value: totalRest, color: '#6366f1' },
            { name: 'No cumplidos', value: totalMissed, color: CHART_THEME.danger },
            { name: 'Sin marcar', value: totalUnmarked, color: CHART_THEME.gold },
        ].filter(d => d.value > 0);
        const totalOverall = rawData.reduce((s, d) => s + d.value, 0);
        return rawData.map(item => ({ ...item, percent: totalOverall > 0 ? (item.value / totalOverall) * 100 : 0 }));
    }, [habits, logs, startDayOfWeek]);

    return (
        <div className="space-y-6 pb-20 animate-in slide-in-from-bottom-4 text-text font-sans">

            {/* Smart Insights Banner */}
            <section className="bg-gradient-to-r from-surface to-slate-800 border border-primary/20 rounded-xl p-6 shadow-gold relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} /></div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="bg-primary/20 p-3 rounded-full text-primary"><Lightbulb size={24} /></div>
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

            {/* 4 Column Dashboard */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-background border border-slate-700 rounded-xl p-4 shadow-strong flex flex-col md:col-span-1 lg:col-span-1">
                    <h2 className="text-primary font-serif font-semibold mb-1 flex items-center gap-2 text-sm"><TrendingUp size={16} /> Tendencia Diaria</h2>
                    <p className="text-xs text-muted mb-4 font-sans">Cumplidos por día (Mes)</p>
                    <div className="h-40 min-h-[160px] flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyTrend}>
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} height={20} />
                                <YAxis hide domain={[0, 'dataMax + 1']} />
                                <Tooltip
                                    cursor={{ stroke: CHART_THEME.gold, strokeWidth: 1, strokeDasharray: '3 3' }}
                                    contentStyle={{ backgroundColor: '#151922', borderColor: CHART_THEME.gold, color: '#f1f5f9', fontSize: '11px', borderRadius: '8px' }}
                                    itemStyle={{ color: CHART_THEME.gold }}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Line type="monotone" dataKey="completed" stroke={CHART_THEME.goldSoft} strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface border border-slate-700 rounded-xl p-4 flex flex-col shadow-strong md:col-span-1 lg:col-span-1">
                    <h2 className="text-primary font-serif font-semibold mb-1 flex items-center gap-2 text-sm"><CalendarRange size={16} /> Ritmo Mensual</h2>
                    <p className="text-xs text-muted mb-4 font-sans">Acumulado vs Anterior</p>
                    <div className="h-40 min-h-[160px] flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={comparisonData}>
                                <defs>
                                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_THEME.success} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={CHART_THEME.success} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} height={20} />
                                <YAxis hide domain={[0, 'dataMax + 1']} />
                                <Tooltip
                                    cursor={{ stroke: '#334155', strokeWidth: 1 }}
                                    contentStyle={{ backgroundColor: '#151922', borderColor: '#334155', color: '#f1f5f9', fontSize: '11px', borderRadius: '8px' }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                    labelFormatter={(label) => `Día ${label}`}
                                />
                                <Area type="monotone" dataKey="prev" stroke="#94a3b8" fillOpacity={0.1} fill="#94a3b8" name="Mes Anterior" strokeDasharray="3 3" />
                                <Area type="monotone" dataKey="current" stroke={CHART_THEME.success} fillOpacity={1} fill="url(#colorCurrent)" name="Este Mes" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-background border border-slate-700 rounded-xl p-4 flex flex-col shadow-strong md:col-span-1 lg:col-span-1">
                    <h2 className="text-primary font-serif font-semibold mb-1 flex items-center gap-2 text-sm"><BarChart3 size={16} /> Actividad Semanal</h2>
                    <p className="text-xs text-muted mb-4 font-sans">Últimos 7 días</p>
                    <div className="h-32 min-h-[128px] flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyActivityData}>
                                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis hide domain={[0, 'dataMax + 1']} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(201,162,77,0.08)' }}
                                    contentStyle={{ backgroundColor: '#151922', borderColor: '#334155', color: '#f1f5f9', fontSize: '11px', borderRadius: '8px' }}
                                    itemStyle={{ color: CHART_THEME.gold }}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Bar dataKey="completed" fill={CHART_THEME.gold} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center shadow-strong md:col-span-1 lg:col-span-1">
                    <h2 className="text-primary font-serif font-semibold mb-1 text-sm w-full text-left">Distribución Mensual</h2>
                    <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} innerRadius={32} outerRadius={50} paddingAngle={4} dataKey="value" stroke="none">
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#151922', borderRadius: '8px', border: '1px solid #334155', fontSize: '11px', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1 font-sans">
                        {pieData.map((item) => (
                            <div className="flex items-center gap-1" key={item.name}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[9px] text-muted">{item.name}</span>
                                {item.percent > 0 && (
                                    <span className="text-[9px] font-bold ml-0.5" style={{ color: item.color }}>{item.percent.toFixed(0)}%</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Radar Chart */}
            <section className="bg-surface border border-slate-700 rounded-xl p-6 shadow-strong relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-primary font-serif font-semibold flex items-center gap-2 text-lg">
                        <Target size={20} /> Consistencia por Día
                    </h2>
                    <p className="text-xs text-muted">Últimos 60 días · Descansos programados = ✅</p>
                </div>
                <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'sans-serif' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Consistencia" dataKey="A" stroke={CHART_THEME.success} fill={CHART_THEME.success} fillOpacity={0.4} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#151922', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px' }}
                                itemStyle={{ color: '#f1f5f9' }}
                                labelStyle={{ color: '#94a3b8' }}
                                formatter={(value) => [`${value}%`, 'Cumplimiento']}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Performance by Habit */}
            <section className="bg-surface border border-slate-700 rounded-xl p-6 shadow-strong">
                <h2 className="text-primary font-serif font-semibold mb-6 text-lg">Rendimiento por Hábito (30 días)</h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={habitStats} layout="vertical" barSize={12} margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'sans-serif' }} />
                            <Tooltip
                                cursor={{ fill: 'rgba(201,162,77,0.08)' }}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '8px', fontSize: '11px' }}
                                itemStyle={{ color: '#f1f5f9' }}
                                labelStyle={{ color: '#94a3b8' }}
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

            {/* Grid: Hábitos en Riesgo + Rachas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ── HÁBITOS EN RIESGO (replaces "Atención Prioritaria") ── */}
                <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden shadow-strong flex flex-col">
                    <div className="p-5 pb-3 border-b border-slate-700/50">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertCircle size={20} className="text-amber-400" />
                            <h3 className="font-serif font-semibold text-lg text-white">Hábitos en Riesgo</h3>
                        </div>
                        <p className="text-xs text-muted">Hábitos que no van a alcanzar su meta esta semana.</p>
                    </div>

                    <div className="flex-1 p-4 space-y-3 font-sans">
                        {habitosEnRiesgo.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-success/5 rounded-xl border border-success/10">
                                <div className="bg-success/20 p-3 rounded-full mb-3 text-success"><Star size={24} /></div>
                                <p className="text-sm font-medium text-slate-200">¡Todo en orden!</p>
                                <p className="text-xs text-muted mt-1">Todos tus hábitos van bien esta semana.</p>
                            </div>
                        ) : (
                            habitosEnRiesgo.map((h, i) => {
                                const pct = Math.min(100, Math.round((h.prog.completed / h.prog.goal) * 100));
                                const isUrgent = h.impossible;
                                return (
                                    <div key={h.id} className={clsx(
                                        "rounded-xl p-3 border transition-all",
                                        isUrgent
                                            ? "bg-danger/5 border-danger/30 border-l-4 border-l-danger"
                                            : "bg-amber-500/5 border-amber-500/20 border-l-4 border-l-amber-500"
                                    )}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                                                <span className="text-sm font-medium text-slate-200">{h.name}</span>
                                            </div>
                                            <span className={clsx("text-xs font-bold", isUrgent ? "text-danger" : "text-amber-400")}>
                                                {h.prog.completed}/{h.prog.goal} días
                                            </span>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                                            <div
                                                className={clsx("h-full rounded-full transition-all", isUrgent ? "bg-danger" : "bg-amber-400")}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted">
                                            {h.prog.completed === 0
                                                ? "⚠️ Sin actividad esta semana"
                                                : isUrgent
                                                    ? `❌ Ya no es posible cumplir la meta (te faltan ${h.needed} días)`
                                                    : `📅 Te faltan ${h.needed} días · ${h.daysLeft + 1} jornadas restantes`}
                                        </p>
                                    </div>
                                );
                            })
                        )}

                        {habitosEnRiesgo.length > 0 && onNavigateToDashboard && (
                            <button
                                onClick={onNavigateToDashboard}
                                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-sm font-semibold transition-colors"
                            >
                                Marcar progreso hoy <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Streaks — redesigned */}
                <div className="bg-surface border border-slate-700 rounded-xl p-5 shadow-strong flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                            <Trophy size={18} />
                            <h3 className="font-serif font-semibold text-lg">Rachas Activas</h3>
                        </div>
                        <span className="text-[10px] text-muted bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                            {habitStats.filter(s => s.currentStreak > 0).length} activas
                        </span>
                    </div>

                    {/* Streak list */}
                    <div className="space-y-2 font-sans flex-1">
                        {habitStats
                            .sort((a, b) => b.currentStreak - a.currentStreak)
                            .slice(0, 6)
                            .map((stat, i) => {
                                const pct = Math.min(100, Math.round((stat.weeklyCompleted / stat.weeklyGoal) * 100));
                                const streakTier =
                                    stat.currentStreak === 0 ? { label: 'Sin racha', color: '#64748b', bg: 'bg-slate-700', glow: '' } :
                                        stat.currentStreak < 7 ? { label: `${stat.currentStreak}d`, color: '#c9a24d', bg: 'bg-primary', glow: 'shadow-[0_0_8px_rgba(201,162,77,0.4)]' } :
                                            stat.currentStreak < 21 ? { label: `${stat.currentStreak}d`, color: '#f97316', bg: 'bg-orange-500', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.5)]' } :
                                                { label: `${stat.currentStreak}d 🔥`, color: '#ef4444', bg: 'bg-red-500', glow: 'shadow-[0_0_16px_rgba(239,68,68,0.6)]' };
                                return (
                                    <div key={stat.id}
                                        className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-800 bg-background hover:border-slate-600 transition-all group"
                                    >
                                        {/* Rank */}
                                        <div className="shrink-0 w-5 text-center">
                                            {i === 0 ? <span className="text-xs">🥇</span>
                                                : i === 1 ? <span className="text-xs">🥈</span>
                                                    : i === 2 ? <span className="text-xs">🥉</span>
                                                        : <span className="text-[10px] text-muted font-bold">{i + 1}</span>}
                                        </div>
                                        {/* Color dot */}
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-slate-200 truncate">{stat.name}</span>
                                                <span className={clsx("text-xs font-bold ml-2 shrink-0", streakTier.glow)}
                                                    style={{ color: streakTier.color }}>
                                                    🔥 {streakTier.label}
                                                </span>
                                            </div>
                                            {/* Weekly progress mini-bar */}
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={clsx("h-full rounded-full transition-all duration-500",
                                                            stat.weeklyMet ? "bg-success" : "bg-primary")}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className={clsx("text-[9px] font-bold shrink-0",
                                                    stat.weeklyMet ? "text-success" : "text-muted")}>
                                                    {stat.weeklyCompleted}/{stat.weeklyGoal}
                                                    {stat.weeklyMet && " ✓"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        {habitStats.every(s => s.currentStreak === 0) && (
                            <div className="text-center py-6 text-muted text-sm">
                                <p className="text-2xl mb-2">😴</p>
                                Marca hábitos para empezar tu racha
                            </div>
                        )}
                    </div>

                    {/* Weekly achievements strip */}
                    {habitStats.some(s => s.weeklyMet) && (
                        <div className="border-t border-slate-800 pt-3">
                            <p className="text-[10px] text-success font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Star size={10} /> Metas cumplidas esta semana
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {habitStats.filter(s => s.weeklyMet).map(s => (
                                    <span key={s.id}
                                        className="text-[10px] bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <CheckCircle2 size={9} /> {s.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default StatsDashboard;