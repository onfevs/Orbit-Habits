import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, CheckCircle, RotateCcw } from 'lucide-react';
import { Habit } from '../types';
import clsx from 'clsx';
import gsap from 'gsap';

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onCompleteSession: (habitId: string) => void;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ isOpen, onClose, habits, onCompleteSession }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [duration, setDuration] = useState(25); // Minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsCompleted(true);
      if (selectedHabitId) {
          onCompleteSession(selectedHabitId);
      }
      // Play sound?
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, selectedHabitId, onCompleteSession]);

  // Update Progress Circle
  useEffect(() => {
      if (circleRef.current) {
          const totalSeconds = duration * 60;
          const progress = 1 - (timeLeft / totalSeconds);
          const circumference = 2 * Math.PI * 120; // r=120
          const offset = circumference * (1 - progress);
          
          gsap.to(circleRef.current, {
              strokeDashoffset: offset,
              duration: 1,
              ease: "linear"
          });
      }
  }, [timeLeft, duration]);

  // Entrance
  useEffect(() => {
      if (isOpen && containerRef.current) {
          gsap.fromTo(containerRef.current, 
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
          );
      }
  }, [isOpen]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
      setIsActive(false);
      setTimeLeft(duration * 60);
      setIsCompleted(false);
  };

  const handleDurationChange = (min: number) => {
      setDuration(min);
      setTimeLeft(min * 60);
      setIsActive(false);
      setIsCompleted(false);
  };

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
  };

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div ref={containerRef} className="w-full max-w-md bg-surface border border-slate-700 rounded-3xl p-8 relative shadow-2xl overflow-hidden">
         <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
             <X size={24} />
         </button>

         <h2 className="text-2xl font-serif font-bold text-center mb-6 text-white">Modo Enfoque</h2>

         {!selectedHabitId ? (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                 <p className="text-center text-muted mb-4">Selecciona un hábito para trabajar ahora:</p>
                 <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                     {habits.map(h => (
                         <button 
                            key={h.id}
                            onClick={() => setSelectedHabitId(h.id)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-primary/50 hover:bg-slate-800 transition-all group text-left"
                         >
                             <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{borderColor: h.color, color: h.color}}>
                                 {/* You could render icon here */}
                                 <div className="w-2 h-2 rounded-full" style={{backgroundColor: h.color}} />
                             </div>
                             <span className="font-medium text-slate-200 group-hover:text-white">{h.name}</span>
                         </button>
                     ))}
                 </div>
             </div>
         ) : (
             <div className="flex flex-col items-center">
                 {/* Progress Ring */}
                 <div className="relative w-64 h-64 mb-8">
                     {/* Background Circle */}
                     <svg className="w-full h-full -rotate-90">
                         <circle cx="50%" cy="50%" r="120" className="stroke-slate-800 fill-none" strokeWidth="8" />
                         <circle 
                            ref={circleRef}
                            cx="50%" cy="50%" r="120" 
                            className={clsx(
                                "fill-none transition-colors",
                                isCompleted ? "stroke-success" : "stroke-primary"
                            )}
                            strokeWidth="8" 
                            strokeDasharray={2 * Math.PI * 120}
                            strokeDashoffset={2 * Math.PI * 120}
                            strokeLinecap="round"
                         />
                     </svg>
                     
                     {/* Center Content */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                         {isCompleted ? (
                             <CheckCircle size={64} className="text-success animate-bounce mb-2" />
                         ) : (
                             <span className="text-6xl font-mono font-bold text-white tracking-widest">{formatTime(timeLeft)}</span>
                         )}
                         <span className="text-sm text-primary mt-2 font-medium bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                             {selectedHabit?.name}
                         </span>
                     </div>
                 </div>

                 {/* Controls */}
                 {isCompleted ? (
                     <div className="text-center space-y-4">
                         <p className="text-xl text-white font-bold">¡Sesión Completada!</p>
                         <p className="text-sm text-muted">Se ha registrado tu progreso.</p>
                         <button 
                            onClick={() => { setSelectedHabitId(null); resetTimer(); }}
                            className="bg-slate-800 text-white px-6 py-2 rounded-xl border border-slate-700 hover:bg-slate-700"
                         >
                             Volver
                         </button>
                     </div>
                 ) : (
                     <div className="flex flex-col items-center gap-6 w-full">
                         {/* Duration Selector */}
                         <div className="flex gap-2">
                             {[10, 25, 45].map(m => (
                                 <button
                                    key={m}
                                    onClick={() => handleDurationChange(m)}
                                    className={clsx(
                                        "px-3 py-1 rounded-lg text-xs font-bold border transition-colors",
                                        duration === m ? "bg-primary text-black border-primary" : "bg-transparent text-slate-500 border-slate-700 hover:text-white"
                                    )}
                                 >
                                     {m}m
                                 </button>
                             ))}
                         </div>

                         {/* Play Controls */}
                         <div className="flex items-center gap-6">
                             <button 
                                onClick={toggleTimer}
                                className={clsx(
                                    "w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95",
                                    isActive ? "bg-slate-800 text-red-400 border border-slate-600" : "bg-primary text-black"
                                )}
                             >
                                 {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                             </button>
                             
                             <button 
                                onClick={resetTimer}
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                             >
                                 <RotateCcw size={20} />
                             </button>
                         </div>
                     </div>
                 )}
                 
                 <button onClick={() => setSelectedHabitId(null)} className="mt-8 text-xs text-slate-500 hover:text-white underline">
                     Cambiar Hábito
                 </button>
             </div>
         )}
      </div>
    </div>
  );
};

export default FocusTimer;