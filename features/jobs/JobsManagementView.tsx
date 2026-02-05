
import React, { useState } from 'react';
import { Job, Client, Employee, Absence, JobStatus } from '../../types';
import { Card } from '../../components/shared/Card';
import { Header } from '../../components/layout/Header';
import { Icons } from '../../constants';
import { JobArchitectureModal } from './JobArchitectureModal';

interface JobsManagementViewProps {
  jobs: Job[];
  clients: Client[];
  employees: Employee[];
  absences: Absence[];
  onAddJobs: (j: Job[]) => void;
  onUpdateJob: (j: Job) => void;
  onDeleteJob: (id: string) => void;
}

export const JobsManagementView: React.FC<JobsManagementViewProps> = ({ jobs, clients, employees, absences, onAddJobs, onUpdateJob, onDeleteJob }) => {
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  // Bulk Selection State
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isMassEditOpen, setIsMassEditOpen] = useState(false);
  const [massEditData, setMassEditData] = useState({ newStartTime: '', newEstimatedHours: 0, newDate: '' });

  // Filter States
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');

  // --- Intelligence Engine Logic (Local Copy for Autonomous Dispatch) ---
  const calculateFitScore = (emp: Employee, job: Partial<Job>) => {
    if (!job.scheduledDate) return 0;
    const onLeave = absences.some(a => a.employeeId === emp.id && job.scheduledDate! >= a.startDate && job.scheduledDate! <= a.endDate);
    if (onLeave) return -1;
    const timeConflict = jobs.some(j => j.assignedEmployeeIds.includes(emp.id) && j.scheduledDate === job.scheduledDate && j.startTime === job.startTime && j.id !== job.id);
    if (timeConflict) return -1;
    const remainingHours = emp.weeklyHours - emp.hoursWorkedThisWeek;
    if (remainingHours < (job.estimatedHours || 0)) return -1;
    let score = 50; 
    if (job.address?.toLowerCase().includes(emp.location.toLowerCase())) score += 30;
    const utilization = emp.hoursWorkedThisWeek / emp.weeklyHours;
    score += (1 - utilization) * 20;
    const client = clients.find(c => c.id === job.clientId);
    if (client?.preferredEmployeeIds.includes(emp.id)) score += 25;
    if (client?.rejectedEmployeeIds.includes(emp.id)) score -= 100;
    return Math.max(0, Math.min(100, score));
  };

  const autonomousDispatch = () => {
    const targets = jobs.filter(j => selectedJobIds.includes(j.id) && j.status === 'Pending');
    if (targets.length === 0) {
      alert("No pending missions selected for autonomous dispatch.");
      return;
    }

    if (confirm(`INITIATE AUTONOMOUS DISPATCH: System will now pair ${targets.length} missions with optimal personnel. Proceed?`)) {
      targets.forEach(job => {
        const candidates = employees
          .map(e => ({ emp: e, score: calculateFitScore(e, job) }))
          .filter(c => c.score > 40)
          .sort((a, b) => b.score - a.score);

        if (candidates.length > 0) {
          const best = candidates[0].emp;
          onUpdateJob({
            ...job,
            assignedEmployeeIds: [best.id],
            status: 'Assigned'
          });
        }
      });
      setSelectedJobIds([]);
      alert("Autonomous dispatch routine complete.");
    }
  };

  const handleSaveJob = (job: Job) => {
    const exists = jobs.some(j => j.id === job.id);
    if (exists) {
      onUpdateJob(job);
    } else {
      onAddJobs([job]);
    }
    setEditingJob(null);
  };

  const toggleJobSelection = (id: string) => {
    setSelectedJobIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAllSelection = (currentJobs: Job[]) => {
    if (selectedJobIds.length === currentJobs.length) setSelectedJobIds([]);
    else setSelectedJobIds(currentJobs.map(j => j.id));
  };

  const handleMassUpdate = () => {
    if (selectedJobIds.length === 0) return;
    if (confirm(`MASS OPERATION: Update ${selectedJobIds.length} orders?`)) {
      selectedJobIds.forEach(id => {
        const job = jobs.find(j => j.id === id);
        if (job) {
          const updated = { ...job };
          if (massEditData.newStartTime) updated.startTime = massEditData.newStartTime;
          if (massEditData.newEstimatedHours > 0) updated.estimatedHours = massEditData.newEstimatedHours;
          if (massEditData.newDate) updated.scheduledDate = massEditData.newDate;
          onUpdateJob(updated);
        }
      });
      setIsMassEditOpen(false);
      setSelectedJobIds([]);
    }
  };

  const getStatusStyle = (status: JobStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Assigned': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'In Progress': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchesArchive = showArchived ? j.isArchived : !j.isArchived;
    const matchesType = typeFilter === 'All' || j.serviceType === typeFilter;
    const matchesStatus = statusFilter === 'All' || j.status === statusFilter;
    const matchesClient = clientFilter === 'All' || j.clientId === clientFilter;
    return matchesArchive && matchesType && matchesStatus && matchesClient;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <Header title="Work Orders" />
        <div className="flex gap-4">
          {selectedJobIds.length > 0 && (
            <>
              <button onClick={autonomousDispatch} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 shadow-xl border-2 border-emerald-400/20">
                <Icons.Sparkles /> Auto-Dispatch Fleet
              </button>
              <button onClick={() => setIsMassEditOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black shadow-xl">
                Bulk Strategic Edit
              </button>
            </>
          )}
          <button onClick={() => setEditingJob({})} className="bg-sky-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-sky-600 shadow-xl">
            <Icons.Plus /> New Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Account Filter</label>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none">
            <option value="All">All Active Accounts</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.shortName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Service Line</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none">
            <option value="All">All Service Types</option>
            <option value="Regular">Regular</option>
            <option value="Deep Clean">Deep Clean</option>
            <option value="Commercial">Commercial</option>
            <option value="Window Cleaning">Window Cleaning</option>
          </select>
        </div>
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Workflow Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none">
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className="flex items-end pb-1 gap-4">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 cursor-pointer mb-2 ml-1">
            <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="w-4 h-4 accent-sky-500" />
            Show Hidden
          </label>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                <th className="px-6 py-5 w-10 text-center">
                  <input type="checkbox" className="w-4 h-4 accent-slate-900 rounded cursor-pointer" checked={filteredJobs.length > 0 && selectedJobIds.length === filteredJobs.length} onChange={() => toggleAllSelection(filteredJobs)} />
                </th>
                <th className="px-6 py-5">Shift / Start</th>
                <th className="px-6 py-5">Service Type</th>
                <th className="px-6 py-5">Account & Location</th>
                <th className="px-6 py-5">Personnel Assigned</th>
                <th className="px-6 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.length > 0 ? filteredJobs.slice().sort((a,b) => a.scheduledDate.localeCompare(b.scheduledDate)).map(job => {
                const client = clients.find(c => c.id === job.clientId);
                const isSelected = selectedJobIds.includes(job.id);
                return (
                  <tr key={job.id} className={`hover:bg-slate-50/50 transition-colors ${job.isArchived ? 'opacity-40 grayscale' : ''} ${isSelected ? 'bg-sky-50/20' : ''}`}>
                    <td className="px-6 py-5 text-center">
                      <input type="checkbox" className="w-4 h-4 accent-slate-900 rounded cursor-pointer" checked={isSelected} onChange={() => toggleJobSelection(job.id)} />
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900">{job.scheduledDate}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{job.startTime}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${getStatusStyle(job.status)}`}>
                        {job.serviceType}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black truncate w-48 text-slate-900">{client?.name || 'Account Missing'}</p>
                      <p className="text-[10px] text-slate-400 font-bold truncate w-56 uppercase tracking-tighter">{job.address}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {job.assignedEmployeeIds.length > 0 ? job.assignedEmployeeIds.map(eid => (
                          <div key={eid} className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded text-[10px] font-black border border-sky-100 uppercase">
                            {employees.find(e => e.id === eid)?.lastName || 'N/A'}
                          </div>
                        )) : (
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right space-x-2">
                      <button onClick={() => setEditingJob(job)} className="bg-slate-100 hover:bg-slate-900 hover:text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200 transition-all">Dispatch</button>
                      <button onClick={() => setEditingJob(job)} className="text-sky-600 font-black text-[8px] uppercase hover:underline">Edit</button>
                      <button onClick={() => { if(confirm('Delete Order?')) onDeleteJob(job.id) }} className="text-red-400 font-black text-[8px] uppercase hover:underline">Delete</button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-[10px] font-black text-slate-300 uppercase">No active missions matching filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mass Edit Strategic Terminal */}
      {isMassEditOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
          <Card className="w-full max-w-xl shadow-2xl overflow-hidden border-none p-10 space-y-8 bg-white rounded-[40px]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6 text-slate-900">
              <h2 className="text-2xl font-black uppercase tracking-tight">Bulk Strategic Terminal</h2>
              <button onClick={() => setIsMassEditOpen(false)} className="text-slate-400 text-4xl font-light hover:text-slate-900 transition-colors">&times;</button>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Global Displacement Date</label>
                <input type="date" className="w-full border-slate-200 border p-4 rounded-2xl text-sm bg-white font-black" value={massEditData.newDate} onChange={e => setMassEditData({...massEditData, newDate: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Batch Start Time</label>
                  <input type="time" className="w-full border-slate-200 border p-4 rounded-2xl text-sm bg-white font-black text-sky-600" value={massEditData.newStartTime} onChange={e => setMassEditData({...massEditData, newStartTime: e.target.value})} />
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Batch Duration (H)</label>
                  <input type="number" step="0.5" className="w-full border-slate-200 border p-4 rounded-2xl text-sm bg-white font-black text-sky-600" value={massEditData.newEstimatedHours} onChange={e => setMassEditData({...massEditData, newEstimatedHours: parseFloat(e.target.value)})} />
                </div>
              </div>
            </div>
            <button onClick={handleMassUpdate} className="w-full py-5 bg-slate-900 text-white rounded-[32px] text-[12px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all">
              Apply Strategic Update to Selected
            </button>
          </Card>
        </div>
      )}

      {editingJob && (
        <JobArchitectureModal 
          job={editingJob}
          clients={clients}
          employees={employees}
          absences={absences}
          allJobs={jobs}
          onClose={() => setEditingJob(null)}
          onUpdate={handleSaveJob}
        />
      )}
    </div>
  );
};
