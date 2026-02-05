
import React, { useState, useEffect } from 'react';
import { Job, TimeLog, Employee } from '../../types';
import { Card } from './Card';

interface GlobalTimerProps {
  activeJob: Job | null;
  activeLog: TimeLog | null;
  employee: Employee | null;
  onStart: (jobId: string, type: 'work' | 'travel' | 'break') => void;
  onStop: () => void;
}

export const GlobalTimer: React.FC<GlobalTimerProps> = ({ activeJob, activeLog, employee, onStart, onStop }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
    if (activeLog && !activeLog.end) {
      const startTime = new Date(activeLog.start).getTime();
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeLog]);

  if (!activeJob && !activeLog) return null;

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isBreak = activeLog?.type === 'break';
  const isTravel = activeLog?.type === 'travel';

  return (
    <div className="fixed bottom-6 right-6 z-[200] animate-in slide-in-from-bottom-10">
      <Card className={`p-4 shadow-2xl border-2 w-80 ${isBreak ? 'bg-amber-900 border-amber-500' : 'bg-slate-900 border-sky-500'}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[10px] font-black uppercase text-sky-400 tracking-widest">
              {isBreak ? 'Resting Phase' : isTravel ? 'Transit Phase' : 'Mission Active'}
            </p>
            <p className="text-xs font-bold text-white truncate w-48">{activeJob?.address || 'Floating Entry'}</p>
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase">
             {activeLog?.type}
          </div>
        </div>

        <div className="text-4xl font-black tabular-nums tracking-tighter mb-4 text-center text-white">
          {formatTime(elapsed)}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {!isBreak ? (
            <button 
              onClick={() => onStart(activeJob?.id || '', 'break')}
              className="bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Pause / Break
            </button>
          ) : (
            <button 
              onClick={() => onStart(activeJob?.id || '', 'work')}
              className="bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Resume
            </button>
          )}
          <button 
            onClick={onStop}
            className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
          >
            Clock Out
          </button>
        </div>

        {employee && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase mb-1">
              <span>Weekly Goal</span>
              <span>{employee.hoursWorkedThisWeek.toFixed(1)} / {employee.weeklyHours}h</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${employee.hoursWorkedThisWeek > employee.weeklyHours ? 'bg-red-400' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(100, (employee.hoursWorkedThisWeek / employee.weeklyHours) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
