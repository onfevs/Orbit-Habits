import { Habit } from "./types";

export const MOTIVATIONAL_QUOTES = [
  "La disciplina es el puente entre metas y logros.",
  "No cuentes los días, haz que los días cuenten.",
  "La excelencia no es un acto, es un hábito.",
  "Pequeños pasos cada día suman grandes resultados.",
  "El secreto de tu futuro está escondido en tu rutina diaria.",
  "No te detengas hasta que estés orgulloso.",
  "Cree que puedes y ya estarás a medio camino.",
];

// Updated to match the "Earth & Gold" aesthetic with Vibrant Green
export const HABIT_COLORS = [
  '#c9a24d', // Gold
  '#10b981', // Vibrant Emerald
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#84cc16', // Lime
];

export const CHART_THEME = {
  gold: "#C9A24D",
  goldSoft: "#E1C878",
  success: "#10b981", // Updated to vibrant green
  successDark: "#047857",
  danger: "#ef4444",
  dangerDark: "#991b1b",
  text: "#f3f4f6",
  grid: "rgba(255,255,255,0.08)"
};

export const AVAILABLE_ICONS = [
  'Activity',
  'Book',
  'Briefcase',
  'Coffee',
  'Droplets',
  'Dumbbell',
  'Heart',
  'Moon',
  'Music',
  'Sun',
  'Zap',
  'Utensils',
  'Footprints', // For Dog
  'Globe',      // For Languages
  'Shield',     // For No Fap
  'Snowflake',  // For Cold Shower
  'Brain',      // For Meditation
];

// Migrated Habits from User Request
export const INITIAL_HABITS: Habit[] = [
  { id: 'h1', name: 'Sacar al Perro', color: '#f59e0b', icon: 'Footprints', createdAt: new Date().toISOString(), goalDaysPerWeek: 7 },
  { id: 'h2', name: 'Leer 30 min', color: '#8b5cf6', icon: 'Book', createdAt: new Date().toISOString(), goalDaysPerWeek: 7 },
  { id: 'h3', name: 'Meditar 10 min', color: '#3b82f6', icon: 'Brain', createdAt: new Date().toISOString(), goalDaysPerWeek: 7 },
  { id: 'h4', name: 'Nadar 1 hr', color: '#06b6d4', icon: 'Droplets', createdAt: new Date().toISOString(), goalDaysPerWeek: 4 }, 
  { id: 'h5', name: 'NO FAP', color: '#ef4444', icon: 'Shield', createdAt: new Date().toISOString(), goalDaysPerWeek: 7 },
  { id: 'h6', name: 'Flexiones 100', color: '#c9a24d', icon: 'Dumbbell', createdAt: new Date().toISOString(), goalDaysPerWeek: 6 },
  { id: 'h7', name: 'Ducha Fria', color: '#10b981', icon: 'Snowflake', createdAt: new Date().toISOString(), goalDaysPerWeek: 7 },
  { id: 'h8', name: 'Idiomas', color: '#ec4899', icon: 'Globe', createdAt: new Date().toISOString(), goalDaysPerWeek: 5 },
  { id: 'h9', name: 'Proyecto 1 h', color: '#6366f1', icon: 'Briefcase', createdAt: new Date().toISOString(), goalDaysPerWeek: 5 },
  { id: 'h10', name: 'Seguimiento', color: '#84cc16', icon: 'Activity', createdAt: new Date().toISOString(), goalDaysPerWeek: 7 },
];

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];