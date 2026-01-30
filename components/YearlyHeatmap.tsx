import React, { useMemo } from 'react';
import { Habit, DailyLog } from '../types';
import { getYearlyHeatmapData } from '../utils';
import clsx from 'clsx';
import { Tooltip as ReactTooltip } from 'recharts'; // reusing Recharts tooltip logic logic slightly modified or custom

interface YearlyHeatmapProps {
  habits: Habit[];
  logs: { [habitId: string]: DailyLog };
}

const YearlyHeatmap: React.FC<YearlyHeatmapProps> = ({ habits, logs }) => {
  const data = useMemo(() => getYearlyHeatmapData(habits, logs), [habits, logs]);
  
  // Group by weeks for the grid layout
  // We need to organize data into columns (weeks) and rows (days 0-6)
  const weeks = useMemo(() => {
    const result: { date: Date; intensity: number; count: number }[][] = [];
    let currentWeek: { date: Date; intensity: number; count: number }[] = [];
    
    // Fill empty days for the first week if Jan 1st isn't Sunday
    if (data.length > 0) {
        const firstDay = data[0].date.getDay(); // 0 = Sun
        for (let i = 0; i < firstDay; i++) {
            currentWeek.push({ date: new Date(0), intensity: -1, count: 0 }); // Placeholder
        }
    }

    data.forEach((day) => {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            result.push(currentWeek);
            currentWeek = [];
        }
    });
    
    // Push incomplete last week
    if (currentWeek.length > 0) {
        result.push(currentWeek);
    }
    
    return result;
  }, [data]);

  const getIntensityColor = (intensity: number) => {
      switch(intensity) {
          case -1: return 'transparent'; // Placeholder
          case 0: return 'bg-slate-800/50 border border-slate-700/30';
          case 1: return 'bg-primary/20 border border-primary/30';
          case 2: return 'bg-primary/50 border border-primary/60';
          case 3: return 'bg-primary/80 border border-primary/90 shadow-[0_0_5px_rgba(201,162,77,0.5)]';
          case 4: return 'bg-primary border border-white/20 shadow-[0_0_10px_rgba(201,162,77,0.8)]';
          default: return 'bg-slate-800';
      }
  };

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-2">
      <div className="flex gap-1 min-w-max">
          {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-1">
                  {week.map((day, dIndex) => (
                      <div 
                        key={`${wIndex}-${dIndex}`}
                        className={clsx(
                            "w-3 h-3 rounded-sm transition-all duration-300 hover:scale-125 relative group",
                            getIntensityColor(day.intensity)
                        )}
                      >
                         {/* Simple Tooltip */}
                         {day.intensity !== -1 && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 border border-slate-700 text-[10px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                                {day.date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}: {day.count}
                            </div>
                         )}
                      </div>
                  ))}
              </div>
          ))}
      </div>
      <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-[10px] text-muted">Enero</span>
          <div className="flex items-center gap-1 text-[10px] text-muted">
              <span>Menos</span>
              <div className="w-2 h-2 rounded-sm bg-slate-800/50"></div>
              <div className="w-2 h-2 rounded-sm bg-primary/20"></div>
              <div className="w-2 h-2 rounded-sm bg-primary/50"></div>
              <div className="w-2 h-2 rounded-sm bg-primary/80"></div>
              <div className="w-2 h-2 rounded-sm bg-primary"></div>
              <span>Más</span>
          </div>
      </div>
    </div>
  );
};

export default YearlyHeatmap;