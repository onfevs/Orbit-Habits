import React, { useMemo } from 'react';
import { Habit, DailyLog } from '../types';
import { calculateStreak } from '../utils';
import { X, Lock } from 'lucide-react';
import clsx from 'clsx';

interface AchievementData {
    habits: Habit[];
    logs: { [id: string]: DailyLog };
    totalCompleted: number;
    maxStreak: number;
    perfectDays: number;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'racha' | 'constancia' | 'volumen' | 'especial';
    condition: (data: AchievementData) => boolean;
    progress?: (data: AchievementData) => { current: number; max: number };
}

const ACHIEVEMENTS: Achievement[] = [
    // ── Rachas ────────────────────────────────────────────────────────────────
    {
        id: 'streak_3', title: 'Primera Llama', description: 'Racha de 3 días consecutivos', icon: '🔥', category: 'racha',
        condition: (d) => d.maxStreak >= 3, progress: (d) => ({ current: Math.min(d.maxStreak, 3), max: 3 })
    },
    {
        id: 'streak_7', title: 'Semana de Fuego', description: 'Racha de 7 días consecutivos', icon: '🌟', category: 'racha',
        condition: (d) => d.maxStreak >= 7, progress: (d) => ({ current: Math.min(d.maxStreak, 7), max: 7 })
    },
    {
        id: 'streak_14', title: 'Dos Semanas', description: 'Racha de 14 días consecutivos', icon: '⚡', category: 'racha',
        condition: (d) => d.maxStreak >= 14, progress: (d) => ({ current: Math.min(d.maxStreak, 14), max: 14 })
    },
    {
        id: 'streak_21', title: 'Hábito Formado', description: '21 días: el hábito ya es parte de ti', icon: '💪', category: 'racha',
        condition: (d) => d.maxStreak >= 21, progress: (d) => ({ current: Math.min(d.maxStreak, 21), max: 21 })
    },
    {
        id: 'streak_30', title: 'Imparable', description: 'Racha de 30 días consecutivos', icon: '🏆', category: 'racha',
        condition: (d) => d.maxStreak >= 30, progress: (d) => ({ current: Math.min(d.maxStreak, 30), max: 30 })
    },
    {
        id: 'streak_50', title: 'Cincuentón', description: 'Racha de 50 días consecutivos', icon: '🦅', category: 'racha',
        condition: (d) => d.maxStreak >= 50, progress: (d) => ({ current: Math.min(d.maxStreak, 50), max: 50 })
    },
    {
        id: 'streak_100', title: 'Centurión', description: 'Racha de 100 días consecutivos', icon: '👑', category: 'racha',
        condition: (d) => d.maxStreak >= 100, progress: (d) => ({ current: Math.min(d.maxStreak, 100), max: 100 })
    },
    {
        id: 'streak_180', title: 'Medio Año de Fuego', description: 'Racha de 180 días consecutivos', icon: '🌍', category: 'racha',
        condition: (d) => d.maxStreak >= 180, progress: (d) => ({ current: Math.min(d.maxStreak, 180), max: 180 })
    },
    {
        id: 'streak_365', title: 'Leyenda Absoluta', description: '365 días de racha. Eres un mito.', icon: '🔱', category: 'racha',
        condition: (d) => d.maxStreak >= 365, progress: (d) => ({ current: Math.min(d.maxStreak, 365), max: 365 })
    },

    // ── Constancia (días perfectos) ───────────────────────────────────────────
    {
        id: 'perf_1', title: 'Primer Paso', description: 'Primer día con todos los hábitos completos', icon: '✅', category: 'constancia',
        condition: (d) => d.perfectDays >= 1, progress: (d) => ({ current: Math.min(d.perfectDays, 1), max: 1 })
    },
    {
        id: 'perf_3', title: 'Tríada Perfecta', description: '3 días perfectos acumulados', icon: '💎', category: 'constancia',
        condition: (d) => d.perfectDays >= 3, progress: (d) => ({ current: Math.min(d.perfectDays, 3), max: 3 })
    },
    {
        id: 'perf_7', title: 'Semana Perfecta', description: '7 días perfectos acumulados', icon: '🌈', category: 'constancia',
        condition: (d) => d.perfectDays >= 7, progress: (d) => ({ current: Math.min(d.perfectDays, 7), max: 7 })
    },
    {
        id: 'perf_14', title: 'Fortaleza', description: '14 días perfectos acumulados', icon: '🏰', category: 'constancia',
        condition: (d) => d.perfectDays >= 14, progress: (d) => ({ current: Math.min(d.perfectDays, 14), max: 14 })
    },
    {
        id: 'perf_21', title: 'Maestro Constante', description: '21 días perfectos acumulados', icon: '🎯', category: 'constancia',
        condition: (d) => d.perfectDays >= 21, progress: (d) => ({ current: Math.min(d.perfectDays, 21), max: 21 })
    },
    {
        id: 'perf_30', title: 'Mes Imparable', description: '30 días perfectos acumulados', icon: '🥇', category: 'constancia',
        condition: (d) => d.perfectDays >= 30, progress: (d) => ({ current: Math.min(d.perfectDays, 30), max: 30 })
    },
    {
        id: 'perf_60', title: 'Dos Meses Perfectos', description: '60 días perfectos acumulados', icon: '🏅', category: 'constancia',
        condition: (d) => d.perfectDays >= 60, progress: (d) => ({ current: Math.min(d.perfectDays, 60), max: 60 })
    },
    {
        id: 'perf_90', title: 'Trimestre de Élite', description: '90 días perfectos acumulados', icon: '🌠', category: 'constancia',
        condition: (d) => d.perfectDays >= 90, progress: (d) => ({ current: Math.min(d.perfectDays, 90), max: 90 })
    },

    // ── Volumen ───────────────────────────────────────────────────────────────
    {
        id: 'vol_1', title: 'El Comienzo', description: 'Completa tu primer hábito', icon: '👶', category: 'volumen',
        condition: (d) => d.totalCompleted >= 1, progress: (d) => ({ current: Math.min(d.totalCompleted, 1), max: 1 })
    },
    {
        id: 'vol_5', title: 'Calentando Motores', description: 'Completa 5 hábitos en total', icon: '🔧', category: 'volumen',
        condition: (d) => d.totalCompleted >= 5, progress: (d) => ({ current: Math.min(d.totalCompleted, 5), max: 5 })
    },
    {
        id: 'vol_10', title: 'Primer Sprint', description: 'Completa 10 hábitos en total', icon: '⚡', category: 'volumen',
        condition: (d) => d.totalCompleted >= 10, progress: (d) => ({ current: Math.min(d.totalCompleted, 10), max: 10 })
    },
    {
        id: 'vol_25', title: 'En Ritmo', description: 'Completa 25 hábitos en total', icon: '🎵', category: 'volumen',
        condition: (d) => d.totalCompleted >= 25, progress: (d) => ({ current: Math.min(d.totalCompleted, 25), max: 25 })
    },
    {
        id: 'vol_50', title: 'Constante', description: 'Completa 50 hábitos en total', icon: '💯', category: 'volumen',
        condition: (d) => d.totalCompleted >= 50, progress: (d) => ({ current: Math.min(d.totalCompleted, 50), max: 50 })
    },
    {
        id: 'vol_100', title: 'Triple Dígito', description: 'Completa 100 hábitos en total', icon: '🚀', category: 'volumen',
        condition: (d) => d.totalCompleted >= 100, progress: (d) => ({ current: Math.min(d.totalCompleted, 100), max: 100 })
    },
    {
        id: 'vol_250', title: 'Cuarto de Millar', description: 'Completa 250 hábitos en total', icon: '🎖️', category: 'volumen',
        condition: (d) => d.totalCompleted >= 250, progress: (d) => ({ current: Math.min(d.totalCompleted, 250), max: 250 })
    },
    {
        id: 'vol_500', title: 'Máquina de Hábitos', description: 'Completa 500 hábitos en total', icon: '🤖', category: 'volumen',
        condition: (d) => d.totalCompleted >= 500, progress: (d) => ({ current: Math.min(d.totalCompleted, 500), max: 500 })
    },
    {
        id: 'vol_1000', title: 'El Millar', description: 'Completa 1,000 hábitos en total', icon: '💥', category: 'volumen',
        condition: (d) => d.totalCompleted >= 1000, progress: (d) => ({ current: Math.min(d.totalCompleted, 1000), max: 1000 })
    },
    {
        id: 'vol_2000', title: 'Élite', description: 'Completa 2,000 hábitos en total', icon: '🏅', category: 'volumen',
        condition: (d) => d.totalCompleted >= 2000, progress: (d) => ({ current: Math.min(d.totalCompleted, 2000), max: 2000 })
    },
    {
        id: 'vol_5000', title: 'Transcendente', description: 'Completa 5,000 hábitos en total', icon: '🔱', category: 'volumen',
        condition: (d) => d.totalCompleted >= 5000, progress: (d) => ({ current: Math.min(d.totalCompleted, 5000), max: 5000 })
    },

    // ── Especiales ────────────────────────────────────────────────────────────
    {
        id: 'hab_1', title: 'Explorador', description: 'Crea tu primer hábito', icon: '🗺️', category: 'especial',
        condition: (d) => d.habits.length >= 1, progress: (d) => ({ current: Math.min(d.habits.length, 1), max: 1 })
    },
    {
        id: 'hab_3', title: 'Trifuerza', description: 'Crea 3 hábitos personalizados', icon: '🔺', category: 'especial',
        condition: (d) => d.habits.length >= 3, progress: (d) => ({ current: Math.min(d.habits.length, 3), max: 3 })
    },
    {
        id: 'hab_5', title: 'Coleccionista', description: 'Crea 5 hábitos personalizados', icon: '📚', category: 'especial',
        condition: (d) => d.habits.length >= 5, progress: (d) => ({ current: Math.min(d.habits.length, 5), max: 5 })
    },
    {
        id: 'hab_8', title: 'Rutinario Pro', description: 'Crea 8 hábitos personalizados', icon: '⚙️', category: 'especial',
        condition: (d) => d.habits.length >= 8, progress: (d) => ({ current: Math.min(d.habits.length, 8), max: 8 })
    },
    {
        id: 'hab_10', title: 'Multitasker', description: 'Crea 10 hábitos personalizados', icon: '🎪', category: 'especial',
        condition: (d) => d.habits.length >= 10, progress: (d) => ({ current: Math.min(d.habits.length, 10), max: 10 })
    },
    {
        id: 'combo_7_50', title: 'Racha + Volumen', description: 'Racha ≥7 días Y ≥50 hábitos completados', icon: '🎯', category: 'especial',
        condition: (d) => d.maxStreak >= 7 && d.totalCompleted >= 50
    },
    {
        id: 'combo_30_5', title: 'Mes de Poder', description: 'Racha ≥30 días Y ≥5 días perfectos', icon: '⚡', category: 'especial',
        condition: (d) => d.maxStreak >= 30 && d.perfectDays >= 5
    },
    {
        id: 'combo_elite', title: 'Combo de Élite', description: 'Racha ≥30 días Y ≥500 hábitos completados', icon: '🦁', category: 'especial',
        condition: (d) => d.maxStreak >= 30 && d.totalCompleted >= 500
    },
    {
        id: 'hat_trick', title: 'Hat Trick', description: '3 días perfectos + racha ≥3 días', icon: '🎩', category: 'especial',
        condition: (d) => d.perfectDays >= 3 && d.maxStreak >= 3
    },
    {
        id: 'cent_perf', title: 'Perfección Centenaria', description: '100 hábitos + al menos 10 días perfectos', icon: '🏛️', category: 'especial',
        condition: (d) => d.totalCompleted >= 100 && d.perfectDays >= 10
    },
    {
        id: 'big_league', title: 'Grandes Ligas', description: 'Racha ≥50 días + 250 hábitos completados', icon: '🏟️', category: 'especial',
        condition: (d) => d.maxStreak >= 50 && d.totalCompleted >= 250
    },
    {
        id: 'unstop', title: 'Verdaderamente Imparable', description: 'Racha ≥100 días + 50 días perfectos', icon: '👹', category: 'especial',
        condition: (d) => d.maxStreak >= 100 && d.perfectDays >= 50
    },
    {
        id: 'legend_all', title: 'El Olimpo', description: 'Racha ≥365 días + 1000 hábitos completados', icon: '⛩️', category: 'especial',
        condition: (d) => d.maxStreak >= 365 && d.totalCompleted >= 1000
    },
    {
        id: 'comeback', title: 'El Gran Regreso', description: 'Vuelves con fuerza. Sigues en pie.', icon: '🔄', category: 'especial',
        condition: (d) => d.totalCompleted >= 5 && d.maxStreak >= 1
    },
    {
        id: 'iron_will', title: 'Voluntad de Hierro', description: '21 días de racha + 21 días perfectos', icon: '🪨', category: 'especial',
        condition: (d) => d.maxStreak >= 21 && d.perfectDays >= 21
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
    const data = useMemo<AchievementData>(() => {
        let totalCompleted = 0;
        let maxStreak = 0;
        let perfectDays = 0;

        Object.values(logs).forEach(log => {
            Object.values(log).forEach(s => { if (s === 'completed') totalCompleted++; });
        });

        habits.forEach(h => {
            const { longest } = calculateStreak(logs[h.id] || {});
            if (longest > maxStreak) maxStreak = longest;
        });

        // Perfect days: ALL habits completed that day
        const dayCounts: Record<string, number> = {};
        habits.forEach(h => {
            Object.entries(logs[h.id] || {}).forEach(([date, status]) => {
                if (status === 'completed') dayCounts[date] = (dayCounts[date] || 0) + 1;
            });
        });
        Object.values(dayCounts).forEach(count => {
            if (habits.length > 0 && count >= habits.length) perfectDays++;
        });

        return { habits, logs, totalCompleted, maxStreak, perfectDays };
    }, [habits, logs]);

    const categories = ['racha', 'constancia', 'volumen', 'especial'] as const;
    const unlockedCount = ACHIEVEMENTS.filter(a => a.condition(data)).length;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-surface border border-slate-700 rounded-3xl shadow-strong flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-400">

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
                    <div className="mt-3 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-700"
                            style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
                        />
                    </div>
                    {/* Stats row */}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-black/20 rounded-xl py-1.5">
                            <p className="text-base font-black text-orange-400">{data.maxStreak}</p>
                            <p className="text-[10px] text-muted">Racha máx.</p>
                        </div>
                        <div className="bg-black/20 rounded-xl py-1.5">
                            <p className="text-base font-black text-primary">{data.totalCompleted}</p>
                            <p className="text-[10px] text-muted">Completados</p>
                        </div>
                        <div className="bg-black/20 rounded-xl py-1.5">
                            <p className="text-base font-black text-success">{data.perfectDays}</p>
                            <p className="text-[10px] text-muted">Días perfectos</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    {categories.map(cat => {
                        const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
                        const catUnlocked = catAchievements.filter(a => a.condition(data)).length;
                        return (
                            <div key={cat}>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold text-muted uppercase tracking-wider">{CATEGORY_LABELS[cat]}</p>
                                    <span className="text-[10px] text-muted">{catUnlocked}/{catAchievements.length}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {catAchievements.map(a => {
                                        const unlocked = a.condition(data);
                                        const prog = a.progress?.(data);
                                        const pct = prog ? Math.round((prog.current / prog.max) * 100) : (unlocked ? 100 : 0);

                                        return (
                                            <div key={a.id} className={clsx(
                                                "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                                                unlocked
                                                    ? `bg-gradient-to-r ${CATEGORY_COLORS[cat]}`
                                                    : "bg-slate-800/40 border-slate-800 opacity-55 grayscale"
                                            )}>
                                                <div className={clsx(
                                                    "w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0",
                                                    unlocked ? "bg-black/20" : "bg-slate-800"
                                                )}>
                                                    {unlocked ? a.icon : <Lock size={14} className="text-slate-600" />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <p className={clsx("text-sm font-semibold", unlocked ? "text-white" : "text-slate-500")}>
                                                            {a.title}
                                                        </p>
                                                        {unlocked && <span className="text-[10px] text-success font-bold shrink-0">✓ Logrado</span>}
                                                    </div>
                                                    <p className="text-[11px] text-muted">{a.description}</p>
                                                    {prog && !unlocked && (
                                                        <>
                                                            <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
                                                                <div className="h-full bg-slate-500 rounded-full" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <p className="text-[10px] text-muted mt-0.5">{prog.current} / {prog.max}</p>
                                                        </>
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
