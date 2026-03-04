import React, { useEffect, useRef, useState } from 'react';
import { UserLevel } from '../types';
import { Trophy, Star, Info, Crown, Rocket, Zap, Medal, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import clsx from 'clsx';

interface LevelProgressProps {
    userLevel: UserLevel;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ userLevel }) => {
    const barRef = useRef<HTMLDivElement>(null);
    const prevXpRef = useRef(userLevel.xp);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        if (barRef.current) {
            gsap.to(barRef.current, {
                width: `${userLevel.progress}%`,
                duration: 1,
                ease: "power2.out"
            });

            // Pulse effect if XP gained
            if (userLevel.xp > prevXpRef.current) {
                gsap.fromTo(barRef.current,
                    { boxShadow: "0 0 20px #c9a24d" },
                    { boxShadow: "0 0 0px #c9a24d", duration: 1, clearProps: "boxShadow" }
                );
            }
        }
        prevXpRef.current = userLevel.xp;
    }, [userLevel.progress, userLevel.xp]);

    const RANKS = [
        { lvl: "1-4", name: "Cadete", icon: Star, color: "text-slate-400" },
        { lvl: "5-9", name: "Oficial", icon: Medal, color: "text-blue-400" },
        { lvl: "10-19", name: "Capitán", icon: Rocket, color: "text-emerald-400" },
        { lvl: "20-29", name: "Comandante", icon: Zap, color: "text-amber-400" },
        { lvl: "30-49", name: "Almirante", icon: Trophy, color: "text-purple-400" },
        { lvl: "50+", name: "Leyenda Galáctica", icon: Crown, color: "text-pink-500 animate-pulse" },
    ];

    return (
        <div className="w-full max-w-md mx-auto mb-6 px-6 relative z-50">
            <div className="flex items-end justify-between mb-1">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Rango Actual</span>
                    <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-primary" />
                        <span className="font-serif font-bold text-lg text-white">{userLevel.rank}</span>
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            aria-label="Ver sistema de rangos"
                            aria-expanded={showInfo}
                            className="w-11 h-11 flex items-center justify-center rounded-full text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors ml-1 cursor-pointer"
                        >
                            <Info size={16} />
                        </button>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-muted font-mono">Nivel <span className="text-white font-bold">{userLevel.level}</span></span>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
                {/* Animated Fill */}
                <div
                    ref={barRef}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-soft to-primary rounded-full shadow-[0_0_10px_rgba(201,162,77,0.5)]"
                    style={{ width: `${userLevel.progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}></div>
                </div>
            </div>

            <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
                <span>{userLevel.xp} XP</span>
                <span>{userLevel.nextLevelXp} XP</span>
            </div>

            {/* Premium Info Tooltip/Modal */}
            {showInfo && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-[90]" onClick={() => setShowInfo(false)} />
                    <div className="absolute top-full left-0 right-0 mt-4 bg-surface/95 backdrop-blur-xl border border-slate-600 rounded-2xl shadow-strong p-5 z-[100] animate-in fade-in slide-in-from-top-4 origin-top">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                            <Sparkles className="text-primary" size={18} />
                            <h3 className="font-serif font-bold text-white">Sistema de Rangos</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-black/20 rounded-lg p-3 text-xs text-slate-300 flex justify-between items-center">
                                <span>Ganancia por Hábito:</span>
                                <span className="font-bold text-primary">+15 XP</span>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">Escalafón Espacial</p>
                                {RANKS.map((rank) => (
                                    <div
                                        key={rank.name}
                                        className={clsx(
                                            "flex items-center justify-between p-2 rounded-lg border transition-all",
                                            userLevel.rank === rank.name
                                                ? "bg-primary/10 border-primary/50 shadow-gold"
                                                : "bg-slate-800/50 border-transparent opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <rank.icon size={14} className={rank.color} />
                                            <span className={clsx("text-xs font-bold", userLevel.rank === rank.name ? "text-white" : "text-slate-400")}>{rank.name}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-500">Nvl {rank.lvl}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-[10px] text-center text-slate-500 italic pt-2">
                                "La consistencia es el combustible de tu nave."
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default LevelProgress;
