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

export const ZODIAC_SIGNS = [
  { name: "Capricornio", symbol: "♑", startMonth: 0, startDay: 20, endMonth: 1, endDay: 18 }, // Ene 20 - Feb 18
  { name: "Acuario", symbol: "♒", startMonth: 1, startDay: 19, endMonth: 2, endDay: 20 },      // Feb 19 - Mar 20
  { name: "Piscis", symbol: "♓", startMonth: 2, startDay: 21, endMonth: 3, endDay: 19 },       // Mar 21 - Abr 19
  { name: "Aries", symbol: "♈", startMonth: 3, startDay: 20, endMonth: 4, endDay: 20 },        // Abr 20 - May 20
  { name: "Tauro", symbol: "♉", startMonth: 4, startDay: 21, endMonth: 5, endDay: 20 },        // May 21 - Jun 20
  { name: "Géminis", symbol: "♊", startMonth: 5, startDay: 21, endMonth: 6, endDay: 22 },      // Jun 21 - Jul 22
  { name: "Cáncer", symbol: "♋", startMonth: 6, startDay: 23, endMonth: 7, endDay: 22 },      // Jul 23 - Ago 22
  { name: "Leo", symbol: "♌", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },         // Ago 23 - Sep 22
  { name: "Virgo", symbol: "♍", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },       // Sep 23 - Oct 22
  { name: "Libra", symbol: "♎", startMonth: 9, startDay: 23, endMonth: 10, endDay: 21 },      // Oct 23 - Nov 21
  { name: "Escorpio", symbol: "♏", startMonth: 10, startDay: 22, endMonth: 11, endDay: 21 },    // Nov 22 - Dic 21
  { name: "Sagitario", symbol: "♐", startMonth: 11, startDay: 22, endMonth: 0, endDay: 19 },    // Dic 22 - Ene 19 (wraps around)
];
