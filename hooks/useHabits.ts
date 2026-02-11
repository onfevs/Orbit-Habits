import { useState, useEffect, useCallback, useRef } from 'react';
import { Habit, DailyLog, HabitData, HabitStatus, UserSettings, DailyNotes } from '../types';
import { INITIAL_HABITS, HABIT_COLORS } from '../constants';
import { formatDateKey, generateId, calculateLevel } from '../utils';

const STORAGE_KEY = 'orbit_habits_data_v1';

const DEFAULT_SETTINGS: UserSettings = {
  userName: '',
  onboarded: false,
  notificationsEnabled: false,
  notificationTime: '09:00',
  weeklySummaryEnabled: false,
  startDayOfWeek: 1, // Default Monday
  showHolidays: true, // Enabled by default as requested
  theme: 'dark',
  birthday: '',
  calendarView: 'circular'
};

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<{ [habitId: string]: DailyLog }>({});
  const [notes, setNotes] = useState<DailyNotes>({});
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const lastNotificationSent = useRef<string | null>(null);

  // Load data
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data: HabitData = JSON.parse(raw);
        setHabits(data.habits || INITIAL_HABITS);
        setLogs(data.logs || {});
        setNotes(data.notes || {});
        
        // --- MODIFICACIÓN INICIO: Carga robusta de userSettings ---
        let loadedSettings: UserSettings;
        if (data.userSettings) {
            loadedSettings = {
                ...DEFAULT_SETTINGS, // Empezar con los valores por defecto
                ...data.userSettings // Sobrescribir con los valores cargados
            };
            // Heurística: Si ya hay un nombre de usuario, asume que ha pasado por el onboarding
            // Esto maneja casos donde el flag 'onboarded' podría estar ausente o ser falso en datos antiguos.
            if (loadedSettings.userName && !loadedSettings.onboarded) {
                loadedSettings.onboarded = true;
            }
        } else {
            loadedSettings = DEFAULT_SETTINGS;
        }
        setSettings(loadedSettings);
        // --- MODIFICACIÓN FIN ---

      } catch (e) {
        console.error("Failed to parse habit data", e);
        setHabits(INITIAL_HABITS);
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setHabits(INITIAL_HABITS);
      setLogs({});
      setNotes({});
      setSettings(DEFAULT_SETTINGS);
    }
    setLoading(false);
  }, []);

  // Persist data
  useEffect(() => {
    if (loading) return;
    const data: HabitData = {
      habits,
      logs,
      notes,
      userSettings: settings
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [habits, logs, notes, settings, loading]);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Notification Check Loop
  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    if (!('Notification' in window)) return;

    const interval = setInterval(() => {
      const now = new Date();
      const [targetHour, targetMinute] = settings.notificationTime.split(':').map(Number);
      const currentKey = `${now.getDate()}-${now.getHours()}:${now.getMinutes()}`;

      // Check if time matches and we haven't sent one this minute
      if (
        now.getHours() === targetHour && 
        now.getMinutes() === targetMinute && 
        lastNotificationSent.current !== currentKey
      ) {
          if (Notification.permission === 'granted') {
             new Notification("Orbit Habits", { 
               body: "¡Es hora de registrar tus hábitos de hoy!",
               icon: '/favicon.ico' // Assuming standard favicon or PWA icon
             });
             lastNotificationSent.current = currentKey;
          }
      }
    }, 5000); // Check every 5 seconds to be precise enough

    return () => clearInterval(interval);
  }, [settings]);

  const addHabit = (habit: Habit) => {
    setHabits(prev => [...prev, habit]);
  };

  const updateHabit = (updated: Habit) => {
    setHabits(prev => prev.map(h => h.id === updated.id ? updated : h));
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    const newLogs = { ...logs };
    delete newLogs[id];
    setLogs(newLogs);
  };

  const reorderHabits = (startIndex: number, endIndex: number) => {
    setHabits(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const toggleHabitStatus = useCallback((habitId: string, date: Date, status: HabitStatus) => {
    const key = formatDateKey(date);
    setLogs(prev => ({
      ...prev,
      [habitId]: {
        ...(prev[habitId] || {}),
        [key]: status
      }
    }));
  }, []);

  const saveNote = (date: Date, content: string) => {
      const key = formatDateKey(date);
      setNotes(prev => ({
          ...prev,
          [key]: content
      }));
  };

  const getDayStatus = useCallback((date: Date): number => {
    if (habits.length === 0) return 0;
    const key = formatDateKey(date);
    let completed = 0;
    habits.forEach(h => {
      const status = logs[h.id]?.[key];
      if (status === 'completed') completed++;
    });
    return Math.round((completed / habits.length) * 100);
  }, [habits, logs]);

  const completeOnboarding = (name: string, birthday: string) => {
    setSettings(prev => ({ ...prev, userName: name, birthday, onboarded: true }));
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Request permission if enabling notifications
    if (newSettings.notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  // Logic to parse CSV and merge with logs, creating new habits if necessary
  const importLogs = (csvText: string) => {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) return;

      const header = lines[0].split(',').map(h => h.trim());
      
      // 1. Identify and Create Missing Habits
      // We operate on a copy of habits to update state atomically at the end
      const updatedHabits = [...habits];
      const habitMap: { [colIndex: number]: string } = {}; // colIndex -> habitId
      
      header.forEach((colName, index) => {
          if(index === 0) return; // Date column
          
          // Case insensitive matching
          let habit = updatedHabits.find(h => h.name.toLowerCase() === colName.toLowerCase());
          
          if (!habit) {
              // Create new habit if it doesn't exist
              const newHabit: Habit = {
                  id: generateId(),
                  name: colName,
                  // Assign a color cyclically
                  color: HABIT_COLORS[updatedHabits.length % HABIT_COLORS.length],
                  icon: 'Activity', // Default icon
                  createdAt: new Date().toISOString(),
                  goalDaysPerWeek: 7,
                  description: 'Importado desde CSV'
              };
              updatedHabits.push(newHabit);
              habit = newHabit;
          }
          
          if (habit) {
              habitMap[index] = habit.id;
          }
      });

      // Update habits state to include newly created ones
      setHabits(updatedHabits);

      // 2. Parse Logs
      const newLogs = { ...logs };

      for(let i=1; i<lines.length; i++) {
          const row = lines[i].split(',');
          if (row.length < 1) continue;
          
          const dateStr = row[0].trim();
          // Basic validation for YYYY-MM-DD
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

          for(let j=1; j<row.length; j++) {
              const habitId = habitMap[j];
              const statusRaw = row[j] ? row[j].trim() : 'none';
              const status = (['completed', 'failed', 'skipped', 'none'].includes(statusRaw) ? statusRaw : 'none') as HabitStatus;
              
              if (habitId) {
                  if (!newLogs[habitId]) newLogs[habitId] = {};
                  // Only update if status is significant or explicit 'none' overwrite? 
                  // Let's assume CSV is source of truth for that date.
                  newLogs[habitId][dateStr] = status;
              }
          }
      }
      setLogs(newLogs);
  };

  // Gamification: Calculate user stats
  const getUserLevel = () => {
      let totalCompleted = 0;
      Object.values(logs).forEach(habitLog => {
          Object.values(habitLog).forEach(status => {
              if (status === 'completed') totalCompleted++;
          });
      });
      return calculateLevel(totalCompleted);
  };

  return {
    habits,
    logs,
    notes,
    settings,
    loading,
    isOnboarded: settings.onboarded,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    toggleHabitStatus,
    saveNote,
    getDayStatus,
    completeOnboarding,
    updateSettings,
    importLogs,
    userLevel: getUserLevel()
  };
};