
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, PayrollRecord } from '../../../types';
import { Card } from '../../../components/shared/Card';
import { Header } from '../../../components/layout/Header';
import { Icons } from '../../../constants';

interface PayrollManagementProps {
  employees: Employee[];
  payrollHistory: PayrollRecord[];
  onAddPayrollRecord: (record: PayrollRecord) => void;
  onUpdatePayrollRecord: (record: PayrollRecord) => void;
}

export const PayrollManagement: React.FC<PayrollManagementProps> = ({ 
  employees, 
  payrollHistory, 
  onAddPayrollRecord,
  onUpdatePayrollRecord
}) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [viewingStub, setViewingStub] = useState<PayrollRecord | null>(null);
  const [editRecord, setEditRecord] = useState<PayrollRecord | null>(null);

  const calculatePayrollForEmployee = (emp: Employee): PayrollRecord => {
    const hours = emp.hoursWorkedThisWeek;
    const baseHours = Math.min(hours, 40);
    const otHours = Math.max(hours - 40, 0);
    const basePay = baseHours * emp.hourlyRate;
    const otPay = otHours * (emp.hourlyRate * 1.5);
    const bonus = emp.reliabilityScore > 95 ? 50 : 0;
    const gross = basePay + otPay + bonus;
    const tax = gross * 0.20;

    return {
      id: `pay-${emp.id}-pending`,
      employeeId: emp.id,
      periodStart: startDate,
      periodEnd: endDate,
      baseHours,
      overtimeHours: otHours,
      basePay,
      overtimePay: otPay,
      bonus,
      adjustmentAmount: 0,
      adjustmentNote: '',
      grossPay: gross,
      taxAmount: tax,
      netPay: gross - tax,
      status: 'Draft'
    };
  };

  const [pendingRecords, setPendingRecords] = useState<PayrollRecord[]>([]);

  useEffect(() => {
    if (activeTab === 'pending') {
      setPendingRecords(employees.map(emp => calculatePayrollForEmployee(emp)));
    }
  }, [employees, startDate, endDate, activeTab]);

  const filteredHistory = useMemo(() => {
    return payrollHistory.filter(r => r.periodEnd >= startDate && r.periodStart <= endDate);
  }, [payrollHistory, startDate, endDate]);

  const totalLiability = useMemo(() => {
    const activeList = activeTab === 'pending' ? pendingRecords : filteredHistory;
    return activeList.reduce((sum, p) => sum + p.netPay, 0);
  }, [pendingRecords, filteredHistory, activeTab]);

  const handleUpdatePending = (updated: PayrollRecord) => {
    const gross = updated.basePay + updated.overtimePay + updated.bonus + updated.adjustmentAmount;
    const tax = gross * 0.20;
    const final = {
      ...updated,
      grossPay: gross,
      taxAmount: tax,
      netPay: gross - tax
    };
    setPendingRecords(prev => prev.map(r => r.id === final.id ? final : r));
    setEditRecord(null);
  };

  const handleApproveAll = () => {
    if (confirm(`Authorize disbursement for ${pendingRecords.length} employees?`)) {
      pendingRecords.forEach(p => {
        onAddPayrollRecord({ 
          ...p, 
          id: `pay-${p.employeeId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          status: 'Approved',
          processedDate: new Date().toISOString()
        });
      });
      alert("Payroll run processed successfully.");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <Header title="Capital & Payroll Control" />

      {/* Financial Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform"><Icons.Sparkles /></div>
          <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em] mb-4">
            {activeTab === 'pending' ? 'Total Pending Liability' : 'Total Disbursed (Filtered)'}
          </p>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">
            ${totalLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[9px] font-bold text-slate-500 mt-4 uppercase">
            {activeTab === 'pending' ? 'Real-time Deployment Calc' : `From ${startDate} to ${endDate}`}
          </p>
        </Card>
        
        <Card className="p-8 bg-white border border-slate-100 flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Workload Metrics</p>
          <h2 className="text-4xl font-black text-red-500 italic">
            {(activeTab === 'pending' ? pendingRecords : filteredHistory).reduce((sum, p) => sum + p.overtimeHours, 0).toFixed(1)}h
          </h2>
          <p className="text-[9px] font-bold text-slate-400 mt-4 uppercase">Overtime Threshold Volume</p>
        </Card>

        <Card className="p-8 bg-white border border-slate-100 flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Financial Reconciliations</p>
          <h2 className="text-4xl font-black text-emerald-500 italic">
            {(activeTab === 'pending' ? pendingRecords : filteredHistory).reduce((sum, p) => sum + p.bonus + p.adjustmentAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[9px] font-bold text-slate-400 mt-4 uppercase">Total Bonuses & Adjustments</p>
        </Card>
      </div>

      {/* Controls & Filter Terminal */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pending Run
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Ledger History
            </button>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <label className="text-[9px] font-black uppercase text-slate-400">From</label>
                <input type="date" className="border-slate-200 border p-2.5 rounded-xl text-[10px] font-black" value={startDate} onChange={e => setStartDate(e.target.value)} />
             </div>
             <div className="flex items-center gap-2">
                <label className="text-[9px] font-black uppercase text-slate-400">To</label>
                <input type="date" className="border-slate-200 border p-2.5 rounded-xl text-[10px] font-black" value={endDate} onChange={e => setEndDate(e.target.value)} />
             </div>
             {activeTab === 'pending' && (
               <button onClick={handleApproveAll} className="bg-emerald-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 ml-4">
                 Authorize Payroll Run
               </button>
             )}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-[40px]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="px-10 py-6">Personnel</th>
              <th className="px-10 py-6">Hours (B/OT)</th>
              <th className="px-10 py-6">Earnings</th>
              <th className="px-10 py-6 text-sky-500">Adjustment</th>
              <th className="px-10 py-6 text-right">Net Disbursement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(activeTab === 'pending' ? pendingRecords : filteredHistory).map((record) => {
              const emp = employees.find(e => e.id === record.employeeId);
              return (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setViewingStub(record)}>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase">
                          {emp?.firstName[0]}{emp?.lastName[0]}
                       </div>
                       <div>
                          <p className="text-sm font-black text-slate-900">{emp?.firstName} {emp?.lastName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rate: ${emp?.hourlyRate}/hr</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <p className="text-xs font-black text-slate-700">
                      {record.baseHours.toFixed(1)}h <span className="text-red-500">/ {record.overtimeHours.toFixed(1)}h</span>
                    </p>
                  </td>
                  <td className="px-10 py-6">
                    <div className="text-[10px] font-bold text-slate-500">
                       <p>Base: ${record.basePay.toFixed(2)}</p>
                       <p className="text-red-500">OT: ${record.overtimePay.toFixed(2)}</p>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    {activeTab === 'pending' ? (
                       <button 
                        onClick={(e) => { e.stopPropagation(); setEditRecord(record); }}
                        className="text-[10px] font-black uppercase text-sky-600 hover:underline flex items-center gap-1"
                       >
                         {record.adjustmentAmount !== 0 ? `$${record.adjustmentAmount.toFixed(2)}` : 'Modify'}
                         <Icons.Plus />
                       </button>
                    ) : (
                       <p className={`text-[10px] font-black ${record.adjustmentAmount >= 0 ? 'text-sky-600' : 'text-red-600'}`}>
                         ${record.adjustmentAmount.toFixed(2)}
                       </p>
                    )}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <p className="text-lg font-black text-slate-900 tabular-nums">${record.netPay.toFixed(2)}</p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${record.status === 'Draft' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         {record.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Edit Adjustment Modal */}
      {editRecord && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[600] flex items-center justify-center p-4">
           <Card className="w-full max-w-md bg-white p-10 rounded-[48px] space-y-8 shadow-2xl border-none">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-black text-slate-900 uppercase italic">Payroll Override</h2>
                 <button onClick={() => setEditRecord(null)} className="text-4xl font-light text-slate-400">&times;</button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Personnel</label>
                    <p className="text-sm font-black text-slate-900">
                       {employees.find(e => e.id === editRecord.employeeId)?.firstName} {employees.find(e => e.id === editRecord.employeeId)?.lastName}
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Base Hours</label>
                       <input type="number" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50" value={editRecord.baseHours} onChange={e => setEditRecord({...editRecord, baseHours: parseFloat(e.target.value), basePay: parseFloat(e.target.value) * (employees.find(emp => emp.id === editRecord.employeeId)?.hourlyRate || 0)})} />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Bonus ($)</label>
                       <input type="number" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50" value={editRecord.bonus} onChange={e => setEditRecord({...editRecord, bonus: parseFloat(e.target.value)})} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Manual Adjustment ($)</label>
                    <input type="number" className="w-full border-slate-200 border p-4 rounded-2xl text-lg font-black text-sky-600" value={editRecord.adjustmentAmount} onChange={e => setEditRecord({...editRecord, adjustmentAmount: parseFloat(e.target.value)})} placeholder="e.g. Reimbursement, Fine..." />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Reasoning Note</label>
                    <textarea className="w-full border-slate-200 border p-4 rounded-2xl text-xs font-medium min-h-[100px] outline-none" value={editRecord.adjustmentNote} onChange={e => setEditRecord({...editRecord, adjustmentNote: e.target.value})} placeholder="Explain override rationale..." />
                 </div>
              </div>
              <button onClick={() => handleUpdatePending(editRecord)} className="w-full py-5 bg-slate-900 text-white rounded-[28px] text-[11px] font-black uppercase tracking-widest shadow-xl">Apply Override</button>
           </Card>
        </div>
      )}

      {/* Paystub Preview Modal */}
      {viewingStub && !editRecord && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white rounded-[48px] overflow-hidden shadow-2xl border-none">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight italic">Disbursement Protocol</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Period: {viewingStub.periodStart} &rarr; {viewingStub.periodEnd}</p>
              </div>
              <button onClick={() => setViewingStub(null)} className="text-4xl font-light text-slate-400 hover:text-slate-900">&times;</button>
            </div>
            
            <div className="p-12 space-y-10">
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recipient</p>
                     <p className="text-3xl font-black text-slate-900 tracking-tighter">
                        {employees.find(e => e.id === viewingStub.employeeId)?.firstName} {employees.find(e => e.id === viewingStub.employeeId)?.lastName}
                     </p>
                     <p className="text-xs font-bold text-slate-500 uppercase mt-1">Personnel ID: {employees.find(e => e.id === viewingStub.employeeId)?.personnelNumber}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Financial Status</p>
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${viewingStub.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {viewingStub.status}
                     </span>
                  </div>
               </div>

               <div className="space-y-4 border-y border-slate-100 py-8">
                  <div className="flex justify-between text-sm font-bold">
                     <span className="text-slate-500 uppercase">Regular Earnings ({viewingStub.baseHours}h)</span>
                     <span className="text-slate-900 tabular-nums">${viewingStub.basePay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                     <span className="text-red-500 uppercase">Overtime Premium (1.5x)</span>
                     <span className="text-red-500 tabular-nums">${viewingStub.overtimePay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                     <span className="text-emerald-500 uppercase">Performance Bonus</span>
                     <span className="text-emerald-500 tabular-nums">${viewingStub.bonus.toFixed(2)}</span>
                  </div>
                  {viewingStub.adjustmentAmount !== 0 && (
                    <div className="flex justify-between text-sm font-bold">
                       <span className="text-sky-500 uppercase">Manual Adjustment</span>
                       <span className="text-sky-500 tabular-nums">${viewingStub.adjustmentAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-4 border-t border-slate-50">
                     <span className="text-slate-400 uppercase">System Taxation (20%)</span>
                     <span className="text-slate-400 tabular-nums">-${viewingStub.taxAmount.toFixed(2)}</span>
                  </div>
               </div>

               <div className="bg-slate-900 p-8 rounded-[32px] flex justify-between items-center text-white">
                  <div>
                    <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">Net Flow Authorized</p>
                    <p className="text-4xl font-black italic tracking-tighter">${viewingStub.netPay.toFixed(2)}</p>
                  </div>
                  <button className="bg-sky-500 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">Print Manifest</button>
               </div>
               
               {viewingStub.adjustmentNote && (
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Adjustment Rationale</p>
                    <p className="text-xs font-medium text-slate-600 italic">"{viewingStub.adjustmentNote}"</p>
                 </div>
               )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
