
import React, { useState, useEffect, useMemo } from 'react';
import { Job, Employee, Client, Absence, ServiceType } from '../../types';
import { Card } from '../../components/shared/Card';
import { Icons } from '../../constants';

interface JobArchitectureModalProps {
  job: Partial<Job>;
  clients: Client[];
  employees: Employee[];
  absences: Absence[];
  allJobs: Job[]; // For conflict checking and frequency tracking
  onClose: () => void;
  onUpdate: (j: Job) => void;
}

export const JobArchitectureModal: React.FC<JobArchitectureModalProps> = ({ 
  job, 
  clients, 
  employees, 
  absences, 
  allJobs, 
  onClose, 
  onUpdate 
}) => {
  const [editingJob, setEditingJob] = useState<Partial<Job>>(job);

  useEffect(() => {
    setEditingJob(job);
  }, [job]);

  // --- Fleet Intelligence Engine ---

  const calculateFitScore = (emp: Employee, j: Partial<Job>) => {
    if (!j.scheduledDate || !j.startTime) return 0;
    
    // 1. HARD DISQUALIFIERS
    const jobDateObj = new Date(j.scheduledDate);
    const jobDayName = jobDateObj.toLocaleDateString('en-US', { weekday: 'long' });

    // Availability during the day (leave)
    const onLeave = absences.some(a => a.employeeId === emp.id && j.scheduledDate! >= a.startDate && j.scheduledDate! <= a.endDate);
    if (onLeave) return -1;
    
    // Time Conflict (already working at this time)
    const timeConflict = allJobs.some(existingJob => 
      existingJob.assignedEmployeeIds.includes(emp.id) && 
      existingJob.scheduledDate === j.scheduledDate && 
      existingJob.startTime === j.startTime && 
      existingJob.id !== j.id &&
      existingJob.status !== 'Cancelled'
    );
    if (timeConflict) return -1;

    const client = clients.find(c => c.id === j.clientId);
    if (client?.rejectedEmployeeIds.includes(emp.id)) return -1;

    let score = 0;

    // 2. FACTOR: Preference Alignment (Working Days and Hours)
    // Range 0-40
    if (emp.preferredWorkingDays?.includes(jobDayName)) {
      score += 20; // Preferred day match
    }

    if (emp.preferredWorkingHoursStart && emp.preferredWorkingHoursEnd) {
      if (j.startTime >= emp.preferredWorkingHoursStart && j.startTime <= emp.preferredWorkingHoursEnd) {
        score += 20; // Preferred hour match
      }
    }

    // 3. FACTOR: Least hours worked this week
    // Range 0-30
    const weeklyUtilization = emp.hoursWorkedThisWeek / emp.weeklyHours;
    score += (1 - Math.min(weeklyUtilization, 1)) * 30;

    // 4. FACTOR: Frequency (Historical Visits)
    // Range 0-40
    const historicalVisits = allJobs.filter(prevJob => 
      prevJob.clientId === j.clientId && 
      prevJob.assignedEmployeeIds.includes(emp.id) && 
      prevJob.status === 'Completed'
    ).length;
    score += Math.min(historicalVisits * 4, 40);

    // 5. FACTOR: Location Optimization
    // Range 0-30
    const dailySchedule = allJobs
      .filter(oj => oj.scheduledDate === j.scheduledDate && oj.assignedEmployeeIds.includes(emp.id) && oj.id !== j.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const prevJobs = dailySchedule.filter(sj => sj.startTime < j.startTime!);
    const lastJob = prevJobs[prevJobs.length - 1];
    let sourceAddress = lastJob ? lastJob.address : emp.street + ", " + emp.city;
    
    const currentLoc = j.address?.toLowerCase() || "";
    const sourceLoc = sourceAddress.toLowerCase();
    
    if (sourceLoc.includes(currentLoc.split(',')[0]) || currentLoc.includes(sourceLoc.split(',')[0])) {
      score += 30;
    } else if (sourceLoc.split(' ')[0] === currentLoc.split(' ')[0]) {
      score += 15;
    }

    return Math.max(0, Math.min(140, score)); // Max score increased slightly with preference bonus
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setEditingJob({
        ...editingJob,
        clientId,
        address: `${client.street}, ${client.zipCity}${client.addressSuffix ? ' (' + client.addressSuffix + ')' : ''}`,
        startTime: client.recommendedStartTime || editingJob.startTime || '08:00',
        estimatedHours: client.recommendedHours || editingJob.estimatedHours || 2,
        staffNeeded: client.staffNeeded || 1,
        serviceType: (client.customerType === 'Company' ? 'Commercial' : 'Regular') as ServiceType
      });
    } else {
      setEditingJob({ ...editingJob, clientId });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalJob = {
      ...editingJob,
      id: editingJob.id || Math.random().toString(36).substr(2, 9),
      status: (editingJob.assignedEmployeeIds?.length || 0) > 0 ? 'Assigned' : (editingJob.status || 'Pending'),
      staffNeeded: editingJob.staffNeeded || 1
    } as Job;
    onUpdate(finalJob);
    onClose();
  };

  const toggleEmployee = (empId: string, isDisabled: boolean) => {
    if (isDisabled) return;
    const current = editingJob.assignedEmployeeIds || [];
    const updated = current.includes(empId) ? current.filter(id => id !== empId) : [...current, empId];
    setEditingJob({ ...editingJob, assignedEmployeeIds: updated });
  };

  const autoSelectStaff = () => {
    const candidates = employees
      .map(e => ({ e, score: calculateFitScore(e, editingJob) }))
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score);

    const neededCount = editingJob.staffNeeded || 1;
    const topSelections = candidates.slice(0, neededCount).map(c => c.e.id);
    
    setEditingJob({
      ...editingJob,
      assignedEmployeeIds: topSelections
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl shadow-2xl overflow-hidden border-none flex flex-col max-h-[95vh] bg-white">
        <form onSubmit={handleSave} className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-sky-500 rounded-xl text-white"><Icons.Calendar /></div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Job Architecture Explorer</h2>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 text-3xl font-light hover:text-slate-900 transition-colors">&times;</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-sky-500 pl-4">Mission Parameters</h3>
                
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Customer Entity</label>
                    <select required className="w-full border-slate-200 border p-4 rounded-xl text-sm bg-white font-bold" value={editingJob.clientId} onChange={e => handleClientChange(e.target.value)}>
                      <option value="">Select Account</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Deployment Date</label>
                      <input type="date" required className="w-full border-slate-200 border p-3 rounded-xl text-sm bg-white font-black" value={editingJob.scheduledDate} onChange={e => setEditingJob({...editingJob, scheduledDate: e.target.value})} />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Start Time</label>
                      <input type="time" required className="w-full border-slate-200 border p-3 rounded-xl text-sm bg-white font-black text-sky-600" value={editingJob.startTime} onChange={e => setEditingJob({...editingJob, startTime: e.target.value})} />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Tactical Site Address</label>
                    <input required className="w-full border-slate-200 border p-3 rounded-xl text-sm bg-white font-bold" value={editingJob.address} onChange={e => setEditingJob({...editingJob, address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-1 lg:col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Protocol</label>
                      <select required className="w-full border-slate-200 border p-3 rounded-xl text-xs bg-white font-bold" value={editingJob.serviceType} onChange={e => setEditingJob({...editingJob, serviceType: e.target.value as ServiceType})}>
                        <option value="Regular">Regular</option>
                        <option value="Deep Clean">Deep Clean</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Window Cleaning">Window Cleaning</option>
                      </select>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Hours</label>
                      <input type="number" step="0.5" min="0.5" required className="w-full border-slate-200 border p-3 rounded-xl text-sm bg-white font-black text-sky-600" value={editingJob.estimatedHours} onChange={e => setEditingJob({...editingJob, estimatedHours: parseFloat(e.target.value)})} />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Staff Count</label>
                      <input type="number" min="1" required className="w-full border-slate-200 border p-3 rounded-xl text-sm bg-white font-black text-emerald-600" value={editingJob.staffNeeded} onChange={e => setEditingJob({...editingJob, staffNeeded: parseInt(e.target.value)})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">Fleet Intelligence</h3>
                  <button type="button" onClick={autoSelectStaff} className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all">Auto-Select {editingJob.staffNeeded || 1} Staff</button>
                </div>
                <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 max-h-[450px] overflow-y-auto space-y-4 shadow-inner scrollbar-hide">
                  {employees.map(emp => {
                    const score = calculateFitScore(emp, editingJob);
                    const isDisabled = score === -1;
                    const isSelected = editingJob.assignedEmployeeIds?.includes(emp.id);

                    return (
                      <div key={emp.id} onClick={() => toggleEmployee(emp.id, isDisabled)} className={`group relative flex flex-col p-5 rounded-3xl transition-all border-2 ${isDisabled ? 'opacity-20 grayscale cursor-not-allowed bg-slate-100 border-transparent' : isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-x-2' : 'bg-white border-slate-100 text-slate-900 hover:border-emerald-300 hover:shadow-lg cursor-pointer'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>{emp.lastName[0]}</div>
                            <div><p className="text-[12px] font-black uppercase tracking-tight leading-none">{emp.firstName} {emp.lastName}</p><p className="text-[9px] font-bold mt-1 text-slate-400">{emp.role}</p></div>
                          </div>
                          {!isDisabled && (
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${score > 75 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{Math.round(score)} Fit Score</span>
                            </div>
                          )}
                        </div>
                        {!isDisabled && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter">
                              <span>Weekly Load: {emp.hoursWorkedThisWeek.toFixed(1)}h</span>
                              <span className="opacity-50">Freq: {allJobs.filter(pj => pj.clientId === editingJob.clientId && pj.assignedEmployeeIds.includes(emp.id) && pj.status === 'Completed').length}</span>
                            </div>
                            <div className={`h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-white/10' : 'bg-slate-100'}`}>
                              <div className={`h-full transition-all duration-1000 ${emp.hoursWorkedThisWeek / emp.weeklyHours > 0.9 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${(emp.hoursWorkedThisWeek / emp.weeklyHours) * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase text-slate-400 tracking-widest">Discard</button>
            <button type="submit" className="px-14 py-4 bg-slate-900 text-white rounded-[28px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:-translate-y-1 active:scale-95">Commit Dispatch & Architecture</button>
          </div>
        </form>
      </Card>
    </div>
  );
};
