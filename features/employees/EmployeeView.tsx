
import React, { useState, useMemo } from 'react';
import { Employee, EmployeeRole, EmployeeDocument, PayrollRecord, ServiceType } from '../../types';
import { Card } from '../../components/shared/Card';
import { Header } from '../../components/layout/Header';
import { Icons } from '../../constants';

interface EmployeeViewProps {
  employees: Employee[];
  payrollHistory: PayrollRecord[];
  onAddEmployee: (e: Employee) => void;
  onUpdateEmployee: (e: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const EmployeeView: React.FC<EmployeeViewProps> = ({ employees, payrollHistory, onAddEmployee, onUpdateEmployee, onDeleteEmployee }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');

  const [activeTab, setActiveTab] = useState<'identity' | 'professional' | 'hr_analytics' | 'payroll_ledger' | 'financial' | 'logistics' | 'security'>('identity');
  
  const [formData, setFormData] = useState<Partial<Employee>>({
    salutation: 'Mrs',
    isActive: true,
    performanceRating: 5,
    reliabilityScore: 100,
    onboardingProgress: 0,
    documents: [],
    assignedAssets: [],
    permissions: {
      showAllLocations: false,
      setupTimeTracking: true,
      timeEditing: false,
      allowCreatingAssignments: false,
      mileageTravel: true,
      mileageAssignments: true,
      qrCode: true,
      autoRecord: true
    }
  });

  // Timeline Filter for Dossier
  const [dossierStart, setDossierStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [dossierEnd, setDossierEnd] = useState(new Date().toISOString().split('T')[0]);

  const expiringDocsCount = useMemo(() => {
    return employees.reduce((count, emp) => {
      return count + (emp.documents?.filter(d => d.status === 'Expiring' || d.status === 'Expired').length || 0);
    }, 0);
  }, [employees]);

  const openCreateModal = () => {
    setFormData({
      salutation: 'Mrs',
      isActive: true,
      performanceRating: 5,
      reliabilityScore: 100,
      onboardingProgress: 0,
      documents: [],
      assignedAssets: [],
      startDate: new Date().toISOString().split('T')[0],
      permissions: {
        showAllLocations: false,
        setupTimeTracking: true,
        timeEditing: false,
        allowCreatingAssignments: false,
        mileageTravel: true,
        mileageAssignments: true,
        qrCode: true,
        autoRecord: true
      }
    });
    setIsEditMode(false);
    setIsDetailMode(false);
    setIsModalOpen(true);
    setActiveTab('identity');
  };

  const openEditModal = (emp: Employee) => {
    setFormData(emp);
    setIsEditMode(true);
    setIsDetailMode(false);
    setIsModalOpen(true);
    setActiveTab('identity');
  };

  const openDetailModal = (emp: Employee) => {
    setFormData(emp);
    setIsDetailMode(true);
    setIsModalOpen(true);
    setActiveTab('identity');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && formData.id) {
      onUpdateEmployee(formData as Employee);
    } else {
      const newEmp: Employee = {
        id: Math.random().toString(36).substr(2, 9),
        personnelNumber: formData.personnelNumber || (Math.floor(Math.random() * 9000) + 1000).toString(),
        firstName: formData.firstName || 'New',
        lastName: formData.lastName || 'Staff',
        role: formData.role || 'Cleaner',
        hourlyRate: formData.hourlyRate || 18,
        weeklyHours: formData.weeklyHours || 40,
        hoursWorkedThisWeek: 0,
        performanceRating: formData.performanceRating || 5,
        reliabilityScore: formData.reliabilityScore || 100,
        onboardingProgress: formData.onboardingProgress || 10,
        documents: [],
        assignedAssets: [],
        location: formData.location || 'Roaming',
        isActive: true,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        assignmentRadius: formData.assignmentRadius || 15,
        ...formData
      } as Employee;
      onAddEmployee(newEmp);
    }
    setIsModalOpen(false);
  };

  const filteredEmployees = employees.filter(e => {
    const matchesArchive = showArchived ? e.isArchived : !e.isArchived;
    const matchesSearch = `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         e.personnelNumber.includes(searchQuery);
    const matchesRole = roleFilter === 'All' || e.role === roleFilter;
    const matchesLocation = locationFilter === 'All' || e.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesArchive && matchesSearch && matchesRole && matchesLocation;
  });

  const locations = Array.from(new Set(employees.map(e => e.location))).filter(Boolean);

  const empPayrollHistory = useMemo(() => {
    if (!formData.id) return [];
    return payrollHistory
      .filter(p => p.employeeId === formData.id && p.periodEnd >= dossierStart && p.periodStart <= dossierEnd)
      .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
  }, [formData.id, payrollHistory, dossierStart, dossierEnd]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <Header title="HR Intelligence Hub" />
        <div className="flex gap-4">
          {expiringDocsCount > 0 && (
            <div className="flex items-center gap-3 px-6 py-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-pulse">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-[10px] font-black uppercase tracking-widest">{expiringDocsCount} Document Warnings</span>
            </div>
          )}
          <button onClick={openCreateModal} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 shadow-xl transition-all">
            <Icons.Plus /> Recruit New Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Card className="p-6 bg-slate-900 text-white border-none">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-400 mb-2">Fleet Capacity</p>
          <h4 className="text-3xl font-black italic">{employees.filter(e => e.isActive).length} / {employees.length}</h4>
          <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase">Active Duty Personnel</p>
        </Card>
        <Card className="p-6 bg-white border-slate-100">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">System Reliability</p>
          <h4 className="text-3xl font-black text-emerald-600">
            {Math.round(employees.reduce((acc, e) => acc + (e.reliabilityScore || 0), 0) / (employees.length || 1))}%
          </h4>
          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Avg Workforce Score</p>
        </Card>
        <Card className="p-6 bg-white border-slate-100">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Pending Onboarding</p>
          <h4 className="text-3xl font-black text-sky-500">{employees.filter(e => (e.onboardingProgress || 0) < 100).length}</h4>
          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Active Trainees</p>
        </Card>
        <Card className="p-6 bg-white border-slate-100">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Retention Risk</p>
          <h4 className="text-3xl font-black text-red-500">{employees.filter(e => (e.reliabilityScore || 100) < 60).length}</h4>
          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Employees flagged</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="col-span-2 relative">
          <input type="text" placeholder="Search staff database..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
          <div className="absolute left-3.5 top-3.5 text-slate-400"><Icons.Plus /></div>
        </div>
        <div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none">
            <option value="All">All Designations</option>
            <option value="Cleaner">Field Cleaner</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Specialist">Specialist</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none">
            <option value="All">All Sectors</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEmployees.map(emp => (
          <Card key={emp.id} className={`relative border-t-8 border-slate-900 shadow-xl group cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all overflow-hidden ${emp.isArchived ? 'opacity-50 grayscale' : ''}`} onClick={() => openDetailModal(emp)}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-none">{emp.firstName} {emp.lastName}</h3>
                    <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mt-1.5">{emp.role} &bull; {emp.personnelNumber}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${emp.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {emp.isActive ? 'Active' : 'Locked'}
                  </span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <div key={s} className={`w-1.5 h-1.5 rounded-full ${s <= (emp.performanceRating || 5) ? 'bg-amber-400' : 'bg-slate-200'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Reliability</p>
                   <p className="text-xs font-black text-slate-900">{emp.reliabilityScore || 100}%</p>
                 </div>
                 <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Training</p>
                   <p className="text-xs font-black text-slate-900">{emp.onboardingProgress || 0}%</p>
                 </div>
              </div>

              <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${emp.onboardingProgress || 100}%` }}></div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                 <span>{emp.location}</span>
                 <span>{emp.assignmentRadius}km Radius</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex gap-4 border-t border-slate-100">
              <button onClick={(e) => { e.stopPropagation(); openEditModal(emp); }} className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all">Modify</button>
              <button onClick={(e) => { e.stopPropagation(); openDetailModal(emp); }} className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest text-sky-600 bg-sky-50 border border-sky-100 rounded-xl hover:bg-sky-500 hover:text-white transition-all">HR Dossier</button>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[250] flex items-center justify-center p-4">
          <Card className="w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border-none overflow-hidden bg-white rounded-[48px]">
             <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                    {isDetailMode ? 'Human Resource Dossier' : isEditMode ? 'Modify Personnel' : 'Initialize Recruitment'}
                 </h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Enterprise Resource Management System
                 </p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-3xl font-light">&times;</button>
             </div>

             <div className="flex bg-slate-50 px-8 py-2 border-b border-slate-100 gap-2 overflow-x-auto scrollbar-hide">
                {[
                  {id:'identity', label:'Identity'}, 
                  {id:'professional', label:'Career & Contract'}, 
                  {id:'hr_analytics', label:'Performance & HR'}, 
                  ...(isDetailMode ? [{id:'payroll_ledger', label:'Payroll Hub'}] : []),
                  {id:'financial', label:'Financials'}, 
                  {id:'logistics', label:'Logistics'}, 
                  {id:'security', label:'System Security'}
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                    {tab.label}
                  </button>
                ))}
             </div>

             <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                {isDetailMode && activeTab !== 'payroll_ledger' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="col-span-1 space-y-6">
                      <div className="aspect-square bg-slate-900 rounded-[48px] flex flex-col items-center justify-center text-white p-8 relative overflow-hidden shadow-2xl">
                        <span className="text-4xl font-black uppercase relative z-10">{formData.firstName?.[0]}{formData.lastName?.[0]}</span>
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-emerald-500/20"></div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                           <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Onboarding Status</p>
                           <div className="flex justify-between items-end mb-2">
                             <span className="text-2xl font-black text-slate-900">{formData.onboardingProgress}%</span>
                             <span className="text-[9px] font-black text-emerald-600 uppercase">Training Active</span>
                           </div>
                           <div className="h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                             <div className="h-full bg-emerald-500" style={{ width: `${formData.onboardingProgress}%` }}></div>
                           </div>
                        </div>

                        <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100">
                           <p className="text-[10px] font-black text-amber-600 uppercase mb-2 tracking-widest">Performance Rating</p>
                           <div className="flex gap-1 mb-2">
                              {[1,2,3,4,5].map(s => (
                                <span key={s} className={`text-xl ${s <= (formData.performanceRating || 5) ? 'text-amber-500' : 'text-slate-300'}`}>★</span>
                              ))}
                           </div>
                           <p className="text-[9px] font-bold text-slate-500 uppercase">Based on Field Reviews</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 grid grid-cols-2 gap-8">
                       <div className="space-y-8">
                         <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{formData.firstName} {formData.lastName}</h3>
                            <p className="text-sm font-black text-sky-600 uppercase tracking-widest mt-1">{formData.role} &bull; ID {formData.personnelNumber}</p>
                         </div>

                         <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-slate-900 pl-3">Compliance & Documents</h4>
                            <div className="space-y-3">
                               {formData.documents?.map(doc => (
                                 <div key={doc.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                   <div>
                                      <p className="text-xs font-black text-slate-900">{doc.type}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">Exp: {doc.expiryDate || 'N/A'}</p>
                                   </div>
                                   <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${doc.status === 'Valid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                     {doc.status}
                                   </span>
                                 </div>
                               ))}
                               {(!formData.documents || formData.documents.length === 0) && (
                                 <p className="text-[9px] font-black text-slate-300 uppercase italic">No active compliance records found</p>
                               )}
                            </div>
                         </div>
                       </div>

                       <div className="space-y-8">
                         <div className="p-6 bg-slate-900 text-white rounded-[40px] space-y-4">
                            <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Current Pay Config</p>
                            <div className="space-y-1">
                               <p className="text-3xl font-black italic">${formData.hourlyRate}/hr</p>
                               <p className="text-[9px] font-bold text-slate-500 uppercase">Base Contract Rate</p>
                            </div>
                            <div className="pt-4 border-t border-slate-800">
                               <p className="text-xs font-bold text-slate-400">Total Hours This Week: <span className="text-white font-black">{formData.hoursWorkedThisWeek?.toFixed(1)}h</span></p>
                            </div>
                         </div>
                       </div>
                    </div>
                  </div>
                )}

                {isDetailMode && activeTab === 'payroll_ledger' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                       <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-sky-500 pl-3">Financial Performance Timeline</h3>
                       <div className="flex gap-4 items-center">
                          <div className="flex items-center gap-2">
                             <label className="text-[9px] font-black uppercase text-slate-400">Start</label>
                             <input type="date" className="border-slate-200 border p-2 rounded-xl text-[10px] font-black" value={dossierStart} onChange={e => setDossierStart(e.target.value)} />
                          </div>
                          <div className="flex items-center gap-2">
                             <label className="text-[9px] font-black uppercase text-slate-400">End</label>
                             <input type="date" className="border-slate-200 border p-2 rounded-xl text-[10px] font-black" value={dossierEnd} onChange={e => setDossierEnd(e.target.value)} />
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <div className="p-6 bg-white border border-slate-100 rounded-3xl text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Total Net Paid</p>
                          <p className="text-2xl font-black text-slate-900">${empPayrollHistory.reduce((s, p) => s + p.netPay, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                       </div>
                       <div className="p-6 bg-white border border-slate-100 rounded-3xl text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Workload Hrs</p>
                          <p className="text-2xl font-black text-slate-900">{empPayrollHistory.reduce((s, p) => s + p.baseHours + p.overtimeHours, 0).toFixed(1)}h</p>
                       </div>
                       <div className="p-6 bg-white border border-slate-100 rounded-3xl text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Bonuses Paid</p>
                          <p className="text-2xl font-black text-emerald-600">${empPayrollHistory.reduce((s, p) => s + p.bonus, 0).toLocaleString()}</p>
                       </div>
                       <div className="p-6 bg-white border border-slate-100 rounded-3xl text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Total Tax Flow</p>
                          <p className="text-2xl font-black text-red-500">${empPayrollHistory.reduce((s, p) => s + p.taxAmount, 0).toFixed(2)}</p>
                       </div>
                    </div>

                    <div className="overflow-hidden border border-slate-100 rounded-[32px] bg-white">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-8 py-4">Period</th>
                                <th className="px-8 py-4">Hours (B/OT)</th>
                                <th className="px-8 py-4">Gross Flow</th>
                                <th className="px-8 py-4">Adjustments</th>
                                <th className="px-8 py-4 text-right">Net Payout</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {empPayrollHistory.map(record => (
                               <tr key={record.id} className="text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                  <td className="px-8 py-4">
                                     {record.periodStart} &rarr; {record.periodEnd}
                                  </td>
                                  <td className="px-8 py-4">
                                     {record.baseHours.toFixed(1)}h / <span className="text-red-500">{record.overtimeHours.toFixed(1)}h</span>
                                  </td>
                                  <td className="px-8 py-4">${record.grossPay.toFixed(2)}</td>
                                  <td className={`px-8 py-4 ${record.adjustmentAmount !== 0 ? 'text-sky-600' : 'text-slate-300'}`}>
                                     ${record.adjustmentAmount.toFixed(2)}
                                  </td>
                                  <td className="px-8 py-4 text-right font-black text-slate-900">
                                     ${record.netPay.toFixed(2)}
                                  </td>
                               </tr>
                             ))}
                             {empPayrollHistory.length === 0 && (
                               <tr><td colSpan={5} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase">No disbursement records in this timeline</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                  </div>
                )}

                {!isDetailMode && (
                  <form onSubmit={handleSubmit} className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'identity' && (
                      <div className="grid grid-cols-2 gap-8">
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Personnel Number*</label>
                            <input required className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black text-sky-600 bg-slate-50" value={formData.personnelNumber || ''} onChange={e => setFormData({...formData, personnelNumber: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Gender / Salutation</label>
                            <select className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-white" value={formData.salutation} onChange={e => setFormData({...formData, salutation: e.target.value})}>
                               <option value="Mrs">Mrs</option>
                               <option value="Mr">Mr</option>
                               <option value="Other">Other</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">First Name*</label>
                            <input required className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-white" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Last Name*</label>
                            <input required className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-white" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Date of Birth</label>
                            <input type="date" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-white" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Email Address</label>
                            <input type="email" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-white" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                         </div>
                      </div>
                    )}

                    {activeTab === 'professional' && (
                      <div className="grid grid-cols-2 gap-8">
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Employee Role</label>
                            <select className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as EmployeeRole})}>
                               <option value="Cleaner">Field Cleaner</option>
                               <option value="Supervisor">Supervisor</option>
                               <option value="Specialist">Specialist</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Weekly Goal Hours</label>
                            <input type="number" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold" value={formData.weeklyHours} onChange={e => setFormData({...formData, weeklyHours: parseInt(e.target.value)})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Vacation Days (Annual)</label>
                            <input type="number" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold" value={formData.vacationDays} onChange={e => setFormData({...formData, vacationDays: parseInt(e.target.value)})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Employment Start Date</label>
                            <input type="date" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black" value={formData.startDate || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Nationality</label>
                            <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold" value={formData.nationality || ''} onChange={e => setFormData({...formData, nationality: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">System App Language</label>
                            <select className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold" value={formData.appLanguage || 'English'} onChange={e => setFormData({...formData, appLanguage: e.target.value})}>
                               <option value="English">English</option>
                               <option value="German">German</option>
                               <option value="Spanish">Spanish</option>
                               <option value="Polish">Polish</option>
                            </select>
                         </div>
                      </div>
                    )}

                    {activeTab === 'hr_analytics' && (
                       <div className="grid grid-cols-2 gap-8">
                          <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Performance Calibration</label>
                             <div className="space-y-6">
                                <div>
                                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Performance Rating (1-5)</label>
                                   <input type="range" min="1" max="5" className="w-full accent-emerald-500" value={formData.performanceRating || 5} onChange={e => setFormData({...formData, performanceRating: parseInt(e.target.value)})} />
                                   <div className="flex justify-between text-[10px] font-black text-slate-400 mt-1"><span>1</span><span>3</span><span>5</span></div>
                                </div>
                                <div>
                                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Reliability Score (%)</label>
                                   <input type="number" min="0" max="100" className="w-full border-slate-200 border p-3 rounded-xl text-sm font-black text-emerald-600" value={formData.reliabilityScore || 100} onChange={e => setFormData({...formData, reliabilityScore: parseInt(e.target.value)})} />
                                </div>
                             </div>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Training Progress</label>
                             <div className="space-y-4">
                                <div>
                                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Onboarding Status (%)</label>
                                   <input type="number" min="0" max="100" className="w-full border-slate-200 border p-3 rounded-xl text-sm font-black text-sky-600" value={formData.onboardingProgress || 0} onChange={e => setFormData({...formData, onboardingProgress: parseInt(e.target.value)})} />
                                </div>
                                <div>
                                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Core Skills (Tags)</label>
                                   <input className="w-full border-slate-200 border p-3 rounded-xl text-xs font-bold" placeholder="Windows, Carpets, Heavy..." value={formData.skills?.join(', ') || ''} onChange={e => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})} />
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {activeTab === 'financial' && (
                       <div className="grid grid-cols-2 gap-8">
                          <div className="col-span-2 p-8 bg-slate-900 rounded-[40px] text-white space-y-6">
                             <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Contractual Rate Configuration</h4>
                             </div>
                             <div className="grid grid-cols-2 gap-8">
                                <div>
                                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Standard Hourly Rate ($/hr)</label>
                                   <input type="number" step="0.5" className="w-full bg-slate-800 border-slate-700 border p-4 rounded-2xl text-xl font-black text-emerald-400" value={formData.hourlyRate} onChange={e => setFormData({...formData, hourlyRate: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                   <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Specialist / Premium Rate ($/hr)</label>
                                   <input type="number" step="0.5" className="w-full bg-slate-800 border-slate-700 border p-4 rounded-2xl text-xl font-black text-sky-400" value={formData.specialistRate || 0} onChange={e => setFormData({...formData, specialistRate: parseFloat(e.target.value)})} />
                                </div>
                             </div>
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">IBAN</label>
                             <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black" value={formData.iban || ''} onChange={e => setFormData({...formData, iban: e.target.value})} placeholder="DE00 0000..." />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">BIC / SWIFT</label>
                             <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black" value={formData.bic || ''} onChange={e => setFormData({...formData, bic: e.target.value})} />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Bank Institution</label>
                             <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold" value={formData.bankName || ''} onChange={e => setFormData({...formData, bankName: e.target.value})} />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Tax ID Number</label>
                             <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black" value={formData.taxId || ''} onChange={e => setFormData({...formData, taxId: e.target.value})} />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Social Security Number</label>
                             <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black" value={formData.socialSecurityNumber || ''} onChange={e => setFormData({...formData, socialSecurityNumber: e.target.value})} />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Health Insurance Provider</label>
                             <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold" value={formData.healthInsurance || ''} onChange={e => setFormData({...formData, healthInsurance: e.target.value})} />
                          </div>
                       </div>
                    )}

                    {activeTab === 'logistics' && (
                       <div className="grid grid-cols-2 gap-8">
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Primary Deployment Sector (Location)</label>
                             <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Assignment Radius (km)</label>
                             <input type="number" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black text-sky-600" value={formData.assignmentRadius || 15} onChange={e => setFormData({...formData, assignmentRadius: parseInt(e.target.value)})} />
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Driving License Status</label>
                             <select className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold" value={formData.drivingLicense || 'No'} onChange={e => setFormData({...formData, drivingLicense: e.target.value as any})}>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="In Progress">In Progress</option>
                             </select>
                          </div>
                          <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Uniform / Clothing Size</label>
                             <select className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold" value={formData.clothingSize || 'M'} onChange={e => setFormData({...formData, clothingSize: e.target.value as any})}>
                                <option value="XS">XS</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                             </select>
                          </div>
                          <div className="col-span-2">
                             <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Assignment Groups (Comma separated)</label>
                             <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold" value={formData.assignmentGroups?.join(', ') || ''} onChange={e => setFormData({...formData, assignmentGroups: e.target.value.split(',').map(s => s.trim())})} />
                          </div>
                       </div>
                    )}

                    {activeTab === 'security' && (
                       <div className="space-y-10">
                          <div className="p-8 bg-slate-900 rounded-[40px] text-white">
                             <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-6">System Access Permissions</h4>
                             <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                {[
                                   {key: 'showAllLocations', label: 'Visibility: All Locations'},
                                   {key: 'setupTimeTracking', label: 'Auth: Initial Time Tracking Setup'},
                                   {key: 'timeEditing', label: 'Auth: Override Field Logs'},
                                   {key: 'allowCreatingAssignments', label: 'Auth: Field Dispatch Privileges'},
                                   {key: 'mileageTravel', label: 'Allow Travel Compensation Calc'},
                                   {key: 'qrCode', label: 'Mandatory QR Check-in Protocol'},
                                   {key: 'autoRecord', label: 'Enable System Auto-Logging'}
                                ].map(perm => (
                                   <label key={perm.key} className="flex items-center justify-between cursor-pointer group">
                                      <span className="text-xs font-black text-slate-300 group-hover:text-white transition-colors">{perm.label}</span>
                                      <input 
                                         type="checkbox" 
                                         className="w-5 h-5 accent-sky-500 rounded border-slate-700 bg-slate-800"
                                         checked={(formData.permissions as any)[perm.key]} 
                                         onChange={e => setFormData({
                                            ...formData, 
                                            permissions: { ...formData.permissions!, [perm.key]: e.target.checked }
                                         })} 
                                      />
                                   </label>
                                ))}
                             </div>
                          </div>
                          
                          <div className="p-8 border-2 border-dashed border-slate-100 rounded-[40px] flex justify-between items-center">
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Lifecycle Status</p>
                                <p className="text-sm font-bold text-slate-600 mt-1">Status: {formData.isActive ? 'OPERATIONAL' : 'SYSTEM LOCK'}</p>
                             </div>
                             <button type="button" onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.isActive ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                {formData.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                             </button>
                          </div>
                       </div>
                    )}
                  </form>
                )}
             </div>

             <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                {isDetailMode ? (
                  <>
                    <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-200 transition-all">Close</button>
                    <button onClick={() => { setIsDetailMode(false); setIsEditMode(true); }} className="px-14 py-4 bg-slate-900 text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:bg-black">
                      Edit Personnel File
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-200 transition-all">Abort</button>
                    <button onClick={handleSubmit} className="px-14 py-4 bg-slate-900 text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:bg-black">
                      {isEditMode ? 'Update Employee' : 'Authorize Recruitment'}
                    </button>
                  </>
                )}
             </div>
          </Card>
        </div>
      )}
    </div>
  );
};
