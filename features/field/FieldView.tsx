
import React, { useState } from 'react';
import { Job, Client, ChecklistItem } from '../../types';
import { Card } from '../../components/shared/Card';
import { Header } from '../../components/layout/Header';
import { Icons } from '../../constants';

interface FieldViewProps {
  jobs: Job[];
  clients: Client[];
  onUpdateJob: (j: Job) => void;
  onClockIn: (jobId: string, type: 'work' | 'travel') => void;
}

export const FieldView: React.FC<FieldViewProps> = ({ jobs, clients, onUpdateJob, onClockIn }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCheck = (job: Job, itemId: string) => {
    const updatedChecklist = job.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateJob({ ...job, checklist: updatedChecklist });
  };

  const filteredJobs = jobs.filter(j => {
    if (j.status === 'Completed') return false;
    const client = clients.find(c => c.id === j.clientId);
    return (
      client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      <Header title="Mission Control" />

      {!selectedJob ? (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <input 
              type="text" 
              placeholder="Search briefing by client or site address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm"
            />
            <div className="absolute left-3.5 top-3.5 text-slate-400">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.length > 0 ? filteredJobs.map(job => {
              const client = clients.find(c => c.id === job.clientId);
              return (
                <Card key={job.id} onClick={() => setSelectedJob(job)} className="p-6 cursor-pointer hover:border-sky-500 transition-all border-l-8 border-slate-900">
                  <div className="flex justify-between items-start mb-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.startTime} &bull; {job.estimatedHours}H</p>
                     {client?.warning && <span className="bg-red-500 text-white p-1 rounded-full animate-pulse"><Icons.Sparkles /></span>}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">{client?.name}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight mb-4">{job.serviceType}</p>
                  <div className="flex items-center gap-2 text-[10px] font-black text-sky-600 uppercase">
                     <Icons.Calendar /> View Checklist ({job.checklist.filter(c => c.completed).length}/{job.checklist.length})
                  </div>
                </Card>
              );
            }) : (
              <div className="col-span-full py-20 text-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No assigned missions matching search</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <button onClick={() => setSelectedJob(null)} className="text-xs font-black text-slate-400 uppercase hover:text-slate-900 transition-all flex items-center gap-2 mb-4">
            &larr; Back to Briefing
          </button>
          
          <Card className="p-10">
            <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-100 pb-8 mb-8 gap-6">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{clients.find(c => c.id === selectedJob.clientId)?.name}</h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{selectedJob.address}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => onClockIn(selectedJob.id, 'travel')}
                  className="bg-slate-100 text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200"
                >
                  Start Travel
                </button>
                <button 
                  onClick={() => onClockIn(selectedJob.id, 'work')}
                  className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/20"
                >
                  Start Mission
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-sky-500 pl-3">Field Intelligence</h3>
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-widest">Site Access Notes</p>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                    "{clients.find(c => c.id === selectedJob.clientId)?.incidentSiteNotes || 'No specific intel for this location.'}"
                  </p>
                </div>
                {clients.find(c => c.id === selectedJob.clientId)?.warning && (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-3xl">
                    <p className="text-[10px] font-black text-red-600 uppercase mb-2 tracking-widest">Danger Warning</p>
                    <p className="text-sm text-red-900 font-bold leading-relaxed">
                      {clients.find(c => c.id === selectedJob.clientId)?.warning}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Required Protocols</h3>
                <div className="space-y-3">
                  {selectedJob.checklist.map(item => (
                    <label key={item.id} className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${item.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white hover:border-slate-300 border-slate-100'}`}>
                      <input 
                        type="checkbox" 
                        checked={item.completed} 
                        onChange={() => toggleCheck(selectedJob, item.id)}
                        className="w-5 h-5 accent-emerald-500"
                      />
                      <span className={`text-sm font-bold ${item.completed ? 'text-emerald-700 line-through opacity-50' : 'text-slate-900'}`}>{item.task}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-slate-900 pl-3 mb-6">Evidence Captures</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-500 transition-all cursor-pointer">
                  <Icons.Sparkles />
                  <span className="text-[10px] font-black uppercase mt-2">Before Photos</span>
                </div>
                <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all cursor-pointer">
                  <Icons.Sparkles />
                  <span className="text-[10px] font-black uppercase mt-2">After Photos</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
