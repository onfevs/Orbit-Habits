import React, { useMemo } from 'react';
import { Habit, DailyLog } from '../types';
import { calculateStreak, formatDateKey } from '../utils';
import { X, Lock, Trophy, Flame, Star, Zap, Target, Award, Shield, Crown } from 'lucide-react';
import clsx from 'clsx';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'racha' | 'constancia' | 'volumen' | 'especial';
    condition: (data: { habits: Habit[]; logs: { [id: string]: DailyLog }; totalCompleted: number; maxStreak: number; perfectDays: number }) => boolean;
    progress?: (data: { habits: Habit[]; logs: { [id: string]: DailyLog }; totalCompleted: number; maxStreak: number; perfectDays: number }) => { current: number; max: number };
}

const ACHIEVEMENTS: Achievement[] = [
    // ── Rachas ──────────────────────────────────────────────────
    {
        id: 'first_flame', title: 'Primera Llama', description: 'Alcanza una racha de 3 días', icon: '🔥', category: 'racha',
        condition: (d) => d.maxStreak >= 3,
        progress: (d) => ({ current: Math.min(d.maxStreak, 3), max: 3 })
    },
    {
        id: 'week_streak', title: 'Semana de Fuego', description: 'Racha de 7 días consecutivos', icon: '🌟', category: 'racha',
        condition: (d) => d.maxStreak >= 7,
        progress: (d) => ({ current: Math.min(d.maxStreak, 7), max: 7 })
    },
    {
        id: 'month_streak', title: 'Imparable', description: 'Racha de 30 días consecutivos', icon: '🏆', category: 'racha',
        condition: (d) => d.maxStreak >= 30,
        progress: (d) => ({ current: Math.min(d.maxStreak, 30), max: 30 })
    },
    {
        id: 'legend_streak', title: 'Leyenda', description: 'Racha de 100 días consecutivos', icon: '👑', category: 'racha',
        condition: (d) => d.maxStreak >= 100,
        progress: (d) => ({ current: Math.min(d.maxStreak, 100), max: 100 })
    },

    // ── Constancia ──────────────────────────────────────────────
    {
        id: 'first_day', title: 'Primer Paso', description: 'Completa tu primer hábito', icon: '✅', category: 'constancia',
        condition: (d) => d.totalCompleted >= 1,
        progress: (d) => ({ current: Math.min(d.totalCompleted, 1), max: 1 })
    },
    {
        id: 'perfect_day', title: 'Día Perfecto', description: 'Completa todos los hábitos en un día', icon: '💎', category: 'constancia',
        condition: (d) => d.perfectDays >= 1,
        progress: (d) => ({ current: Math.min(d.perfectDays, 1), max: 1 })
    },
    {
        id: 'perfect_week', title: 'Semana Perfecta', description: '7 días perfectos acumulados', icon: '🌈', category: 'constancia',
        condition: (d) => d.perfectDays >= 7,
        progress: (d) => ({ current: Math.min(d.perfectDays, 7), max: 7 })
    },
    {
        id: 'perfect_month', title: 'Mes Imparable', description: '30 días perfectos acumulados', icon: '🎯', category: 'constancia',
        condition: (d) => d.perfectDays >= 30,
        progress: (d) => ({ current: Math.min(d.perfectDays, 30), max: 30 })
    },

    // ── Volumen ─────────────────────────────────────────────────
    {
        id: 'vol_10', title: 'Calentando Motores', description: 'Completa 10 hábitos en total', icon: '⚡', category: 'volumen',
        condition: (d) => d.totalCompleted >= 10,
        progress: (d) => ({ current: Math.min(d.totalCompleted, 10), max: 10 })
    },
    {
        id: 'vol_100', title: 'Centurión', description: 'Completa 100 hábitos en total', icon: '💯', category: 'volumen',
        condition: (d) => d.totalCompleted >= 100,
        progress: (d) => ({ current: Math.min(d.totalCompleted, 100), max: 100 })
    },
    {
        id: 'vol_500', title: 'Máquina de Hábitos', description: 'Completa 500 hábitos en total', icon: '🤖', category: 'volumen',
        condition: (d) => d.totalCompleted >= 500,
        progress: (d) => ({ current: Math.min(d.totalCompleted, 500), max: 500 })
    },
    {
        id: 'vol_1000', title: 'Élite', description: 'Completa 1,000 hábitos en total', icon: '🏅', category: 'volumen',
        condition: (d) => d.totalCompleted >= 1000,
        progress: (d) => ({ current: Math.min(d.totalCompleted, 1000), max: 1000 })
    },

    // ── Especiales ──────────────────────────────────────────────
    {
        id: 'early_bird', title: 'Coleccionista', description: 'Crea 5 hábitos personalizados', icon: '📚', category: 'especial',
        condition: (d) => d.habits.length >= 5,
        progress: (d) => ({ current: Math.min(d.habits.length, 5), max: 5 })
    },
    {
        id: 'multi_habit', title: 'Multitasker', description: 'Crea 10 hábitos personalizados', icon: '🎪', category: 'especial',
        condition: (d) => d.habits.length >= 10,
        progress: (d) => ({ current: Math.min(d.habits.length, 10), max: 10 })
    },
    {
        id: 'comeback', title: 'El Regreso', description: 'Marca un hábito después de 7 días sin actividad', icon: '🔄', category: 'especial',
        condition: (d) => d.totalCompleted > 0 && d.maxStreak > 0
    },
    {
        id: 'complete_all', title: 'Perfeccionista', description: 'Marca todos los hábitos del día al menos una vez', icon: '⭐', category: 'especial',
        condition: (d) => d.perfectDays >= 1
    },
];

const CATEGORY_COLORS: Record<string, string> = {
    racha: 'from-orange-500/20 to-red-500/10 border-orange-500/30',
    constancia: 'from-green-500/20 to-emerald-500/10 border-green-500/30',
    volumen: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
    especial: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
};

const CATEGORY_LABELS: Record<string, string> = {
    racha: '🔥 Rachas',
    constancia: '✅ Constancia',
    volumen: '📊 Volumen',
    especial: '⭐ Especiales',
};

interface AchievementsModalProps {
    habits: Habit[];
    logs: { [habitId: string]: DailyLog };
    onClose: () => void;
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ habits, logs, onClose }) => {
    const data = useMemo(() => {
        let totalCompleted = 0;
        let maxStreak = 0;
        let perfectDays = 0;

        // Total completed
        Object.values(logs).forEach(log => {
            Object.values(log).forEach(s => { if (s === 'completed') totalCompleted++; });
        });

        // Max streak across all habits
        habits.forEach(h => {
            const { longest } = calculateStreak(logs[h.id] || {});
            if (longest > maxStreak) maxStreak = longest;
        });

        // Perfect days: days where ALL habits are completed
        const dayCounts: { [date: string]: number } = {};
        const dayTotals: { [date: string]: number } = {};
        habits.forEach(h => {
            Object.entries(logs[h.id] || {}).forEach(([date, status]) => {
                dayTotals[date] = (dayTotals[date] || 0) + 1;
                if (status === 'completed') dayCounts[date] = (dayCounts[date] || 0) + 1;
            });
        });
        Object.keys(dayTotals).forEach(date => {
            if (habits.length > 0 && dayCounts[date] === habits.length) perfectDays++;
        });

        return { habits, logs, totalCompleted, maxStreak, perfectDays };
    }, [habits, logs]);

    const categories = ['racha', 'constancia', 'volumen', 'especial'] as const;
    const unlockedCount = ACHIEVEMENTS.filter(a => a.condition(data)).length;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-surface border border-slate-700 rounded-3xl shadow-strong flex flex-col max-h-[88vh] animate-in slide-in-from-bottom-8 duration-400">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500/20 via-primary/10 to-transparent border-b border-slate-700 rounded-t-3xl shrink-0 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-xl">🏆</div>
                            <div>
                                <h2 className="text-lg font-serif font-bold text-white">Logros</h2>
                                <p className="text-xs text-primary">{unlockedCount}/{ACHIEVEMENTS.length} desbloqueados</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                            <X size={18} />
                        </button>
                    </div>
                    {/* Overall progress bar */}
                    <div className="mt-3 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-700"
                            style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    {categories.map(cat => {
                        const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
                        return (
                            <div key={cat}>
                                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">{CATEGORY_LABELS[cat]}</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {catAchievements.map(a => {
                                        const unlocked = a.condition(data);
                                        const prog = a.progress?.(data);
                                        const pct = prog ? Math.round((prog.current / prog.max) * 100) : (unlocked ? 100 : 0);

                                        return (
                                            <div key={a.id} className={clsx(
                                                "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                                                unlocked
                                                    ? `bg-gradient-to-r ${CATEGORY_COLORS[cat]} `
                                                    : "bg-slate-800/40 border-slate-800 opacity-60 grayscale"
                                            )}>
                                                {/* Icon */}
                                                <div className={clsx(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0",
                                                    unlocked ? "bg-black/20" : "bg-slate-800"
                                                )}>
                                                    {unlocked ? a.icon : <Lock size={16} className="text-slate-600" />}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <p className={clsx("text-sm font-semibold", unlocked ? "text-white" : "text-slate-500")}>
                                                            {a.title}
                                                        </p>
                                                        {unlocked && <span className="text-[10px] text-success font-bold">✓ Logrado</span>}
                                                    </div>
                                                    <p className="text-[11px] text-muted mb-1">{a.description}</p>
                                                    {prog && !unlocked && (
                                                        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-slate-500 rounded-full"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                    {prog && !unlocked && (
                                                        <p className="text-[10px] text-muted mt-0.5">{prog.current} / {prog.max}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 shrink-0">
                    <button onClick={onClose} className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-soft transition-colors">
                        ¡Seguir ganando! 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AchievementsModal;
