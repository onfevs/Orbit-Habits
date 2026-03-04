import React, { useState } from 'react';
import { Habit } from '../types';
import { X, Plus, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { HABIT_COLORS } from '../constants';

interface HabitPack {
    id: string;
    name: string;
    emoji: string;
    description: string;
    color: string;
    habits: Omit<Habit, 'id' | 'createdAt'>[];
}

const HABIT_PACKS: HabitPack[] = [
    {
        id: 'salud',
        name: 'Salud & Energía',
        emoji: '💪',
        description: 'Hábitos core para cuerpo y mente',
        color: '#10b981',
        habits: [
            { name: 'Ejercicio 30 min', color: '#10b981', icon: 'Dumbbell', goalDaysPerWeek: 5 },
            { name: 'Ducha Fría', color: '#06b6d4', icon: 'Snowflake', goalDaysPerWeek: 7 },
            { name: 'Dormir 8 horas', color: '#8b5cf6', icon: 'Moon', goalDaysPerWeek: 7 },
            { name: 'Tomar vitaminas', color: '#f59e0b', icon: 'Sun', goalDaysPerWeek: 7 },
        ]
    },
    {
        id: 'mente',
        name: 'Bienestar Mental',
        emoji: '🧘',
        description: 'Calma, foco y claridad mental',
        color: '#8b5cf6',
        habits: [
            { name: 'Meditar 10 min', color: '#8b5cf6', icon: 'Brain', goalDaysPerWeek: 7 },
            { name: 'Journaling', color: '#ec4899', icon: 'Book', goalDaysPerWeek: 5 },
            { name: 'Sin redes sociales', color: '#ef4444', icon: 'Shield', goalDaysPerWeek: 7 },
            { name: 'Gratitud × 3', color: '#c9a24d', icon: 'Heart', goalDaysPerWeek: 7 },
        ]
    },
    {
        id: 'productividad',
        name: 'Productividad',
        emoji: '🚀',
        description: 'Maximiza tu rendimiento diario',
        color: '#3b82f6',
        habits: [
            { name: 'Deep work 2h', color: '#3b82f6', icon: 'Zap', goalDaysPerWeek: 5 },
            { name: 'Leer 20 min', color: '#6366f1', icon: 'Book', goalDaysPerWeek: 7 },
            { name: 'Revisar tareas', color: '#c9a24d', icon: 'Activity', goalDaysPerWeek: 7 },
            { name: 'Sin procrastinar', color: '#f59e0b', icon: 'Briefcase', goalDaysPerWeek: 5 },
        ]
    },
    {
        id: 'atleta',
        name: 'Atleta de Alto Nivel',
        emoji: '🏆',
        description: 'Pack para deportistas serios',
        color: '#f97316',
        habits: [
            { name: 'Entrenamiento', color: '#f97316', icon: 'Dumbbell', goalDaysPerWeek: 6 },
            { name: 'Nadar / Cardio', color: '#06b6d4', icon: 'Droplets', goalDaysPerWeek: 4 },
            { name: 'Estiramientos', color: '#10b981', icon: 'Activity', goalDaysPerWeek: 7 },
            { name: 'Proteína goal', color: '#c9a24d', icon: 'Utensils', goalDaysPerWeek: 7 },
        ]
    },
];

interface HabitPacksModalProps {
    existingHabits: Habit[];
    onAddHabits: (habits: Habit[]) => void;
    onClose: () => void;
}

const HabitPacksModal: React.FC<HabitPacksModalProps> = ({ existingHabits, onAddHabits, onClose }) => {
    const [added, setAdded] = useState<Set<string>>(new Set());

    const handleAddPack = (pack: HabitPack) => {
        if (added.has(pack.id)) return;

        const newHabits: Habit[] = pack.habits.map((h, i) => ({
            ...h,
            id: `pack_${pack.id}_${Date.now()}_${i}`,
            createdAt: new Date().toISOString(),
        }));

        onAddHabits(newHabits);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        setAdded(prev => new Set([...prev, pack.id]));
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-surface border border-slate-700 rounded-3xl shadow-strong flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-400">

                {/* Header */}
                <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-slate-700 rounded-t-3xl p-5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-xl">📦</div>
                            <div>
                                <h2 className="text-lg font-serif font-bold text-white">Packs de Hábitos</h2>
                                <p className="text-xs text-muted">Añade grupos preconfigurados de un tap</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Packs */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                    {HABIT_PACKS.map(pack => {
                        const isAdded = added.has(pack.id);
                        return (
                            <div key={pack.id} className="bg-background border border-slate-800 rounded-2xl overflow-hidden">
                                {/* Pack header */}
                                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{pack.emoji}</span>
                                        <div>
                                            <p className="font-serif font-bold text-white">{pack.name}</p>
                                            <p className="text-xs text-muted">{pack.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddPack(pack)}
                                        className={clsx(
                                            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                                            isAdded
                                                ? "bg-success/20 border border-success/30 text-success cursor-default"
                                                : "bg-primary text-black hover:bg-primary-soft active:scale-95"
                                        )}
                                    >
                                        {isAdded ? <><CheckCircle2 size={13} /> Añadido</> : <><Plus size={13} /> Añadir</>}
                                    </button>
                                </div>

                                {/* Habits in pack */}
                                <div className="p-3 grid grid-cols-2 gap-2">
                                    {pack.habits.map((h, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-surface px-2.5 py-1.5 rounded-lg border border-slate-700">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                                            <span className="text-[11px] text-slate-300 truncate">{h.name}</span>
                                            <span className="text-[9px] text-muted ml-auto shrink-0">{h.goalDaysPerWeek}d</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-slate-800 shrink-0">
                    <button onClick={onClose} className="w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors">
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HabitPacksModal;
