import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Habit } from '../types';
import { generateId } from '../utils';
import { HABIT_COLORS, AVAILABLE_ICONS } from '../constants';
import { Plus, Trash2, Edit2, GripVertical, 
  Activity, Book, Briefcase, Coffee, Droplets, 
  Dumbbell, Heart, Moon, Music, Sun, Zap, Utensils,
  Footprints, Globe, Shield, Snowflake, Brain,
  Check, AlertTriangle, Info
} from 'lucide-react';
import clsx from 'clsx';
import gsap from 'gsap';

const IconMap: { [key: string]: React.ElementType } = {
  Activity, Book, Briefcase, Coffee, Droplets, 
  Dumbbell, Heart, Moon, Music, Sun, Zap, Utensils,
  Footprints, Globe, Shield, Snowflake, Brain
};

interface HabitManagerProps {
  habits: Habit[];
  onAdd: (h: Habit) => void;
  onUpdate: (h: Habit) => void;
  onDelete: (id: string) => void;
  onReorder?: (start: number, end: number) => void;
}

const HabitManager: React.FC<HabitManagerProps> = ({ habits, onAdd, onUpdate, onDelete, onReorder }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New States for requested features
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  
  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [icon, setIcon] = useState(AVAILABLE_ICONS[0]);
  const [goalDays, setGoalDays] = useState(7);

  // Refs for animations
  const listRef = useRef<HTMLDivElement>(null);
  const successToastRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  // Track previous habit count to determine if we should animate entrance (on Add) or skip (on Delete)
  const prevHabitsCount = useRef(habits.length);

  // Entrance Animation for List
  useLayoutEffect(() => {
    if (!listRef.current) return;
    
    // Only animate if:
    // 1. First load (habits exist but prev was 0? No, this effect runs after update)
    // 2. We are adding items (current > prev)
    // 3. We are toggling editing mode off (isAdding changed)
    // If deleting (current < prev), DO NOT run entrance animation, let React just remove the DOM node.
    
    const shouldAnimate = habits.length > prevHabitsCount.current || !prevHabitsCount.current;
    // Note: If just switching view to 'Habits', React mounts the component, prevHabitsCount init is habits.length.
    // So we might need a separate 'mounted' check or just animate on mount always.
    
    // Let's rely on GSAP context cleanup. On mount it runs.
    
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('.habit-item');
      if (items.length === 0) return;

      // If we are deleting, items length decreased. We don't want to re-stagger them.
      // However, on initial mount of the component, we want to stagger.
      // This is tricky because React unmounts/remounts components when switching tabs in App.tsx.
      // So on tab switch, prevHabitsCount.current is re-initialized.
      // We will simply check if the items are already visible or opacity 0. 
      // But we forced opacity-0 in CSS/className logic.
      
      // Adjusted logic:
      // If deleting, React removes the node. The remaining nodes should stay.
      // We only run the "entrance" if we added a node or if it's the initial list render.
      // Since we don't have persistent state across tabs for `prevCount` in this functional component instance,
      // we assume if habits.length < prev (in the same instance), it's a delete.
      
      if (habits.length < prevHabitsCount.current) {
          // It's a delete operation in this session. Do nothing, let React remove the node.
          // We must ensure visible items are set to visible just in case.
          gsap.set(items, { autoAlpha: 1, y: 0 });
      } else {
          // Initial mount or Add
          gsap.set(items, { autoAlpha: 0, y: 30 });
          gsap.to(items, {
            duration: 0.5,
            autoAlpha: 1,
            y: 0,
            stagger: 0.08,
            ease: "power2.out",
            onComplete: () => {
               if (items[0]) {
                  gsap.to(items[0], { 
                      y: -6, 
                      duration: 0.2, 
                      yoyo: true, 
                      repeat: 1, 
                      ease: "power1.inOut"
                  });
               }
            }
          });
      }

    }, listRef);
    
    prevHabitsCount.current = habits.length;

    return () => ctx.revert();
  }, [habits.length, isAdding]);

  // Success Toast Animation
  useEffect(() => {
    if (showSaveSuccess && successToastRef.current) {
        const tl = gsap.timeline();
        tl.fromTo(successToastRef.current, 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        ).to(successToastRef.current, 
            { y: 50, opacity: 0, duration: 0.5, ease: "power2.in", delay: 2, onComplete: () => setShowSaveSuccess(false) }
        );
    }
  }, [showSaveSuccess]);

  // Delete Modal Animation
  useEffect(() => {
    if (deleteCandidateId && deleteModalRef.current) {
        gsap.fromTo(deleteModalRef.current,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.2)" }
        );
    }
  }, [deleteCandidateId]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setColor(HABIT_COLORS[0]);
    setIcon(AVAILABLE_ICONS[0]);
    setGoalDays(7);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingId) {
      const old = habits.find(h => h.id === editingId);
      if (old) {
        onUpdate({ 
          ...old, 
          name, 
          description, 
          color, 
          icon, 
          goalDaysPerWeek: goalDays 
        });
      }
    } else {
      onAdd({
        id: generateId(),
        name,
        description,
        color,
        icon,
        goalDaysPerWeek: goalDays,
        createdAt: new Date().toISOString()
      });
    }
    resetForm();
    setShowSaveSuccess(true); // Trigger Toast
  };

  const startEdit = (h: Habit) => {
    setName(h.name);
    setDescription(h.description || '');
    setColor(h.color);
    setIcon(h.icon || AVAILABLE_ICONS[0]);
    setGoalDays(h.goalDaysPerWeek || 7);
    setEditingId(h.id);
    setIsAdding(true);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteCandidateId(id);
  };

  const confirmDelete = () => {
    if (deleteCandidateId) {
        onDelete(deleteCandidateId);
        setDeleteCandidateId(null);
    }
  };

  // DnD Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index && onReorder) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-20 relative">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-serif font-bold text-white tracking-wide">Mis Hábitos</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> Nuevo Hábito
          </button>
        )}
      </div>

      {/* Editor Form */}
      {isAdding && (
        <div className="bg-surface border border-slate-700 p-6 rounded-2xl mb-8 shadow-xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-serif font-semibold text-white mb-4">{editingId ? 'Editar Hábito' : 'Crear Nuevo Hábito'}</h3>
          
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-slate-400 text-sm mb-1 font-medium">Nombre</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Ej. Meditar"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-400 text-sm mb-1 font-medium">Descripción (Opcional)</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Ej. 10 minutos al despertar"
              />
            </div>

            {/* Goal Days */}
            <div>
              <label className="block text-slate-400 text-sm mb-1 font-medium">Meta Semanal: {goalDays} días</label>
              <input 
                type="range" 
                min="1" 
                max="7" 
                value={goalDays}
                onChange={(e) => setGoalDays(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1</span><span>7</span>
              </div>
            </div>

            {/* Icons */}
            <div>
              <label className="block text-slate-400 text-sm mb-2 font-medium">Icono</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map(iconName => {
                  const IconComp = IconMap[iconName] || Activity;
                  return (
                    <button
                      key={iconName}
                      onClick={() => setIcon(iconName)}
                      className={clsx(
                        "p-2 rounded-lg border transition-all",
                        icon === iconName ? "bg-primary/20 border-primary text-primary" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                      )}
                    >
                      <IconComp size={20} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-slate-400 text-sm mb-2 font-medium">Color</label>
              <div className="flex flex-wrap gap-3">
                {HABIT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={clsx(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      color === c ? "border-white scale-110 shadow-md" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={resetForm}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={!name.trim()}
                className="bg-primary hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold transition-colors shadow-md"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit List */}
      <div ref={listRef} className="space-y-3">
        {habits.map((habit, index) => {
           const IconComp = (habit.icon && IconMap[habit.icon]) ? IconMap[habit.icon] : Activity;
           const isDragged = draggedIndex === index;
           const isDragOver = dragOverIndex === index;

           return (
            <div 
              key={habit.id} 
              draggable={!isAdding}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              // Removed initial opacity-0 class here so items are visible by default, 
              // GSAP set() in useLayoutEffect handles the 'entrance' state if needed.
              className={clsx(
                "habit-item group bg-surface border rounded-xl flex items-center justify-between transition-all duration-100", 
                isDragged ? "opacity-50 scale-95 border-dashed border-primary" : "hover:bg-slate-800 border-slate-700/50 shadow-sm",
                isDragOver ? "border-primary border-2 scale-105 z-10" : "",
                !isAdding && "cursor-grab active:cursor-grabbing",
                "p-4"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity -ml-2 cursor-grab">
                   <GripVertical size={20} />
                </div>

                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400">
                    <IconComp size={20} style={{ color: habit.color }} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg text-slate-200 font-medium">{habit.name}</h3>
                        
                        {/* Description Tooltip */}
                        {habit.description && (
                            <div className="relative group/info">
                                <Info size={16} className="text-slate-500 hover:text-primary cursor-help transition-colors" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-black/90 text-xs text-white rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                                    {habit.description}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{habit.goalDaysPerWeek} días/sem</span>
                    </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => startEdit(habit)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteRequest(habit.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
           );
        })}
        
        {habits.length === 0 && !isAdding && (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl font-serif italic">
            No hay hábitos configurados.
          </div>
        )}
      </div>

      {/* Success Toast */}
      {showSaveSuccess && (
          <div 
             ref={successToastRef}
             className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-surface border border-success/30 text-success px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50"
          >
              <Check size={18} />
              <span className="font-bold">¡Hábito guardado!</span>
          </div>
      )}

      {/* Custom Delete Modal */}
      {deleteCandidateId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div ref={deleteModalRef} className="bg-surface border border-slate-700 p-6 rounded-2xl shadow-strong max-w-sm w-full">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-white mb-2">¿Eliminar Hábito?</h3>
                      <p className="text-sm text-muted">
                          Esta acción no se puede deshacer. Se perderá todo el historial de este hábito.
                      </p>
                  </div>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setDeleteCandidateId(null)}
                          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="flex-1 py-3 bg-danger hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-danger/20"
                      >
                          Eliminar
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default HabitManager;