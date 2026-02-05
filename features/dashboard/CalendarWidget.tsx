
import React, { useState } from 'react';
import { Job, Client, Employee, Absence, JobStatus } from '../../types';
import { Card } from '../../components/shared/Card';

interface CalendarWidgetProps {
  jobs: Job[];
  clients: Client[];
  employees: Employee[];
  absences: Absence[];
  onUpdateJob: (j: Job) => void;
  onEditJob: (j: Job) => void; // Added callback to open edit modal
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ jobs, clients, employees, absences, onUpdateJob, onEditJob }) => {
  const [viewMode, setViewMode] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatDateISO = (date: Date) => date.toISOString().split('T')[0];

  const navigate = (direction: number) => {
    const next = new Date(currentDate);
    if (viewMode === 'Daily') next.setDate(next.getDate() + direction);
    if (viewMode === 'Weekly') next.setDate(next.getDate() + direction * 7);
    if (viewMode === 'Monthly') next.setMonth(next.getMonth() + direction);
    setCurrentDate(next);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode('Daily');
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Assigned': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const renderJobCard = (job: Job) => {
    const client = clients.find(c => c.id === job.clientId);
    return (
      <div 
        key={job.id} 
        onClick={(e) => { e.stopPropagation(); onEditJob(job); }}
        className={`p-2 mb-1.5 rounded-lg border text-[10px] font-bold shadow-sm transition-all truncate cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-sky-400 ${getStatusColor(job.status)}`}
      >
        <div className="flex justify-between items-center">
          <span className="truncate">{client?.shortName || 'Unknown'}</span>
          <span className="opacity-60 tabular-nums">{job.startTime}</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white border-dashed shadow-inner">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 font-black">&larr;</button>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
            {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric', day: viewMode !== 'Monthly' ? 'numeric' : undefined })}
          </h2>
          <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 font-black">&rarr;</button>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {['Daily', 'Weekly', 'Monthly'].map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m as any)}
              className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === m ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {viewMode === 'Weekly' && (
          <div className="grid grid-cols-7 h-full">
            {Array.from({ length: 7 }).map((_, i) => {
              const day = new Date(currentDate);
              day.setDate(day.getDate() + (i - day.getDay())); 
              const dateStr = formatDateISO(day);
              const dayJobs = jobs.filter(j => j.scheduledDate === dateStr);

              return (
                <div key={i} className={`border-r border-slate-100 last:border-0 p-3 min-h-[400px] flex flex-col ${formatDateISO(new Date()) === dateStr ? 'bg-sky-50/30' : ''}`}>
                  <div className="mb-4 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase">{day.toLocaleDateString('default', { weekday: 'short' })}</p>
                    <p className="text-sm font-black text-slate-900">{day.getDate()}</p>
                  </div>
                  <div className="flex-1">
                    {dayJobs.map(renderJobCard)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'Monthly' && (
          <div className="grid grid-cols-7 auto-rows-fr h-full">
             {Array.from({ length: 35 }).map((_, i) => {
               const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
               const day = new Date(firstOfMonth);
               day.setDate(1 - firstOfMonth.getDay() + i);
               const dateStr = formatDateISO(day);
               const dayJobs = jobs.filter(j => j.scheduledDate === dateStr);
               const isCurrentMonth = day.getMonth() === currentDate.getMonth();

               return (
                 <div 
                   key={i} 
                   onClick={() => handleDayClick(day)}
                   className={`border-r border-b border-slate-50 p-2 min-h-[100px] cursor-pointer transition-colors hover:bg-slate-50 ${!isCurrentMonth ? 'bg-slate-50/20 opacity-30' : ''}`}
                 >
                    <span className="text-[9px] font-black text-slate-400">{day.getDate()}</span>
                    <div className="mt-1 space-y-1">
                      {dayJobs.slice(0, 3).map(j => (
                        <div key={j.id} className="h-1 rounded-full bg-sky-400 w-full opacity-60"></div>
                      ))}
                      {dayJobs.length > 3 && <p className="text-[8px] font-black text-slate-400">+{dayJobs.length - 3} more</p>}
                    </div>
                 </div>
               );
             })}
          </div>
        )}

        {viewMode === 'Daily' && (
          <div className="p-4">
             {jobs.filter(j => j.scheduledDate === formatDateISO(currentDate)).length > 0 ? (
               <div className="space-y-2">
                 {jobs.filter(j => j.scheduledDate === formatDateISO(currentDate)).map(job => (
                   <div 
                    key={job.id} 
                    onClick={() => onEditJob(job)}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white shadow-sm cursor-pointer hover:border-sky-500 transition-all"
                   >
                      <div className="flex items-center gap-4">
                        <div className="text-xs font-black text-slate-900">{job.startTime}</div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{clients.find(c => c.id === job.clientId)?.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{job.serviceType}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${getStatusColor(job.status)}`}>{job.status}</span>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="h-40 flex items-center justify-center text-slate-300 font-black uppercase text-[10px] tracking-widest">No Missions Scheduled</div>
             )}
          </div>
        )}
      </div>
    </Card>
  );
};
