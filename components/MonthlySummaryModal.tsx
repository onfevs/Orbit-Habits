import React, { useState, useMemo } from 'react';
import { Habit, DailyLog } from '../types';
import { getMonthlySummaryStats } from '../utils';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import clsx from 'clsx';
import {
    ChevronLeft, ChevronRight, X, Trophy, TrendingUp, TrendingDown,
    Minus, Star, AlertCircle, Flame, Target, CalendarCheck, Award, Lock
} from 'lucide-react';

interface MonthlySummaryModalProps {
    habits: Habit[];
    logs: { [habitId: string]: DailyLog };
    startDayOfWeek: number;
    onClose: () => void;
}

const MonthlySummaryModal: React.FC<MonthlySummaryModalProps> = ({
    habits, logs, startDayOfWeek, onClose
}) => {
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

    const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
    const isFutureMonth = selectedYear > today.getFullYear() ||
        (selectedYear === today.getFullYear() && selectedMonth > today.getMonth());

    const goToPrev = () => {
        if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
        else setSelectedMonth(m => m - 1);
    };

    const goToNext = () => {
        if (isCurrentMonth) return;
        if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
        else setSelectedMonth(m => m + 1);
    };

    const stats = useMemo(
        () => getMonthlySummaryStats(habits, logs, selectedYear, selectedMonth, startDayOfWeek),
        [habits, logs, selectedYear, selectedMonth, startDayOfWeek]
    );

    const scoreColor = stats.overallPct >= 80
        ? 'text-success' : stats.overallPct >= 50 ? 'text-primary' : 'text-danger';

    const trendColor = stats.trend > 0 ? 'text-success' : stats.trend < 0 ? 'text-danger' : 'text-muted';
    const trendLabel = stats.trend > 0
        ? `+${stats.trend}% vs anterior`
        : stats.trend < 0 ? `${stats.trend}% vs anterior`
            : 'Igual que anterior';

    const motivationalMsg = () => {
        if (stats.overallPct >= 90) return '🏆 ¡Mes extraordinario!';
        if (stats.overallPct >= 75) return '🔥 Excelente constancia.';
        if (stats.overallPct >= 50) return '💪 Buen trabajo, sigue así.';
        if (stats.overallPct >= 25) return '📈 Difícil, pero aprendiste.';
        return '🌅 El próximo mes será mejor.';
    };

    const weekChartData = stats.weeks.map(w => ({ name: w.label, pct: w.pct }));

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-surface border border-slate-700 rounded-3xl shadow-strong flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-8 duration-400">

                {/* ─── Header ────────────────────────────────────────────────── */}
                <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-slate-700 rounded-t-3xl shrink-0 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

                    {/* Row 1: Icon + Title + X close — all in flex so they never overlap */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-2">
                        <div className="flex items-center gap-2">
                            <CalendarCheck size={18} className="text-primary shrink-0" />
                            <h2 className="text-lg font-serif font-bold text-white capitalize leading-tight">
                                {stats.monthName}
                            </h2>
                            {isCurrentMonth && (
                                <span className="text-[9px] text-primary/70 uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                    Actual
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 shrink-0 ml-2"
                            aria-label="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Row 2: prev ← → next navigation */}
                    <div className="flex items-center justify-between px-5 pb-3">
                        <button
                            onClick={goToPrev}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary transition-colors px-3 py-1.5 rounded-full border border-slate-700 hover:border-primary/40 bg-surface/40"
                            aria-label="Mes anterior"
                        >
                            <ChevronLeft size={14} /> Anterior
                        </button>

                        {/* Score inline */}
                        {stats.totalPossible > 0 ? (
                            <div className="flex items-center gap-3">
                                <span className={clsx("text-4xl font-black font-serif", scoreColor)}>
                                    {stats.overallPct}%
                                </span>
                                <div className="text-right">
                                    <div className={clsx("flex items-center gap-1 text-xs font-semibold", trendColor)}>
                                        {stats.trend > 0 ? <TrendingUp size={12} />
                                            : stats.trend < 0 ? <TrendingDown size={12} />
                                                : <Minus size={12} />}
                                        <span>{Math.abs(stats.trend)}%</span>
                                    </div>
                                    <p className="text-[10px] text-muted">{trendLabel}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-muted text-sm">
                                <span>📭</span> Sin registros
                            </div>
                        )}

                        <button
                            onClick={goToNext}
                            disabled={isCurrentMonth}
                            className={clsx(
                                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all",
                                isCurrentMonth
                                    ? "text-slate-600 border-slate-800 bg-slate-800/30 cursor-not-allowed"
                                    : "text-slate-400 hover:text-primary border-slate-700 hover:border-primary/40 bg-surface/40"
                            )}
                            aria-label={isCurrentMonth ? "Mes actual" : "Mes siguiente"}
                            title={isCurrentMonth ? "No hay datos futuros" : "Mes siguiente"}
                        >
                            {isCurrentMonth ? <><Lock size={12} /> Presente</> : <>Siguiente <ChevronRight size={14} /></>}
                        </button>
                    </div>

                    {/* Row 3: Sub-label */}
                    {stats.totalPossible > 0 && (
                        <div className="px-5 pb-3">
                            <p className="text-xs text-muted">
                                {stats.totalCompleted}/{stats.totalPossible} días cumplidos
                            </p>
                        </div>
                    )}
                </div>

                {/* ─── Body ────────────────────────────────────────────────── */}
                <div className="p-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">

                    {stats.totalPossible === 0 ? (
                        /* Empty state */
                        <div className="text-center py-10 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
                                <CalendarCheck size={28} className="text-slate-600" />
                            </div>
                            <div>
                                <p className="text-slate-300 font-medium">Sin actividad registrada</p>
                                <p className="text-sm text-muted mt-1">
                                    {isCurrentMonth
                                        ? 'Comienza a marcar hábitos hoy para ver tu progreso aquí.'
                                        : 'No se registraron hábitos en este mes.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Weekly chart */}
                            {weekChartData.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Target size={13} className="text-primary" /> Semanas del mes
                                    </p>
                                    <div className="h-28 bg-background rounded-xl border border-slate-800 px-2 py-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={weekChartData} barSize={24}>
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                <YAxis hide domain={[0, 100]} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(201,162,77,0.08)' }}
                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px', color: '#f1f5f9' }}
                                                    itemStyle={{ color: '#f1f5f9' }}
                                                    formatter={(v: number) => [`${v}%`, 'Cumplimiento']}
                                                />
                                                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                                                    {weekChartData.map((entry, i) => (
                                                        <Cell
                                                            key={i}
                                                            fill={
                                                                stats.bestWeek?.label === entry.name ? '#10b981'
                                                                    : entry.pct >= 75 ? '#c9a24d'
                                                                        : entry.pct >= 50 ? '#f59e0b'
                                                                            : '#ef4444'
                                                            }
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {stats.bestWeek && (
                                        <p className="text-[10px] text-success mt-1.5 flex items-center gap-1">
                                            <Star size={10} /> Mejor semana: {stats.bestWeek.label} ({stats.bestWeek.pct}%)
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Best / Worst */}
                            <div className="grid grid-cols-2 gap-3">
                                {stats.bestHabit && (
                                    <div className="bg-success/5 border border-success/20 rounded-2xl p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Trophy size={13} className="text-success" />
                                            <span className="text-[10px] text-success font-bold uppercase tracking-wider">Mejor</span>
                                        </div>
                                        <p className="font-serif font-bold text-white text-sm leading-tight">{stats.bestHabit.name}</p>
                                        <p className="text-xs text-success mt-0.5">{stats.bestHabit.pct}% · {stats.bestHabit.completed}d</p>
                                    </div>
                                )}
                                {stats.worstHabit && stats.worstHabit.id !== stats.bestHabit?.id && (
                                    <div className="bg-danger/5 border border-danger/20 rounded-2xl p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <AlertCircle size={13} className="text-danger" />
                                            <span className="text-[10px] text-danger font-bold uppercase tracking-wider">A mejorar</span>
                                        </div>
                                        <p className="font-serif font-bold text-white text-sm leading-tight">{stats.worstHabit.name}</p>
                                        <p className="text-xs text-danger mt-0.5">{stats.worstHabit.pct}% · {stats.worstHabit.completed}d</p>
                                    </div>
                                )}
                            </div>

                            {/* Per-habit breakdown */}
                            <div>
                                <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-3">Detalle por Hábito</p>
                                <div className="space-y-2">
                                    {stats.habitResults.map(h => (
                                        <div key={h.id} className="bg-background rounded-xl p-3 border border-slate-800">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                                                    {h.name}
                                                </span>
                                                <span className="text-xs font-bold text-muted">{h.completed}/{h.possible}d</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{
                                                        width: `${h.pct}%`,
                                                        backgroundColor: h.pct >= 80 ? '#10b981' : h.pct >= 50 ? '#c9a24d' : '#ef4444'
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-muted">{h.pct}%</span>
                                                {h.currentStreak > 0 && (
                                                    <span className="text-[10px] text-orange-400 flex items-center gap-0.5">
                                                        <Flame size={9} /> {h.currentStreak}d racha
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Milestones */}
                            {stats.milestones.length > 0 && (
                                <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award size={14} className="text-primary" />
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Logros</p>
                                    </div>
                                    {stats.milestones.map(h => (
                                        <div key={h.id} className="flex items-center gap-2 mb-1 last:mb-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                            <span className="text-xs text-slate-300">
                                                <span className="font-bold text-white">{h.name}</span> — {h.longestStreak} días 🏆
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Motivational message */}
                            <p className="text-center text-sm text-slate-400 italic py-1">{motivationalMsg()}</p>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-soft transition-colors"
                    >
                        {isCurrentMonth ? '¡Sigue adelante! 🚀' : 'Cerrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonthlySummaryModal;
