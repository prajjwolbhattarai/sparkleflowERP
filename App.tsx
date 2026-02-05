
import React, { useState, useEffect } from 'react';
import { Client, Employee, Job, TimeLog, Absence, Invoice, PayrollRecord } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './features/dashboard/DashboardView';
import { CRMView } from './features/crm/CRMView';
import { EmployeeView } from './features/employees/EmployeeView';
import { JobsManagementView } from './features/jobs/JobsManagementView';
import { FieldView } from './features/field/FieldView';
import { ReportsView } from './features/reports/ReportsView';
import { InvoiceManagementView } from './features/billing/InvoiceManagementView';
import { PayrollManagement } from './features/employees/payroll/PayrollManagement';
import { GlobalTimer } from './components/shared/GlobalTimer';
import { INITIAL_CLIENTS, INITIAL_EMPLOYEES, INITIAL_JOBS, INITIAL_LOGS, INITIAL_ABSENCES, INITIAL_INVOICES } from './data/initialData';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    const savedClients = localStorage.getItem('sf_clients_v12');
    const savedEmployees = localStorage.getItem('sf_employees_v12');
    const savedJobs = localStorage.getItem('sf_jobs_v12');
    const savedInvoices = localStorage.getItem('sf_invoices_v12');
    const savedLogs = localStorage.getItem('sf_logs_v12');
    const savedAbsences = localStorage.getItem('sf_absences_v12');
    const savedPayroll = localStorage.getItem('sf_payroll_v12');
    
    setClients(savedClients ? JSON.parse(savedClients) : INITIAL_CLIENTS);
    setEmployees(savedEmployees ? JSON.parse(savedEmployees) : INITIAL_EMPLOYEES);
    setJobs(savedJobs ? JSON.parse(savedJobs) : INITIAL_JOBS);
    setInvoices(savedInvoices ? JSON.parse(savedInvoices) : INITIAL_INVOICES);
    setTimeLogs(savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS);
    setAbsences(savedAbsences ? JSON.parse(savedAbsences) : INITIAL_ABSENCES);
    setPayrollHistory(savedPayroll ? JSON.parse(savedPayroll) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem('sf_clients_v12', JSON.stringify(clients));
    localStorage.setItem('sf_employees_v12', JSON.stringify(employees));
    localStorage.setItem('sf_jobs_v12', JSON.stringify(jobs));
    localStorage.setItem('sf_invoices_v12', JSON.stringify(invoices));
    localStorage.setItem('sf_logs_v12', JSON.stringify(timeLogs));
    localStorage.setItem('sf_absences_v12', JSON.stringify(absences));
    localStorage.setItem('sf_payroll_v12', JSON.stringify(payrollHistory));
  }, [clients, employees, jobs, invoices, timeLogs, absences, payrollHistory]);

  const startClock = (jobId: string, type: 'work' | 'travel' | 'break') => {
    if (activeLogId) stopClock();
    const newLog: TimeLog = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: 'e1',
      jobId,
      type,
      start: new Date().toISOString(),
      status: 'pending'
    };
    setTimeLogs(prev => [...prev, newLog]);
    setActiveLogId(newLog.id);
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'In Progress' } : j));
  };

  const stopClock = () => {
    if (!activeLogId) return;
    const log = timeLogs.find(l => l.id === activeLogId);
    if (!log) return;
    const endTime = new Date().toISOString();
    setTimeLogs(prev => prev.map(l => l.id === activeLogId ? { ...l, end: endTime } : l));
    const durationHrs = (new Date(endTime).getTime() - new Date(log.start).getTime()) / 3600000;
    setEmployees(prev => prev.map(e => e.id === log.employeeId ? { ...e, hoursWorkedThisWeek: e.hoursWorkedThisWeek + durationHrs } : e));
    setActiveLogId(null);
  };

  const activeLog = timeLogs.find(l => l.id === activeLogId) || null;
  const activeJob = activeLog ? jobs.find(j => j.id === activeLog.jobId) || null : null;

  // Generic Handlers
  const addClient = (c: Client) => setClients(prev => [...prev, c]);
  const updateClient = (c: Client) => setClients(prev => prev.map(pc => pc.id === c.id ? c : pc));
  const deleteClient = (id: string) => setClients(prev => prev.filter(c => c.id !== id));

  const addEmployee = (e: Employee) => setEmployees(prev => [...prev, e]);
  const updateEmployee = (e: Employee) => setEmployees(prev => prev.map(pe => pe.id === e.id ? e : pe));
  const deleteEmployee = (id: string) => setEmployees(prev => prev.filter(e => e.id !== id));

  const addJobs = (newJobs: Job[]) => setJobs(prev => [...prev, ...newJobs]);
  const updateJob = (j: Job) => setJobs(prev => prev.map(pj => pj.id === j.id ? j : pj));
  const deleteJob = (id: string) => setJobs(prev => prev.filter(j => j.id !== id));

  const addInvoice = (inv: Invoice) => {
    setInvoices(prev => [...prev, inv]);
    setJobs(prev => prev.map(j => j.id === inv.jobId ? { ...j, invoiceStatus: 'Invoiced' } : j));
  };

  const updateInvoice = (inv: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === inv.id ? inv : i));
    if (inv.status === 'Paid') {
      setJobs(prev => prev.map(j => j.id === inv.jobId ? { ...j, invoiceStatus: 'Paid' } : j));
    } else if (inv.status === 'Sent' || inv.status === 'Draft' || inv.status === 'Overdue') {
      setJobs(prev => prev.map(j => j.id === inv.jobId ? { ...j, invoiceStatus: 'Invoiced' } : j));
    } else if (inv.status === 'Cancelled') {
      setJobs(prev => prev.map(j => j.id === inv.jobId ? { ...j, invoiceStatus: 'Uninvoiced' } : j));
    }
  };

  const deleteInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (inv && inv.jobId) {
      setJobs(prev => prev.map(j => j.id === inv.jobId ? { ...j, invoiceStatus: 'Uninvoiced' } : j));
    }
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar currentView={view} setView={setView} />
      <main className="flex-1 ml-64 p-8 min-h-screen pb-32">
        {view === 'dashboard' && (
          <DashboardView 
            jobs={jobs.filter(j => !j.isArchived)} 
            employees={employees.filter(e => !e.isArchived)} 
            clients={clients.filter(c => !c.isArchived)} 
            absences={absences} 
            onUpdateJob={updateJob} 
            onAddJobs={addJobs} 
            setView={setView} 
          />
        )}
        {view === 'crm' && (
          <CRMView 
            clients={clients} 
            onAddClient={addClient} 
            onUpdateClient={updateClient} 
            onDeleteClient={deleteClient} 
            jobs={jobs}
            invoices={invoices}
          />
        )}
        {view === 'employees' && (
          <EmployeeView 
            employees={employees} 
            payrollHistory={payrollHistory}
            onAddEmployee={addEmployee} 
            onUpdateEmployee={updateEmployee} 
            onDeleteEmployee={deleteEmployee} 
          />
        )}
        {view === 'payroll' && (
          <PayrollManagement 
            employees={employees.filter(e => !e.isArchived)}
            payrollHistory={payrollHistory}
            onAddPayrollRecord={(r) => setPayrollHistory(prev => [...prev, r])}
            onUpdatePayrollRecord={(r) => setPayrollHistory(prev => prev.map(pr => pr.id === r.id ? r : pr))}
          />
        )}
        {view === 'jobs' && (
          <JobsManagementView 
            jobs={jobs} 
            clients={clients.filter(c => !c.isArchived)} 
            employees={employees.filter(e => !e.isArchived)} 
            absences={absences} 
            onAddJobs={addJobs} 
            onUpdateJob={updateJob} 
            onDeleteJob={deleteJob}
          />
        )}
        {view === 'billing' && (
          <InvoiceManagementView 
            jobs={jobs} 
            clients={clients} 
            invoices={invoices} 
            onAddInvoice={addInvoice} 
            onUpdateInvoice={updateInvoice} 
            onDeleteInvoice={deleteInvoice}
          />
        )}
        {view === 'field' && <FieldView jobs={jobs.filter(j => !j.isArchived)} clients={clients.filter(c => !c.isArchived)} onUpdateJob={updateJob} onClockIn={startClock} />}
        {view === 'reports' && <ReportsView jobs={jobs} timeLogs={timeLogs} employees={employees} clients={clients} />}
      </main>
      
      <GlobalTimer 
        activeJob={activeJob} 
        activeLog={activeLog} 
        employee={employees.find(e => e.id === 'e1') || null}
        onStart={startClock}
        onStop={stopClock}
      />
    </div>
  );
}
