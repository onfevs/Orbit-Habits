import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHabits } from './hooks/useHabits';
import CircularCalendar from './components/CircularCalendar';
import StatsDashboard from './components/StatsDashboard';
import HabitManager from './components/HabitManager';
import Settings from './components/Settings';
import DynamicBackground from './components/DynamicBackground';
import LevelProgress from './components/LevelProgress';
import MonthlySummaryModal from './components/MonthlySummaryModal';
import AchievementsModal from './components/AchievementsModal';
import HabitPacksModal from './components/HabitPacksModal';
import WeeklyTableView from './components/WeeklyTableView';
import { ViewMode, Habit, DailyLog } from './types';
import {
  LayoutDashboard, BarChart2, List, Settings as SettingsIcon,
  X, Trophy, Flame, AlertTriangle, CheckCircle2, Award, Package, TableIcon
} from 'lucide-react';
import { getPersonalizedMessage, getWeeklySummaryStats, formatDateKey } from './utils';
import clsx from 'clsx';

// ─── Weekly Summary Modal ────────────────────────────────────────────────────
interface WeeklySummaryModalProps {
  habits: Habit[];
  logs: { [habitId: string]: DailyLog };
  startDayOfWeek: number;
  userName: string;
  onClose: () => void;
}

const WeeklySummaryModal: React.FC<WeeklySummaryModalProps> = ({ habits, logs, startDayOfWeek, userName, onClose }) => {
  const stats = getWeeklySummaryStats(habits, logs, startDayOfWeek);
  const weekLabel = stats.weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-surface border border-slate-700 rounded-3xl shadow-strong flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 relative overflow-hidden border-b border-slate-700 rounded-t-3xl shrink-0">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-2xl">🌟</div>
              <div>
                <h2 className="text-xl font-serif font-bold text-white">Resumen Semanal</h2>
                <p className="text-xs text-muted">Semana del {weekLabel}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-background rounded-2xl p-3 text-center border border-slate-800">
              <p className="text-2xl font-bold text-primary">{stats.totalCompleted}</p>
              <p className="text-[10px] text-muted mt-1">Completados</p>
            </div>
            <div className="bg-background rounded-2xl p-3 text-center border border-slate-800">
              <p className="text-2xl font-bold text-success">{stats.metGoal.length}</p>
              <p className="text-[10px] text-muted mt-1">Metas logradas</p>
            </div>
            <div className="bg-background rounded-2xl p-3 text-center border border-slate-800">
              <p className="text-2xl font-bold text-danger">{stats.atRisk.length}</p>
              <p className="text-[10px] text-muted mt-1">Sin actividad</p>
            </div>
          </div>

          {stats.bestHabit && stats.bestHabit.weekCompleted > 0 && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent border border-primary/30 rounded-2xl p-4">
              <Trophy size={24} className="text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted">MVP de la semana</p>
                <p className="font-bold text-white font-serif">{stats.bestHabit.name}</p>
                <p className="text-xs text-primary mt-0.5">{stats.bestHabit.weekCompleted} de {stats.bestHabit.goal} días — {stats.bestHabit.isMet ? '✅ Meta cumplida' : 'En progreso'}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-muted font-semibold uppercase tracking-wider">Detalle por Hábito</p>
            {stats.habitResults.map(h => {
              const pct = Math.min(100, Math.round((h.weekCompleted / h.goal) * 100));
              return (
                <div key={h.id} className="bg-background rounded-xl p-3 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                      {h.name}
                    </span>
                    <span className={clsx("text-xs font-bold", h.isMet ? "text-success" : "text-muted")}>
                      {h.weekCompleted}/{h.goal}
                      {h.isMet && <CheckCircle2 size={12} className="inline ml-1" />}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={clsx("h-full rounded-full transition-all duration-700", h.isMet ? "bg-success" : "bg-primary")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {h.currentStreak > 0 && (
                    <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
                      <Flame size={10} className="text-orange-400" />{h.currentStreak} días de racha
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {stats.atRisk.length > 0 && (
            <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-danger" />
                <p className="text-xs font-semibold text-danger uppercase tracking-wider">Para mejorar la próxima semana</p>
              </div>
              <div className="space-y-1.5">
                {stats.atRisk.map(h => (
                  <p key={h.id} className="text-xs text-muted flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />{h.name} — sin actividad registrada
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-sm text-slate-400 italic">
              {stats.metGoal.length === habits.length
                ? `¡Semana perfecta, ${userName}! Imparable. 🚀`
                : stats.metGoal.length > 0
                  ? `Buen trabajo, ${userName}. Sigue construyendo momentum. 💪`
                  : `Esta semana fue difícil, ${userName}. La próxima será mejor. 🌅`}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button onClick={onClose} className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary-soft transition-colors">
            ¡A por esta semana! 🎯
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Level-Up Celebration ─────────────────────────────────────────────────────
const LevelUpToast: React.FC<{ level: number; rank: string; onClose: () => void }> = ({ level, rank, onClose }) => (
  <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
    <div
      className="pointer-events-auto bg-gradient-to-br from-primary via-amber-400 to-orange-500 text-black p-8 rounded-3xl shadow-[0_8px_64px_rgba(201,162,77,0.8)] max-w-xs w-full mx-4 text-center animate-in zoom-in-75 duration-500"
      style={{ '--tw-shadow': '0 8px 64px rgba(201,162,77,0.8)' } as React.CSSProperties}
    >
      <div className="text-6xl mb-3 animate-bounce">🎉</div>
      <h2 className="text-2xl font-serif font-black mb-1">¡Subiste de Nivel!</h2>
      <p className="text-4xl font-black my-2">Nivel {level}</p>
      <p className="font-bold opacity-80 mb-4">{rank}</p>
      <button
        onClick={onClose}
        className="bg-black/20 hover:bg-black/30 transition-colors px-6 py-2 rounded-xl font-bold text-sm"
      >
        ¡Gracias! 🚀
      </button>
    </div>
  </div>
);

// ─── Main App ────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const {
    habits, logs, notes, addHabit, updateHabit, deleteHabit, reorderHabits,
    toggleHabitStatus, saveNote, isOnboarded, completeOnboarding,
    settings, updateSettings, importLogs, userLevel
  } = useHabits();

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [quote, setQuote] = useState('');
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showHabitPacks, setShowHabitPacks] = useState(false);
  const [showWeeklyTable, setShowWeeklyTable] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showXpFloat, setShowXpFloat] = useState<{ x: number; y: number } | null>(null);

  // Onboarding
  const [tempName, setTempName] = useState('');
  const [tempBirthday, setTempBirthday] = useState('');

  // Level-up tracking
  const prevLevel = useRef(userLevel.level);
  useEffect(() => {
    if (userLevel.level > prevLevel.current && prevLevel.current > 0) {
      setShowLevelUp(true);
    }
    prevLevel.current = userLevel.level;
  }, [userLevel.level]);

  // ── Light / Dark mode sync ─────────────────────────────────────────────
  useEffect(() => {
    const html = document.documentElement;
    settings.theme === 'dark' ? html.classList.add('dark') : html.classList.remove('dark');
  }, [settings.theme]);

  // ── Quote ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setQuote(getPersonalizedMessage(habits, logs, settings));
  }, [habits, logs, settings]);

  // ── Weekly Summary auto-trigger ─────────────────────────────────────────
  useEffect(() => {
    if (!settings.weeklySummaryEnabled || habits.length === 0) return;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isSummaryDay = dayOfWeek === 0 || (settings.startDayOfWeek === 1 && dayOfWeek === 1);
    if (!isSummaryDay) return;
    const todayKey = formatDateKey(today);
    if (localStorage.getItem('orbit_last_weekly_summary') === todayKey) return;
    const timer = setTimeout(() => {
      setShowWeeklySummary(true);
      localStorage.setItem('orbit_last_weekly_summary', todayKey);
    }, 1500);
    return () => clearTimeout(timer);
  }, [settings.weeklySummaryEnabled, settings.startDayOfWeek, habits.length]);

  // ── Monthly Summary auto-trigger (1st of month) ─────────────────────────
  useEffect(() => {
    if (habits.length === 0) return;
    const today = new Date();
    if (today.getDate() !== 1) return;
    const todayKey = formatDateKey(today);
    if (localStorage.getItem('orbit_last_monthly_summary') === todayKey) return;
    const timer = setTimeout(() => {
      setShowMonthlySummary(true);
      localStorage.setItem('orbit_last_monthly_summary', todayKey);
    }, 2500);
    return () => clearTimeout(timer);
  }, [habits.length]);

  // ── Swipe to change month in dashboard ────────────────────────────────
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + (dx < 0 ? 1 : -1));
      setCurrentDate(newDate);
      if (navigator.vibrate) navigator.vibrate(25);
    }
    touchStartX.current = null;
  }, [currentDate]);

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  // ── Nav click with haptics ─────────────────────────────────────────────
  const handleNavClick = useCallback((view: ViewMode) => {
    if (navigator.vibrate) navigator.vibrate(20);
    setCurrentView(view);
  }, []);

  // ── Habit toggle with XP float ─────────────────────────────────────────
  const handleToggleWithXp = useCallback((habitId: string, date: Date, status: any, e?: React.MouseEvent) => {
    toggleHabitStatus(habitId, date, status);
    if (status === 'completed' && e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect?.();
      // XP float isn't tied to specific element here — handled in CircularCalendar
    }
  }, [toggleHabitStatus]);

  // ── HabitPacks multi-add ───────────────────────────────────────────────
  const handleAddHabits = useCallback((newHabits: Habit[]) => {
    newHabits.forEach(h => addHabit(h));
  }, [addHabit]);

  // ── At-risk badge count ────────────────────────────────────────────────
  const atRiskCount = habits.filter(h => {
    let weekCompleted = 0;
    const today = new Date();
    const day = today.getDay();
    const diff = (day < (settings.startDayOfWeek ?? 1) ? day + 7 : day) - (settings.startDayOfWeek ?? 1);
    const sow = new Date(today);
    sow.setDate(today.getDate() - diff);
    sow.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(sow);
      d.setDate(sow.getDate() + i);
      if (d > today) break;
      if (logs[h.id]?.[formatDateKey(d)] === 'completed') weekCompleted++;
    }
    const goal = h.goalDaysPerWeek || 7;
    const daysLeft = 7 - (diff + 1);
    return (goal - weekCompleted) > daysLeft && weekCompleted < goal;
  }).length;

  // ── Onboarding screen ─────────────────────────────────────────────────
  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-transparent relative overflow-hidden flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 font-sans">
        <DynamicBackground />
        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="w-24 h-24 rounded-full mb-8 flex items-center justify-center border-2 border-primary shadow-gold animate-pulse-slow bg-surface/50 backdrop-blur-sm">
            <div className="w-16 h-16 bg-primary rounded-full opacity-80" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-4 drop-shadow-lg">Orbit Habits</h1>
          <p className="text-muted max-w-md mb-8 drop-shadow-md font-medium">Construye la mejor versión de ti mismo. Excelencia diaria.</p>
          <div className="w-full space-y-4">
            <input
              type="text"
              placeholder="¿Cómo te llamas?"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-surface/80 backdrop-blur-md border border-slate-700 rounded-xl p-4 text-white text-center focus:border-primary focus:outline-none shadow-soft transition-all placeholder:text-slate-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="Tu cumpleaños (MM-DD)"
              value={tempBirthday}
              onChange={(e) => setTempBirthday(e.target.value)}
              className="w-full bg-surface/80 backdrop-blur-md border border-slate-700 rounded-xl p-4 text-white text-center focus:border-primary focus:outline-none shadow-soft transition-all placeholder:text-slate-500"
              maxLength={5}
            />
            <button
              onClick={() => tempName.trim() && completeOnboarding(tempName, tempBirthday)}
              disabled={!tempName.trim()}
              className={clsx(
                "w-full bg-primary text-black font-bold py-4 rounded-xl shadow-lg transition-colors",
                !tempName.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-primary-soft"
              )}
            >
              Comenzar
            </button>
            {/* Quick start with packs */}
            <button
              onClick={() => { if (tempName.trim()) { completeOnboarding(tempName, tempBirthday); setTimeout(() => setShowHabitPacks(true), 500); } }}
              disabled={!tempName.trim()}
              className={clsx(
                "w-full border border-primary/40 text-primary py-3 rounded-xl text-sm font-medium transition-colors",
                !tempName.trim() ? "opacity-30 cursor-not-allowed" : "hover:bg-primary/10"
              )}
            >
              📦 Comenzar con Packs de Hábitos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-text flex flex-col font-sans selection:bg-primary selection:text-black relative">
      <DynamicBackground />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="pt-8 pb-4 flex flex-col items-center text-center max-w-5xl mx-auto w-full mb-2 animate-in fade-in slide-in-from-top-4">
          <h1 className="text-2xl font-serif font-bold text-slate-100 mb-1 drop-shadow-sm">
            Hola, {settings.userName || 'Viajero'}
          </h1>
          <p className="text-xs text-slate-400 italic max-w-md drop-shadow-md font-medium mb-4 px-6">"{quote}"</p>
          <div className="flex items-center gap-3">
            <LevelProgress userLevel={userLevel} />
            {/* Quick action buttons in header */}
            <button
              onClick={() => setShowAchievements(true)}
              className="w-9 h-9 rounded-full bg-surface/60 border border-slate-700 flex items-center justify-center text-primary hover:border-primary/50 transition-all hover:scale-110 active:scale-95"
              title="Logros"
            >
              <Award size={16} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main
          className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-24 overflow-x-hidden"
          onTouchStart={currentView === 'dashboard' ? handleTouchStart : undefined}
          onTouchEnd={currentView === 'dashboard' ? handleTouchEnd : undefined}
        >
          {currentView === 'dashboard' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <CircularCalendar
                currentDate={currentDate}
                habits={habits}
                logs={logs}
                notes={notes}
                onToggleStatus={toggleHabitStatus}
                onSaveNote={saveNote}
                onMonthChange={handleMonthChange}
                showHolidays={settings.showHolidays}
                birthday={settings.birthday}
                startDayOfWeek={settings.startDayOfWeek}
              />

              {/* Weekly Table compact toggle — centered below calendar */}
              {habits.length > 0 && (
                <div className="mt-4 flex flex-col items-center">
                  <button
                    onClick={() => { setShowWeeklyTable(v => !v); if (navigator.vibrate) navigator.vibrate(20); }}
                    className={clsx(
                      "flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-bold transition-all",
                      showWeeklyTable
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-surface/60 border-slate-700 text-muted hover:text-primary hover:border-primary/40"
                    )}
                  >
                    <TableIcon size={13} />
                    {showWeeklyTable ? 'Ocultar tabla semanal' : 'Ver tabla semanal'}
                  </button>
                  {showWeeklyTable && (
                    <div className="mt-3 w-full bg-surface border border-slate-700 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
                      <WeeklyTableView
                        habits={habits}
                        logs={logs}
                        startDayOfWeek={settings.startDayOfWeek}
                        onToggleStatus={toggleHabitStatus}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentView === 'stats' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <StatsDashboard
                habits={habits}
                logs={logs}
                settings={settings}
                onNavigateToDashboard={() => setCurrentView('dashboard')}
              />
            </div>
          )}

          {currentView === 'habits' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <HabitManager
                habits={habits}
                onAdd={addHabit}
                onUpdate={updateHabit}
                onDelete={deleteHabit}
                onReorder={reorderHabits}
                onShowPacks={() => { setShowHabitPacks(true); if (navigator.vibrate) navigator.vibrate(20); }}
              />
            </div>
          )}

          {currentView === 'settings' && (
            <Settings
              settings={settings}
              onUpdateSettings={updateSettings}
              onImportCSV={importLogs}
              habits={habits}
              logs={logs}
              onShowWeeklySummary={() => setShowWeeklySummary(true)}
              onShowMonthlySummary={() => setShowMonthlySummary(true)}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-4 left-4 right-4 bg-surface/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-strong z-50 max-w-md mx-auto">
          <div className="flex justify-around items-center h-16 px-4">
            <NavButton active={currentView === 'dashboard'} onClick={() => handleNavClick('dashboard')} icon={<LayoutDashboard size={20} />} label="Diario" />
            <NavButton active={currentView === 'stats'} onClick={() => handleNavClick('stats')} icon={<BarChart2 size={20} />} label="Progreso" badge={atRiskCount > 0 ? atRiskCount : undefined} />
            <NavButton active={currentView === 'habits'} onClick={() => handleNavClick('habits')} icon={<List size={20} />} label="Hábitos" />
            <NavButton active={currentView === 'settings'} onClick={() => handleNavClick('settings')} icon={<SettingsIcon size={20} />} label="Ajustes" />
          </div>
        </nav>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showWeeklySummary && (
        <WeeklySummaryModal
          habits={habits} logs={logs}
          startDayOfWeek={settings.startDayOfWeek}
          userName={settings.userName || 'Campeón'}
          onClose={() => setShowWeeklySummary(false)}
        />
      )}

      {showMonthlySummary && (
        <MonthlySummaryModal
          habits={habits} logs={logs}
          startDayOfWeek={settings.startDayOfWeek}
          onClose={() => setShowMonthlySummary(false)}
        />
      )}

      {showAchievements && (
        <AchievementsModal
          habits={habits} logs={logs}
          onClose={() => setShowAchievements(false)}
        />
      )}

      {showHabitPacks && (
        <HabitPacksModal
          existingHabits={habits}
          onAddHabits={handleAddHabits}
          onClose={() => setShowHabitPacks(false)}
        />
      )}

      {showLevelUp && (
        <LevelUpToast
          level={userLevel.level}
          rank={userLevel.rank}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </div>
  );
};

// ─── Nav Button ──────────────────────────────────────────────────────────────
const NavButton = ({
  active, onClick, icon, label, badge
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) => (
  <button
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center gap-1 transition-all w-16 relative py-1",
      active ? "text-primary scale-110" : "text-slate-500 hover:text-slate-300"
    )}
  >
    <div className="relative">
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-background">
          {badge}
        </span>
      )}
    </div>
    {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;