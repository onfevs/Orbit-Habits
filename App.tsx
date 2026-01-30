import React, { useState, useEffect } from 'react';
import { useHabits } from './hooks/useHabits';
import CircularCalendar from './components/CircularCalendar';
import StatsDashboard from './components/StatsDashboard';
import HabitManager from './components/HabitManager';
import Settings from './components/Settings';
import DynamicBackground from './components/DynamicBackground';
import FocusTimer from './components/FocusTimer';
import LevelProgress from './components/LevelProgress';
import { ViewMode } from './types';
import { LayoutDashboard, BarChart2, List, Settings as SettingsIcon, Timer } from 'lucide-react';
import { getPersonalizedMessage } from './utils';
import clsx from 'clsx';

const App: React.FC = () => {
  const { 
    habits, 
    logs, 
    notes,
    addHabit, 
    updateHabit, 
    deleteHabit, 
    reorderHabits,
    toggleHabitStatus,
    saveNote,
    isOnboarded,
    completeOnboarding,
    settings,
    updateSettings,
    importLogs,
    userLevel
  } = useHabits();

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [quote, setQuote] = useState('');
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  
  // Onboarding local state
  const [tempName, setTempName] = useState('');
  const [tempBirthday, setTempBirthday] = useState('');

  // Update quote based on habits and logs status and settings (for birthday)
  useEffect(() => {
    setQuote(getPersonalizedMessage(habits, logs, settings));
  }, [habits, logs, settings]);

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const handleFinishOnboarding = () => {
      if (tempName.trim()) {
          completeOnboarding(tempName, tempBirthday);
      }
  };

  const handleCompleteSession = (habitId: string) => {
      toggleHabitStatus(habitId, new Date(), 'completed');
  };

  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-transparent relative overflow-hidden flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 font-sans">
        <DynamicBackground />
        
        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
            <div className="w-24 h-24 rounded-full mb-8 flex items-center justify-center border-2 border-primary shadow-gold animate-pulse-slow bg-surface/50 backdrop-blur-sm">
                <div className="w-16 h-16 bg-primary rounded-full opacity-80"></div>
            </div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-4 drop-shadow-lg">Orbit Habits</h1>
            <p className="text-muted max-w-md mb-8 drop-shadow-md font-medium">
            Construye la mejor versión de ti mismo. Excelencia diaria.
            </p>
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
                onClick={handleFinishOnboarding}
                disabled={!tempName.trim()}
                className={clsx(
                    "w-full bg-primary text-black font-bold py-4 rounded-xl shadow-lg transition-colors",
                    !tempName.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-primary-soft"
                )}
            >
                Comenzar
            </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-text flex flex-col font-sans selection:bg-primary selection:text-black relative">
      
      {/* Animated Icon Background */}
      <DynamicBackground />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="pt-8 pb-4 flex flex-col items-center text-center max-w-5xl mx-auto w-full mb-2 animate-in fade-in slide-in-from-top-4">
            <h1 className="text-2xl font-serif font-bold text-slate-100 mb-1 drop-shadow-sm">
                Hola, {settings.userName || 'Viajero'}
            </h1>
            <p className="text-xs text-slate-400 italic max-w-md drop-shadow-md font-medium mb-4 px-6">"{quote}"</p>
            
            {/* Gamification Progress */}
            <LevelProgress userLevel={userLevel} />
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-24 overflow-x-hidden">
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
            </div>
            )}

            {currentView === 'stats' && <StatsDashboard habits={habits} logs={logs} settings={settings} />}
            
            {currentView === 'habits' && (
            <HabitManager 
                habits={habits} 
                onAdd={addHabit} 
                onUpdate={updateHabit} 
                onDelete={deleteHabit}
                onReorder={reorderHabits}
            />
            )}

            {currentView === 'settings' && (
            <Settings 
                settings={settings} 
                onUpdateSettings={updateSettings} 
                onImportCSV={importLogs}
                habits={habits} 
                logs={logs} 
            />
            )}
        </main>

        {/* Bottom Navigation - Glassmorphism */}
        <nav className="fixed bottom-4 left-4 right-4 bg-surface/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-strong z-50 max-w-md mx-auto">
            <div className="flex justify-between items-center h-16 px-6">
            <NavButton 
                active={currentView === 'dashboard'} 
                onClick={() => setCurrentView('dashboard')} 
                icon={<LayoutDashboard size={20} />} 
                label="Diario"
            />
            <NavButton 
                active={currentView === 'stats'} 
                onClick={() => setCurrentView('stats')} 
                icon={<BarChart2 size={20} />} 
                label="Progreso"
            />
            
            {/* Center Action Button - Focus Mode */}
            <div className="relative -top-6">
                <button 
                    onClick={() => setShowFocusTimer(true)}
                    className="w-14 h-14 rounded-full bg-primary text-black flex items-center justify-center shadow-gold hover:scale-110 transition-transform"
                >
                    <Timer size={28} strokeWidth={2.5} />
                </button>
            </div>

            <NavButton 
                active={currentView === 'habits'} 
                onClick={() => setCurrentView('habits')} 
                icon={<List size={20} />} 
                label="Hábitos"
            />
            <NavButton 
                active={currentView === 'settings'} 
                onClick={() => setCurrentView('settings')} 
                icon={<SettingsIcon size={20} />} 
                label="Ajustes"
            />
            </div>
        </nav>
      </div>

      {/* Focus Timer Modal Overlay */}
      <FocusTimer 
          isOpen={showFocusTimer} 
          onClose={() => setShowFocusTimer(false)}
          habits={habits}
          onCompleteSession={handleCompleteSession}
      />

    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center gap-1 transition-all w-16",
      active ? "text-primary scale-110" : "text-slate-500 hover:text-slate-300"
    )}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;