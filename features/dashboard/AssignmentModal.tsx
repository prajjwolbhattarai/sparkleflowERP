
import React from 'react';
import { Job, Employee, Client } from '../../types';
import { Card } from '../../components/shared/Card';

interface AssignmentModalProps {
  job: Job;
  employees: Employee[];
  client: Client;
  onClose: () => void;
  onUpdate: (j: Job) => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ job, employees, client, onClose, onUpdate }) => {
  const toggleStaff = (empId: string) => {
    const current = [...job.assignedEmployeeIds];
    const exists = current.includes(empId);
    const updatedIds = exists ? current.filter(id => id !== empId) : [...current, empId];
    onUpdate({
      ...job,
      assignedEmployeeIds: updatedIds,
      status: updatedIds.length > 0 ? 'Assigned' : 'Pending'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Personnel Dispatch</h2>
            <p className="text-xs font-bold text-slate-500">{job.serviceType} &bull; {job.address}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 font-bold text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <h3 className="text-[10px] uppercase font-black text-slate-400 mb-4 tracking-[0.2em]">Deployment-Ready Personnel</h3>
            <div className="space-y-3">
              {employees.map(emp => {
                const isPreferred = client?.preferredEmployeeIds?.includes(emp.id);
                const isRejected = client?.rejectedEmployeeIds?.includes(emp.id);
                const isSelected = job.assignedEmployeeIds.includes(emp.id);
                const hoursRemaining = emp.weeklyHours - emp.hoursWorkedThisWeek;

                return (
                  <div key={emp.id} className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${isRejected ? 'opacity-40 grayscale pointer-events-none' : 'hover:border-sky-300 shadow-sm'} ${isSelected ? 'border-sky-500 bg-sky-50/50' : 'border-slate-100 bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${isSelected ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {emp.lastName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{emp.firstName} {emp.lastName}</span>
                          {isPreferred && <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Preferred</span>}
                          {isRejected && <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Banned</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold">{emp.role} &bull; {emp.location} &bull; {hoursRemaining}h Availability</p>
                      </div>
                    </div>
                    {!isRejected && (
                      <button 
                        onClick={() => toggleStaff(emp.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${isSelected ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-slate-900 text-white hover:bg-black'}`}
                      >
                        {isSelected ? 'Withdraw' : 'Deploy'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 text-right bg-slate-50">
          <button onClick={onClose} className="bg-sky-500 text-white px-10 py-3 rounded-2xl font-black uppercase text-xs hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 tracking-widest">
            Confirm Dispatch
          </button>
        </div>
      </Card>
    </div>
  );
};
