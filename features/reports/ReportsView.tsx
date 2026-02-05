
import React from 'react';
import { Job, TimeLog, Employee, Client } from '../../types';
import { Card } from '../../components/shared/Card';
import { Header } from '../../components/layout/Header';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from 'recharts';

interface ReportsViewProps {
  jobs: Job[];
  timeLogs: TimeLog[];
  employees: Employee[];
  clients: Client[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ jobs, timeLogs, employees, clients }) => {
  
  const calculateActualHours = (jobId: string) => {
    const logs = timeLogs.filter(l => l.jobId === jobId && l.type === 'work' && l.end);
    return logs.reduce((acc, log) => {
      const diff = new Date(log.end!).getTime() - new Date(log.start).getTime();
      return acc + (diff / 3600000);
    }, 0);
  };

  const profitabilityData = jobs.filter(j => j.status === 'Completed').map(job => {
    const actual = calculateActualHours(job.id);
    const estimated = job.estimatedHours;
    const efficiency = estimated - actual;
    return {
      name: clients.find(c => c.id === job.clientId)?.shortName || 'Unknown',
      efficiency: parseFloat(efficiency.toFixed(2)),
      actual: parseFloat(actual.toFixed(2)),
      estimated: parseFloat(estimated.toFixed(2))
    };
  });

  const payrollData = employees.map(emp => {
    const empLogs = timeLogs.filter(l => l.employeeId === emp.id && l.end);
    const workHrs = empLogs.filter(l => l.type === 'work').reduce((a, b) => a + (new Date(b.end!).getTime() - new Date(b.start).getTime())/3600000, 0);
    const travelHrs = empLogs.filter(l => l.type === 'travel').reduce((a, b) => a + (new Date(b.end!).getTime() - new Date(b.start).getTime())/3600000, 0);
    const totalPay = (workHrs + travelHrs) * emp.hourlyRate;
    return { emp, workHrs, travelHrs, totalPay };
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      <Header title="Intelligence Terminal" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-sky-500 pl-3">Efficiency Variance (Hrs Saved)</h3>
            <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded">Real-time Data</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitabilityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Bar dataKey="efficiency" name="Hours Under Estimate">
                  {profitabilityData.map((entry, index) => (
                    <Cell key={index} fill={entry.efficiency >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-3 mb-8">Approval Manifest (Payroll)</h3>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                   <th className="pb-4">Employee</th>
                   <th className="pb-4">Work</th>
                   <th className="pb-4">Travel</th>
                   <th className="pb-4 text-right">Liability</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {payrollData.map(({ emp, workHrs, travelHrs, totalPay }) => (
                   <tr key={emp.id} className="text-sm font-bold text-slate-900">
                     <td className="py-4">
                       <p>{emp.firstName} {emp.lastName}</p>
                       <p className="text-[10px] text-slate-400 uppercase">{emp.role}</p>
                     </td>
                     <td className="py-4 tabular-nums">{workHrs.toFixed(1)}h</td>
                     <td className="py-4 tabular-nums text-slate-400">{travelHrs.toFixed(1)}h</td>
                     <td className="py-4 text-right tabular-nums text-emerald-600 font-black">${totalPay.toFixed(2)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
          <button className="w-full mt-6 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
            Export Payroll to CSV
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Status Map</p>
          <div className="space-y-4">
             {employees.map(emp => {
               const active = timeLogs.find(l => l.employeeId === emp.id && !l.end);
               return (
                 <div key={emp.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-xs font-bold text-slate-700">{emp.lastName}</span>
                    {active && <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase">{active.type}</span>}
                 </div>
               );
             })}
          </div>
        </Card>
      </div>
    </div>
  );
};
