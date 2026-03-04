import React, { useMemo } from 'react';
import { Habit, DailyLog } from '../types';
import { formatDateKey, getWeeklyProgress } from '../utils';
import {
    Activity, Book, Briefcase, Coffee, Droplets, Dumbbell,
    Heart, Moon, Music, Sun, Zap, Utensils, Footprints,
    Globe, Shield, Snowflake, Brain
} from 'lucide-react';
import clsx from 'clsx';

const ICON_MAP: Record<string, React.ElementType> = {
    Activity, Book, Briefcase, Coffee, Droplets, Dumbbell,
    Heart, Moon, Music, Sun, Zap, Utensils, Footprints,
    Globe, Shield, Snowflake, Brain,
};


interface WeeklyTableViewProps {
    habits: Habit[];
    logs: { [habitId: string]: DailyLog };
    startDayOfWeek: number;
    onToggleStatus: (habitId: string, date: Date, status: 'completed' | 'none' | 'failed') => void;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const WeeklyTableView: React.FC<WeeklyTableViewProps> = ({ habits, logs, startDayOfWeek, onToggleStatus }) => {
    const weekDays = useMemo(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = (day < startDayOfWeek ? day + 7 : day) - startDayOfWeek;
        const start = new Date(today);
        start.setDate(today.getDate() - diff);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, [startDayOfWeek]);

    const todayKey = formatDateKey(new Date());

    const getStatusColor = (status: string | undefined, isToday: boolean) => {
        if (status === 'completed') return 'bg-success/80 border-success text-white';
        if (status === 'failed') return 'bg-danger/60 border-danger/70 text-white';
        if (isToday) return 'bg-primary/10 border-primary/40 text-primary';
        return 'bg-slate-800/60 border-slate-700 text-slate-600';
    };

    const totalByDay = weekDays.map(d => {
        const key = formatDateKey(d);
        const completed = habits.filter(h => logs[h.id]?.[key] === 'completed').length;
        return { completed, total: habits.length, pct: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0 };
    });

    return (
        <div className="w-full">
            {/* Day headers */}
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}>
                <div className="text-xs text-muted font-semibold py-1 pl-1">Hábito</div>
                {weekDays.map((d, i) => {
                    const key = formatDateKey(d);
                    const isToday = key === todayKey;
                    return (
                        <div key={i} className={clsx(
                            "text-center text-[10px] font-bold py-1 rounded-lg",
                            isToday ? "text-primary bg-primary/10" : "text-muted"
                        )}>
                            <div>{DAY_LABELS[d.getDay()]}</div>
                            <div className={clsx("text-[11px] font-black", isToday ? "text-primary" : "text-slate-400")}>
                                {d.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Habit rows */}
            <div className="space-y-1.5">
                {habits.map(h => {
                    const weekProg = getWeeklyProgress(h, logs[h.id] || {}, startDayOfWeek);
                    const pct = Math.min(100, Math.round((weekProg.completed / weekProg.goal) * 100));
                    const IconComp = (h.icon && ICON_MAP[h.icon]) ? ICON_MAP[h.icon] : Activity;

                    return (
                        <div key={h.id} className="grid gap-1 items-center" style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}>
                            {/* Habit label */}
                            <div className="flex items-center gap-2 pr-2 min-w-0">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-slate-700"
                                    style={{ backgroundColor: h.color + '22' }}>
                                    <IconComp size={11} style={{ color: h.color }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-slate-300 truncate">{h.name}</p>
                                    <p className={clsx("text-[9px] font-bold", weekProg.isMet ? "text-success" : "text-muted")}>
                                        {weekProg.completed}/{weekProg.goal}d {weekProg.isMet ? '✓' : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Day cells */}
                            {weekDays.map((d, di) => {
                                const key = formatDateKey(d);
                                const status = logs[h.id]?.[key];
                                const isToday = key === todayKey;
                                const isFuture = d > new Date();

                                return (
                                    <button
                                        key={di}
                                        disabled={isFuture}
                                        onClick={() => {
                                            if (isFuture) return;
                                            if (navigator.vibrate) navigator.vibrate(30);
                                            const next = status === 'completed' ? 'none' : status === 'failed' ? 'none' : 'completed';
                                            onToggleStatus(h.id, d, next);
                                        }}
                                        className={clsx(
                                            "w-full aspect-square rounded-lg border text-[11px] font-bold flex items-center justify-center transition-all",
                                            isFuture ? "opacity-20 cursor-not-allowed bg-slate-900 border-slate-800" :
                                                getStatusColor(status, isToday),
                                            !isFuture && "active:scale-90 hover:opacity-90 cursor-pointer"
                                        )}
                                        title={`${h.name} - ${d.toLocaleDateString('es-ES')}`}
                                    >
                                        {status === 'completed' ? '✓' : status === 'failed' ? '✕' : ''}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Summary row */}
            <div className="grid gap-1 mt-3 pt-3 border-t border-slate-800" style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}>
                <div className="text-[10px] text-muted font-semibold flex items-center">Total día</div>
                {totalByDay.map((t, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className={clsx(
                            "text-[11px] font-black",
                            t.pct === 100 ? "text-success" : t.pct >= 50 ? "text-primary" : "text-muted"
                        )}>
                            {t.pct}%
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                            <div
                                className={clsx("h-full rounded-full",
                                    t.pct === 100 ? "bg-success" : t.pct >= 50 ? "bg-primary" : "bg-slate-600")}
                                style={{ width: `${t.pct}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeeklyTableView;
