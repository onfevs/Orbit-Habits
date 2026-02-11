import { DailyLog, Habit, UserSettings, UserLevel } from './types';
import { MOTIVATIONAL_QUOTES, WEEK_DAYS, ZODIAC_SIGNS } from './constants';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getMonthDates = (year: number, month: number): Date[] => {
  const days = getDaysInMonth(year, month);
  const dates: Date[] = [];
  for (let i = 1; i <= days; i++) {
    dates.push(new Date(year, month, i));
  }
  return dates;
};

// Check if the weekly goal for a habit is met relative to a specific date
export const isWeeklyGoalMet = (habit: Habit, date: Date, logs: DailyLog, startDayOfWeek: number = 1): boolean => {
    if (!habit.goalDaysPerWeek || habit.goalDaysPerWeek >= 7) return false;

    // Calculate Start of Week for the given date
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Calculate difference to get to the start day
    // If startDayOfWeek is 1 (Monday):
    // Mon(1) - 1 = 0 diff
    // Sun(0) - 1 = -1 -> should be -6 days to get back to prev Monday
    const diff = (day < startDayOfWeek ? day + 7 : day) - startDayOfWeek;
    
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - diff);

    let count = 0;
    // Count completions in this week window (7 days), up to and including the current 'date'
    for(let i=0; i<7; i++) {
        const temp = new Date(startOfWeek);
        temp.setDate(startOfWeek.getDate() + i);
        // Only count days up to the current date being evaluated
        if (temp.setHours(0,0,0,0) > date.setHours(0,0,0,0)) continue; 

        if (logs[formatDateKey(temp)] === 'completed') {
            count++;
        }
    }

    return count >= habit.goalDaysPerWeek;
};

export const getHolidays = (year: number): Record<string, string> => {
  const holidays: Record<string, string> = {};

  const add = (date: Date, name: string) => {
    holidays[formatDateKey(date)] = name;
  };

  // Helper for Fixed Holidays (Fecha exacta)
  const addFixed = (month: number, day: number, name: string) => {
    add(new Date(year, month - 1, day), name);
  };

  // Helper for Emiliani Law (Se mueven al siguiente Lunes si no caen en Lunes)
  const addEmiliani = (month: number, day: number, name: string) => {
    let date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    if (dayOfWeek !== 1) { 
      // Si no es lunes, calcular cuántos días faltan para el próximo lunes
      // Domingo (0) -> +1 día
      // Martes (2) -> +6 días
      // Miércoles (3) -> +5 días, etc.
      const offset = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      date.setDate(date.getDate() + offset);
    }
    add(date, name);
  };

  // --- 1. Festivos Fijos ---
  addFixed(1, 1, "Año Nuevo");
  addFixed(5, 1, "Día del Trabajo");
  addFixed(7, 20, "Día de la Independencia");
  addFixed(8, 7, "Batalla de Boyacá");
  addFixed(12, 8, "Inmaculada Concepción");
  addFixed(12, 25, "Navidad");

  // --- 2. Ley Emiliani (Se mueven a Lunes) ---
  addEmiliani(1, 6, "Día de los Reyes Magos");
  addEmiliani(3, 19, "Día de San José");
  addEmiliani(6, 29, "San Pedro y San Pablo");
  addEmiliani(8, 15, "Asunción de la Virgen");
  addEmiliani(10, 12, "Día de la Raza");
  addEmiliani(11, 1, "Todos los Santos");
  addEmiliani(11, 11, "Independencia de Cartagena");

  // --- 3. Basados en Pascua (Semana Santa) ---
  // Algoritmo de Meeus/Jones/Butcher para calcular Domingo de Pascua
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  const easter = new Date(year, month - 1, day);

  const addRelative = (daysOffset: number, name: string) => {
      const d = new Date(easter);
      d.setDate(easter.getDate() + daysOffset);
      add(d, name);
  };

  // Semana Santa (Fijos respecto a Pascua)
  addRelative(-3, "Jueves Santo");
  addRelative(-2, "Viernes Santo");

  // Ascension, Corpus y Sagrado Corazón (Se mueven al Lunes siguiente según la iglesia/ley colombiana)
  // Ascensión: 40 días después de Pascua (Jueves) -> Lunes siguiente (+3) = +43
  addRelative(43, "Ascensión del Señor");
  
  // Corpus Christi: 60 días después de Pascua (Jueves) -> Lunes siguiente (+4) = +64
  addRelative(64, "Corpus Christi");
  
  // Sagrado Corazón: 68 días después de Pascua (Viernes) -> Lunes siguiente (+3) = +71
  addRelative(71, "Sagrado Corazón");

  return holidays;
};

export const getMotivationalMessage = (quotes: string[]): string => {
  const idx = Math.floor(Math.random() * quotes.length);
  return quotes[idx];
};

export const getPersonalizedMessage = (habits: Habit[], logs: { [habitId: string]: DailyLog }, settings?: UserSettings): string => {
  // Check for birthday
  if (settings?.birthday) {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    if (settings.birthday === `${mm}-${dd}`) {
       return `¡Feliz Cumpleaños${settings.userName ? ', ' + settings.userName : ''}! Que hoy sea un gran día.`;
    }
  }

  // Find best current streak
  let bestStreak = 0;
  let bestHabitName = '';

  habits.forEach(h => {
    const s = calculateStreak(logs[h.id] || {});
    if (s.current > bestStreak) {
      bestStreak = s.current;
      bestHabitName = h.name;
    }
  });

  if (bestStreak >= 30) return `¡Increíble! ${bestStreak} días seguidos con ${bestHabitName}. Eres imparable.`;
  if (bestStreak >= 14) return `¡${bestStreak} días de racha! ${bestHabitName} ya es parte de ti.`;
  if (bestStreak >= 7) return `Una semana completa con ${bestHabitName}. ¡Sigue así!`;
  if (bestStreak >= 3) return `¡Buen comienzo! ${bestStreak} días seguidos. Mantén el ritmo.`;
  
  // Fallback to generic
  return getMotivationalMessage(MOTIVATIONAL_QUOTES);
};

export const getMonthlyComparisonData = (habits: Habit[], logs: { [habitId: string]: DailyLog }) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Logic for previous month
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = currentYear - 1;
    }

    const daysInCurrent = getDaysInMonth(currentYear, currentMonth);
    const daysInPrev = getDaysInMonth(prevYear, prevMonth);
    const maxDays = Math.max(daysInCurrent, daysInPrev);

    const data = [];

    let cumCurrent = 0;
    let cumPrev = 0;
    let totalPossibleCurrent = 0;
    let totalPossiblePrev = 0;

    for (let day = 1; day <= maxDays; day++) {
        // Current Month Data
        let dailyCurrent = 0;
        let dailyTotalCurrent = 0;
        if (day <= daysInCurrent) {
            const date = new Date(currentYear, currentMonth, day);
            const key = formatDateKey(date);
            // Don't count future days for average calculation
            if (date <= today) {
                habits.forEach(h => {
                    dailyTotalCurrent++;
                    if (logs[h.id]?.[key] === 'completed') dailyCurrent++;
                });
                cumCurrent += dailyCurrent;
                totalPossibleCurrent += dailyTotalCurrent;
            }
        }

        // Previous Month Data
        let dailyPrev = 0;
        let dailyTotalPrev = 0;
        if (day <= daysInPrev) {
            const date = new Date(prevYear, prevMonth, day);
            const key = formatDateKey(date);
            habits.forEach(h => {
                dailyTotalPrev++;
                if (logs[h.id]?.[key] === 'completed') dailyPrev++;
            });
            cumPrev += dailyPrev;
            totalPossiblePrev += dailyTotalPrev;
        }

        data.push({
            day,
            currentMonth: totalPossibleCurrent > 0 ? Math.round((cumCurrent / totalPossibleCurrent) * 100) : 0,
            prevMonth: totalPossiblePrev > 0 ? Math.round((cumPrev / totalPossiblePrev) * 100) : 0,
            isFuture: day > today.getDate()
        });
    }

    return data;
};

export const hexToRgba = (hex: string, alpha: number): string => {
  let c: any;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length== 3){
          c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
  }
  return hex;
};

export const calculateStreak = (logs: DailyLog): { current: number, longest: number } => {
  const completedDates = Object.entries(logs)
      .filter(([_, status]) => status === 'completed')
      .map(([date]) => date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Descending

  if (completedDates.length === 0) return { current: 0, longest: 0 };

  // Current Streak
  let current = 0;
  const today = new Date();
  const todayKey = formatDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  // Determine start point for current streak
  let checkDate: Date | null = null;
  
  if (logs[todayKey] === 'completed') {
      checkDate = today;
  } else if (logs[yesterdayKey] === 'completed') {
      checkDate = yesterday;
  }

  if (checkDate) {
      current = 0;
      // We clone to avoid mutating the date object in the loop
      const iteratorDate = new Date(checkDate);
      while (true) {
          const key = formatDateKey(iteratorDate);
          if (logs[key] === 'completed') {
              current++;
              iteratorDate.setDate(iteratorDate.getDate() - 1);
          } else {
              break;
          }
      }
  }

  // Longest Streak
  let longest = 0;
  let temp = 1;
  const timestamps = completedDates.map(d => {
      const date = new Date(d);
      date.setHours(0,0,0,0);
      return date.getTime();
  }).sort((a, b) => a - b); // Ascending
  
  if (timestamps.length > 0) {
      longest = 1;
      for (let i = 1; i < timestamps.length; i++) {
          const diff = timestamps[i] - timestamps[i-1];
          // 86400000 ms is 24 hours. Allow logic for same day? Unique keys prevent same day.
          if (diff === 86400000) {
              temp++;
          } else {
              temp = 1;
          }
          longest = Math.max(longest, temp);
      }
  }

  return { current, longest };
};

// Identify days where a habit was broken (failed or skipped) after a streak of at least 3 days
export const calculateCriticalDays = (
  habit: Habit,
  habitLogs: DailyLog,
  startDayOfWeek: number = 1,
): string[] => {
  const dates = Object.keys(habitLogs).sort();
  const criticalDays: string[] = [];

  let streak = 0; // Streak of 'completed' days

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i];
    const date = new Date(dateStr);
    const status = habitLogs[dateStr];

    if (status === 'completed') {
      streak++;
    } else if (
      (status === 'failed' || status === 'skipped' || status === 'none') &&
      streak >= 3 // Only consider critical if a decent streak was built
    ) {
      // Check if this habit has a weekly goal AND it's a "flexible" goal (< 7 days/week)
      if (habit.goalDaysPerWeek && habit.goalDaysPerWeek < 7) {
        // We need to check if the weekly goal was already met *for this week, before this date*.
        // isWeeklyGoalMet counts completions up to the provided `date`.
        if (isWeeklyGoalMet(habit, date, habitLogs, startDayOfWeek)) {
          // The weekly goal was met, so this is considered a "rest day" or "goal achieved" day.
          // It doesn't break the weekly goal consistency, so it's not a 'critical' missed day.
          streak = 0; // Reset streak as the sequence of completions is broken for daily streak purposes
          continue; // Don't add to criticalDays
        }
      }
      // If it's a daily habit (goalDaysPerWeek >= 7 or undefined) OR
      // If it's a weekly habit but the weekly goal was NOT met (even with this day's status), then it's critical.
      criticalDays.push(dateStr);
      streak = 0; // Reset streak
    } else {
      // If status is not 'completed' and not triggering a critical day (e.g., streak < 3), reset streak.
      streak = 0;
    }
  }

  return criticalDays.reverse().slice(0, 5); // Return last 5 critical days
};

export const exportToCSV = (habits: Habit[], logs: { [habitId: string]: DailyLog }) => {
  const allDates = new Set<string>();
  Object.values(logs).forEach(log => Object.keys(log).forEach(d => allDates.add(d)));
  const sortedDates = Array.from(allDates).sort();

  const header = ['Fecha', ...habits.map(h => h.name)];
  const rows = sortedDates.map(date => {
      const row = [date];
      habits.forEach(h => {
          row.push(logs[h.id]?.[date] || 'none');
      });
      return row.join(',');
  });

  const csvContent = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `orbit_habits_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getSmartInsights = (habits: Habit[], logs: { [habitId: string]: DailyLog }) => {
    // 1. Best Day of Week
    const dayCounts = [0,0,0,0,0,0,0];
    habits.forEach(h => {
        Object.entries(logs[h.id] || {}).forEach(([dateStr, status]) => {
            if (status === 'completed') {
                const day = new Date(dateStr).getDay(); // 0 (Sun) - 6 (Sat)
                dayCounts[day]++;
            }
        });
    });
    
    const maxVal = Math.max(...dayCounts);
    const bestDayIndex = dayCounts.indexOf(maxVal);
    const bestDayName = WEEK_DAYS[bestDayIndex];

    // 2. Total Completed Habits (Lifetime)
    let totalCompleted = 0;
    habits.forEach(h => {
        totalCompleted += Object.values(logs[h.id] || {}).filter(s => s === 'completed').length;
    });

    // 3. Current Best Performer
    let bestHabit = '';
    let bestEfficiency = 0;
    
    // Check last 7 days efficiency
    habits.forEach(h => {
        let count = 0;
        const now = new Date();
        for(let i=0; i<7; i++) {
             const d = new Date();
             d.setDate(now.getDate() - i);
             if (logs[h.id]?.[formatDateKey(d)] === 'completed') count++;
        }
        if (count > bestEfficiency) {
            bestEfficiency = count;
            bestHabit = h.name;
        }
    });

    return {
        bestDay: bestDayName,
        totalCompleted,
        bestHabit: bestHabit || 'Ninguno aún',
        habitCount: habits.length
    };
};

export const getYearlyHeatmapData = (habits: Habit[], logs: { [habitId: string]: DailyLog }) => {
    const today = new Date();
    const year = today.getFullYear();
    const startDate = new Date(year, 0, 1); // Jan 1st
    const data: { date: Date, count: number, intensity: number }[] = [];
    
    const maxHabits = habits.length || 1;

    // Iterate until today
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const key = formatDateKey(d);
        let count = 0;
        
        habits.forEach(h => {
            if (logs[h.id]?.[key] === 'completed') count++;
        });

        // Intensity 0-4
        // 0: 0
        // 1: 1-25%
        // 2: 26-50%
        // 3: 51-75%
        // 4: 76-100%
        let intensity = 0;
        if (count > 0) {
            const pct = count / maxHabits;
            if (pct <= 0.25) intensity = 1;
            else if (pct <= 0.50) intensity = 2;
            else if (pct <= 0.75) intensity = 3;
            else intensity = 4;
        }

        data.push({
            date: new Date(d),
            count,
            intensity
        });
    }
    return data;
};

// --- GAMIFICATION LOGIC ---
export const calculateLevel = (totalCompleted: number): UserLevel => {
    const XP_PER_ACTION = 15;
    const currentXp = totalCompleted * XP_PER_ACTION;
    
    // Simple scaling formula: Level = Math.floor(Math.sqrt(XP / 50))
    // Or linear/exponential mix
    // Let's use tiers: 
    // Lvl 1: 0-200 XP
    // Lvl 2: 200-500 XP
    // Lvl 3: 500-1000 XP
    
    // Algorithm: XP required for level N = 100 * N * N
    let level = 1;
    let xpForNext = 100;
    
    while (currentXp >= xpForNext) {
        level++;
        xpForNext = 100 * level * level;
    }

    const prevLevelXp = 100 * (level - 1) * (level - 1);
    const progress = ((currentXp - prevLevelXp) / (xpForNext - prevLevelXp)) * 100;

    let rank = "Cadete";
    if (level >= 5) rank = "Oficial";
    if (level >= 10) rank = "Capitán";
    if (level >= 20) rank = "Comandante";
    if (level >= 30) rank = "Almirante";
    if (level >= 50) rank = "Leyenda Galáctica";

    return {
        level,
        xp: currentXp,
        nextLevelXp: xpForNext,
        rank,
        progress: Math.min(100, Math.max(0, progress))
    };
};

export const getZodiacSign = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth(); // 0-indexed

    // Adjust month for Capricorn which wraps around
    const normalizedMonth = month;
    const normalizedDay = day;

    for (const sign of ZODIAC_SIGNS) {
        const start = new Date(date.getFullYear(), sign.startMonth, sign.startDay);
        const end = new Date(date.getFullYear(), sign.endMonth, sign.endDay);

        // Handle wrap-around for Capricorn (Dec 22 - Jan 19)
        if (sign.name === "Capricornio") {
            if ((month === 11 && day >= sign.startDay) || (month === 0 && day <= sign.endDay)) {
                return sign;
            }
        } else {
            const current = new Date(date.getFullYear(), normalizedMonth, normalizedDay);
            // Check if the current date falls within the sign's range
            // Need to compare dates as if they are just MM-DD, ignoring year for range logic,
            // but JS Date objects handle year by default. So create temp dates for comparison.
            const sDay = sign.startDay;
            const eDay = sign.endDay;
            const sMonth = sign.startMonth;
            const eMonth = sign.endMonth;

            // Simplified logic: Check if current month/day is between start/end month/day
            if (
                (month === sMonth && day >= sDay) ||
                (month === eMonth && day <= eDay) ||
                (month > sMonth && month < eMonth)
            ) {
                return sign;
            }
        }
    }
    return { name: "Zodíaco Desconocido", symbol: "✨" }; // Fallback
};
