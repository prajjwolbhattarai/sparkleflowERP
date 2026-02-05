
import React, { useState } from 'react';
import { Job, Employee, Client, Absence } from '../../types';
import { Header } from '../../components/layout/Header';
import { Icons } from '../../constants';
import { CalendarWidget } from './CalendarWidget';
import { JobArchitectureModal } from '../jobs/JobArchitectureModal';

interface DashboardViewProps {
  jobs: Job[];
  employees: Employee[];
  clients: Client[];
  absences: Absence[];
  onUpdateJob: (j: Job) => void;
  onAddJobs: (j: Job[]) => void;
  onDeleteJob?: (id: string) => void;
  setView: (v: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ jobs, employees, clients, absences, onUpdateJob, setView }) => {
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Header title="Mission Control Hub" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => setView('crm')} className="group flex items-center justify-between p-6 bg-slate-900 text-white rounded-3xl hover:bg-black transition-all shadow-xl shadow-slate-900/20">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 mb-1">CRM Workflow</p>
            <h3 className="text-lg font-black">Register New Client</h3>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><Icons.Plus /></div>
        </button>
        <button onClick={() => setView('employees')} className="group flex items-center justify-between p-6 bg-emerald-600 text-white rounded-3xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200 mb-1">HR Workflow</p>
            <h3 className="text-lg font-black">Recruit New Employee</h3>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><Icons.Users /></div>
        </button>
        <button onClick={() => setView('jobs')} className="group flex items-center justify-between p-6 bg-sky-500 text-white rounded-3xl hover:bg-sky-600 transition-all shadow-xl shadow-sky-500/20">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-100 mb-1">Ops Workflow</p>
            <h3 className="text-lg font-black">Create Work Order</h3>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><Icons.Calendar /></div>
        </button>
      </div>

      <div className="flex justify-between items-center mb-4 text-slate-900">
        <h2 className="text-xl font-black uppercase tracking-tight">Mission Schedule</h2>
      </div>

      <CalendarWidget jobs={jobs} clients={clients} employees={employees} absences={absences} onUpdateJob={onUpdateJob} onEditJob={(job) => setEditingJob(job)} />

      {editingJob && (
        <JobArchitectureModal 
          job={editingJob}
          clients={clients}
          employees={employees}
          absences={absences}
          allJobs={jobs}
          onClose={() => setEditingJob(null)}
          onUpdate={onUpdateJob}
        />
      )}
    </div>
  );
};
