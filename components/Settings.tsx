import React, { useRef, useState } from 'react';
import { Habit, DailyLog, UserSettings } from '../types';
import { Bell, User, Clock, CheckCircle, Calendar, Download, Palmtree, Moon, Sun, Cake, Upload, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { exportToCSV } from '../utils';

interface SettingsProps {
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onImportCSV?: (csvText: string) => void;
  onShowWeeklySummary?: () => void;
  onShowMonthlySummary?: () => void;
  habits?: Habit[];
  logs?: { [habitId: string]: DailyLog };
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onImportCSV, onShowWeeklySummary, onShowMonthlySummary, habits = [], logs = {} }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [birthdayError, setBirthdayError] = useState<string | null>(null);

  const handleNotificationToggle = () => {
    onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ notificationTime: e.target.value });
  };

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onUpdateSettings({ birthday: val });

    // Validate MM-DD format
    const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (val && !regex.test(val)) {
      setBirthdayError("Formato inválido. Usa MM-DD (Ej: 01-15)");
    } else {
      setBirthdayError(null);
    }
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onUpdateSettings({ notificationsEnabled: true });
        new Notification("¡Permiso concedido!", { body: "Te avisaremos para cumplir tus hábitos." });
      } else {
        alert("Necesitas habilitar las notificaciones en tu navegador.");
        onUpdateSettings({ notificationsEnabled: false });
      }
    } else {
      alert("Tu navegador no soporta notificaciones.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string' && onImportCSV) {
        try {
          onImportCSV(text);
          alert('¡Datos importados correctamente!');
        } catch (error) {
          alert('Error al importar CSV. Verifica el formato.');
          console.error(error);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 text-slate-800 dark:text-slate-100 font-sans leading-relaxed">
      <h2 className="text-3xl font-serif font-bold mb-8 text-primary tracking-wide">Configuración</h2>

      <div className="space-y-8">

        {/* Profile Section */}
        <div className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-500 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold text-text">Perfil</h3>
              <p className="text-slate-500 dark:text-muted text-sm tracking-wide">Tus datos personales</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Nombre</label>
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:outline-none focus:border-primary transition-colors text-text placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Cumpleaños (MM-DD)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Cake size={18} className="text-pink-400" />
                </div>
                <input
                  type="text"
                  placeholder="Ej: 12-25"
                  value={settings.birthday || ''}
                  onChange={handleBirthdayChange}
                  className={clsx(
                    "w-full bg-slate-100 dark:bg-slate-900 border rounded-lg p-3 pl-10 focus:outline-none transition-colors text-text placeholder-slate-500",
                    birthdayError ? "border-danger focus:border-danger" : "border-slate-200 dark:border-slate-700 focus:border-primary"
                  )}
                  maxLength={5}
                />
              </div>
              {birthdayError && (
                <div className="flex items-center gap-1 text-danger text-xs mt-2 animate-pulse">
                  <AlertCircle size={12} />
                  <span>{birthdayError}</span>
                </div>
              )}
              <p className="text-[10px] text-muted mt-1 ml-1">Usamos esto para celebrar tu día especial.</p>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold text-text">Preferencias</h3>
              <p className="text-slate-500 dark:text-muted text-sm tracking-wide">Personaliza tu experiencia</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-text">Tema</span>
                <span className="text-xs text-muted">Elige tu estilo visual</span>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={clsx(
                    "p-2 rounded-md transition-all",
                    settings.theme === 'light' ? "bg-white text-orange-500 shadow-sm" : "text-slate-400"
                  )}
                >
                  <Sun size={18} />
                </button>
                <button
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={clsx(
                    "p-2 rounded-md transition-all",
                    settings.theme === 'dark' ? "bg-slate-800 text-blue-400 shadow-sm" : "text-slate-400"
                  )}
                >
                  <Moon size={18} />
                </button>
              </div>
            </div>

            {/* Start Day of Week */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="font-medium text-text">Comienzo de Semana</span>
                <span className="text-xs text-muted">Define el primer día de la semana</span>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => onUpdateSettings({ startDayOfWeek: 0 })}
                  className={clsx(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all",
                    settings.startDayOfWeek === 0 ? "bg-white dark:bg-slate-700 shadow-sm text-text" : "text-slate-500"
                  )}
                >
                  Dom
                </button>
                <button
                  onClick={() => onUpdateSettings({ startDayOfWeek: 1 })}
                  className={clsx(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all",
                    settings.startDayOfWeek === 1 ? "bg-white dark:bg-slate-700 shadow-sm text-text" : "text-slate-500"
                  )}
                >
                  Lun
                </button>
              </div>
            </div>

            {/* Public Holidays Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text">Festivos</span>
                  <Palmtree size={14} className="text-yellow-500" />
                </div>
                <span className="text-xs text-muted">Mostrar festivos en el calendario</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ showHolidays: !settings.showHolidays })}
                className={clsx(
                  "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none",
                  settings.showHolidays ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                )}
              >
                <div
                  className={clsx(
                    "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm",
                    settings.showHolidays ? "translate-x-6" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-violet-500/20 text-violet-500 rounded-xl">
              <Bell size={24} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold text-text">Notificaciones</h3>
              <p className="text-slate-500 dark:text-muted text-sm tracking-wide">Gestiona tus recordatorios</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-text">Recordatorio Diario</span>
                <span className="text-xs text-muted">Recibe una alerta para completar tus hábitos</span>
              </div>
              <button
                onClick={() => {
                  if (!settings.notificationsEnabled && Notification.permission !== 'granted') {
                    requestPermission();
                  } else {
                    handleNotificationToggle();
                  }
                }}
                className={clsx(
                  "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none",
                  settings.notificationsEnabled ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                )}
              >
                <div
                  className={clsx(
                    "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm",
                    settings.notificationsEnabled ? "translate-x-6" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {settings.notificationsEnabled && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-slate-500 dark:text-slate-300 font-medium">
                    <Clock size={18} className="text-slate-400" />
                    Hora del aviso
                  </label>
                  <input
                    type="time"
                    value={settings.notificationTime}
                    onChange={handleTimeChange}
                    className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-primary text-text"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="font-medium text-text">Resumen Semanal</span>
                <span className="text-xs text-muted">Se muestra automáticamente los domingos</span>
              </div>
              <div className="flex items-center gap-2">
                {settings.weeklySummaryEnabled && onShowWeeklySummary && (
                  <button
                    onClick={onShowWeeklySummary}
                    className="text-xs text-primary border border-primary/30 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors font-medium"
                  >
                    Ver ahora
                  </button>
                )}
                <button
                  onClick={() => onUpdateSettings({ weeklySummaryEnabled: !settings.weeklySummaryEnabled })}
                  className={clsx(
                    "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none",
                    settings.weeklySummaryEnabled ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <div
                    className={clsx(
                      "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm",
                      settings.weeklySummaryEnabled ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Monthly Summary quick access */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="font-medium text-text">Resumen Mensual</span>
                <span className="text-xs text-muted">Análisis completo del mes</span>
              </div>
              {onShowMonthlySummary && (
                <button
                  onClick={onShowMonthlySummary}
                  className="text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors font-medium flex items-center gap-1.5"
                >
                  Ver ahora
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-surface border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-500/20 text-slate-500 rounded-xl">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold text-text">Datos</h3>
              <p className="text-slate-500 dark:text-muted text-sm tracking-wide">Importar o exportar tu progreso</p>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Hidden Input */}
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={18} /> Importar CSV
            </button>

            <button
              onClick={() => exportToCSV(habits, logs)}
              className="flex-1 py-3 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} /> Exportar CSV
            </button>
          </div>
          <p className="text-center text-[10px] text-muted mt-3">El CSV debe tener la fecha en la primera columna y los nombres de los hábitos en la cabecera.</p>
        </div>

        <div className="text-center text-xs text-slate-500 dark:text-slate-600 pt-8 font-serif italic">
          Orbit Habits v1.2
        </div>
      </div>
    </div>
  );
};

export default Settings;