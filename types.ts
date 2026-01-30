
export type HabitStatus = 'completed' | 'failed' | 'skipped' | 'none';

export interface Habit {
  id: string;
  name: string;
  color: string;
  createdAt: string; // ISO date string
  icon?: string;
  description?: string;
  goalDaysPerWeek?: number;
}

// Map of date string (YYYY-MM-DD) -> status
export interface DailyLog {
  [date: string]: HabitStatus;
}

// Map of date string -> note content
export interface DailyNotes {
  [date: string]: string;
}

export type CalendarViewMode = 'circular' | 'grid' | 'list';

export interface UserSettings {
  userName: string;
  onboarded: boolean;
  notificationsEnabled: boolean;
  notificationTime: string; // "09:00"
  weeklySummaryEnabled: boolean;
  startDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  showHolidays: boolean;
  theme: 'dark' | 'light';
  birthday: string; // "MM-DD"
  calendarView: CalendarViewMode; // NEW
}

// Helper structure for persistence
export interface HabitData {
  habits: Habit[];
  logs: { [habitId: string]: DailyLog };
  notes: DailyNotes; // NEW
  userSettings: UserSettings;
}

export type ViewMode = 'dashboard' | 'stats' | 'habits' | 'settings';

export interface DayStat {
  date: string; // YYYY-MM-DD
  day: number;
  totalHabits: number;
  completed: number;
  percentage: number;
}

export interface UserLevel {
    level: number;
    xp: number;
    nextLevelXp: number;
    rank: string;
    progress: number;
}