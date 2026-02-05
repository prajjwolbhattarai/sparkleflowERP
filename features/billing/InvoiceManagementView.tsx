
import React, { useState, useMemo } from 'react';
import { Job, Client, Invoice, InvoiceStatus, InvoiceType } from '../../types';
import { Card } from '../../components/shared/Card';
import { Header } from '../../components/layout/Header';
import { Icons } from '../../constants';

interface InvoiceManagementViewProps {
  jobs: Job[];
  clients: Client[];
  invoices: Invoice[];
  onAddInvoice: (inv: Invoice) => void;
  onUpdateInvoice: (inv: Invoice) => void;
  onDeleteInvoice?: (id: string) => void;
}

export const InvoiceManagementView: React.FC<InvoiceManagementViewProps> = ({ 
  jobs, 
  clients, 
  invoices, 
  onAddInvoice, 
  onUpdateInvoice,
  onDeleteInvoice 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  
  // Filtering State
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState('');

  const [form, setForm] = useState({ taxRate: 19, discount: 0, notes: '' });
  const [manualForm, setManualForm] = useState({
    clientId: '',
    serviceDescription: '',
    quantity: 1,
    rate: 0,
    taxRate: 19,
    discount: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [refundForm, setRefundForm] = useState({ amount: 0, reason: '' });
  const [editForm, setEditForm] = useState<Partial<Invoice>>({});
  
  const [showInvoicingConsole, setShowInvoicingConsole] = useState(false);

  const getClient = (clientId: string) => clients.find(c => c.id === clientId);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const client = getClient(inv.clientId);
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
                           client?.name.toLowerCase().includes(ledgerSearch.toLowerCase());
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      const matchesClient = clientFilter === 'All' || inv.clientId === clientFilter;
      const matchesDate = !dateFilter || inv.date.includes(dateFilter);
      
      return matchesSearch && matchesStatus && matchesClient && matchesDate;
    }).slice().reverse();
  }, [invoices, ledgerSearch, statusFilter, clientFilter, dateFilter, clients]);

  const openInvoiceCreator = (job: Job) => {
    setActiveJob(job);
    setIsModalOpen(true);
    setForm({ taxRate: 19, discount: 0, notes: '' });
  };

  const openManualCreator = () => {
    setManualForm({
      clientId: '',
      serviceDescription: 'Miscellaneous Service',
      quantity: 1,
      rate: 40,
      taxRate: 19,
      discount: 0,
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsManualModalOpen(true);
  };

  const openRefundModal = (inv: Invoice) => {
    setActiveInvoice(inv);
    setRefundForm({ amount: inv.totalAmount, reason: 'Client dissatisfaction / Service adjustment' });
    setIsRefundModalOpen(true);
  };

  const openEditModal = (inv: Invoice) => {
    setActiveInvoice(inv);
    setEditForm(inv);
    setIsEditModalOpen(true);
  };

  const handleCreateAutomated = () => {
    if (!activeJob) return;
    const client = getClient(activeJob.clientId);
    if (!client) return;

    const subtotal = activeJob.estimatedHours * (client.serviceRate || 40);
    const taxAmount = (subtotal - form.discount) * (form.taxRate / 100);
    const total = subtotal - form.discount + taxAmount;

    onAddInvoice({
      id: Math.random().toString(36).substr(2, 9),
      type: 'Invoice',
      jobId: activeJob.id,
      clientId: client.id,
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'Sent',
      subtotal,
      taxRate: form.taxRate,
      taxAmount,
      discount: form.discount,
      totalAmount: total,
      notes: form.notes
    });
    setIsModalOpen(false);
    setActiveJob(null);
  };

  const handleCreateManual = () => {
    if (!manualForm.clientId) {
      alert("Please select a client.");
      return;
    }

    const subtotal = manualForm.quantity * manualForm.rate;
    const taxAmount = (subtotal - manualForm.discount) * (manualForm.taxRate / 100);
    const total = subtotal - manualForm.discount + taxAmount;

    onAddInvoice({
      id: Math.random().toString(36).substr(2, 9),
      type: 'Invoice',
      clientId: manualForm.clientId,
      invoiceNumber: `INV-M${Math.floor(1000 + Math.random() * 9000)}`,
      date: manualForm.date,
      dueDate: new Date(new Date(manualForm.date).getTime() + 14 * 86400000).toISOString().split('T')[0],
      status: 'Sent',
      subtotal,
      taxRate: manualForm.taxRate,
      taxAmount,
      discount: manualForm.discount,
      totalAmount: total,
      notes: manualForm.notes,
      serviceDescription: manualForm.serviceDescription
    });
    setIsManualModalOpen(false);
  };

  const handleProcessRefund = () => {
    if (!activeInvoice) return;
    const refundMagnitude = refundForm.amount;
    const newRefundAmount = (activeInvoice.refundAmount || 0) + refundMagnitude;
    const isFullRefund = newRefundAmount >= activeInvoice.totalAmount;
    
    // 1. Update original invoice status
    onUpdateInvoice({
      ...activeInvoice,
      status: isFullRefund ? 'Refunded' : 'Partially Refunded',
      refundAmount: newRefundAmount,
      notes: `${activeInvoice.notes || ''}\nRefund Processed: $${refundMagnitude} - ${refundForm.reason}`.trim()
    });

    // 2. Generate new Credit Note (Standard Practice)
    const subtotal = refundMagnitude / (1 + activeInvoice.taxRate / 100);
    const taxAmount = refundMagnitude - subtotal;

    onAddInvoice({
      id: Math.random().toString(36).substr(2, 9),
      type: 'CreditNote',
      parentInvoiceId: activeInvoice.id,
      clientId: activeInvoice.clientId,
      invoiceNumber: `CN-${activeInvoice.invoiceNumber.split('-')[1] || Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Paid',
      subtotal: subtotal,
      taxRate: activeInvoice.taxRate,
      taxAmount: taxAmount,
      discount: 0,
      totalAmount: refundMagnitude,
      notes: `Credit note for ${activeInvoice.invoiceNumber}. Reason: ${refundForm.reason}`,
      serviceDescription: `Refund for: ${activeInvoice.serviceDescription || 'Cleaning Mission'}`
    });

    setIsRefundModalOpen(false);
  };

  const handleUpdateEdit = () => {
    if (!activeInvoice || !editForm) return;
    onUpdateInvoice({ ...activeInvoice, ...editForm } as Invoice);
    setIsEditModalOpen(false);
  };

  const toggleVoid = (inv: Invoice) => {
    if (inv.status === 'Cancelled') {
      onUpdateInvoice({ ...inv, status: 'Sent' });
    } else {
      if (confirm("Are you sure you want to void this invoice? This action marks it as cancelled in the ledger.")) {
        onUpdateInvoice({ ...inv, status: 'Cancelled' });
      }
    }
  };

  const toggleCollection = (inv: Invoice) => {
    if (inv.status === 'Paid') {
      onUpdateInvoice({ ...inv, status: 'Sent' });
    } else {
      onUpdateInvoice({ ...inv, status: 'Paid' });
    }
  };

  const pendingJobs = jobs.filter(j => j.status === 'Completed' && j.invoiceStatus !== 'Invoiced' && j.invoiceStatus !== 'Paid');
  const revenueTotal = invoices.filter(i => i.status === 'Paid' && i.type !== 'CreditNote').reduce((acc, curr) => acc + curr.totalAmount, 0) - 
                       invoices.filter(i => i.type === 'CreditNote').reduce((acc, curr) => acc + curr.totalAmount, 0);
  
  const outstandingTotal = invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').reduce((acc, curr) => acc + curr.totalAmount, 0);

  const getStatusTag = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Refunded': return 'bg-red-50 text-red-600 border-red-100';
      case 'Partially Refunded': return 'bg-amber-50 text-red-500 border-amber-100';
      case 'Cancelled': return 'bg-slate-100 text-slate-400 border-slate-200 line-through';
      case 'Sent': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'Draft': return 'bg-slate-50 text-slate-500 border-slate-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <Header title="Billing & Settlement" />

      {/* --- FINANCIAL SNAPSHOT --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 bg-white border border-slate-100 flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Net Realized Revenue</p>
          <h4 className="text-3xl font-black text-emerald-600">${revenueTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
          <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">Verified Ledger (Invoices minus Credit Notes)</p>
        </Card>
        <Card className="p-8 bg-white border border-slate-100 flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Accounts Receivable</p>
          <h4 className="text-3xl font-black text-amber-500">${outstandingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
          <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase">Awaiting Collection Flow</p>
        </Card>
        <Card className="p-8 bg-slate-900 border-none flex flex-col justify-between text-white">
          <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-4">Total Transaction Volume</p>
          <h4 className="text-3xl font-black italic tracking-tighter">${invoices.filter(i => i.type !== 'CreditNote').reduce((a, b) => a + b.totalAmount, 0).toLocaleString()}</h4>
          <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase">Gross Invoiced Flow</p>
        </Card>
      </div>

      {/* --- GENERATION CENTER HERO --- */}
      <section>
        <Card className="bg-slate-900 border-none shadow-2xl p-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
             <Icons.Sparkles />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Billing Terminal</h2>
              <p className="text-slate-400 text-sm font-medium">Generate strategic billings and manage the full financial lifecycle.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={openManualCreator}
                className="px-8 py-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] border border-slate-700 transition-all"
              >
                Manual Invoice
              </button>
              <button 
                onClick={() => setShowInvoicingConsole(!showInvoicingConsole)}
                className="px-10 py-5 bg-sky-500 hover:bg-sky-400 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95"
              >
                {showInvoicingConsole ? 'Close Console' : 'Generate Invoices'}
              </button>
            </div>
          </div>
        </Card>
      </section>

      {/* --- INVOICING CONSOLE --- */}
      {showInvoicingConsole && (
        <section className="animate-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Live Invoicing Console</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingJobs.length > 0 ? pendingJobs.map(job => {
              const client = getClient(job.clientId);
              return (
                <Card key={job.id} className="p-8 bg-white border border-slate-200 hover:border-sky-500 transition-all shadow-lg hover:shadow-sky-500/5 group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 text-lg group-hover:bg-sky-500 group-hover:text-white transition-colors uppercase">
                      {client?.name[0]}
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{job.scheduledDate}</span>
                  </div>
                  <div className="space-y-1 mb-8">
                    <p className="text-lg font-black text-slate-900 leading-tight">{client?.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{job.serviceType} &bull; {job.estimatedHours}h Total</p>
                  </div>
                  <button 
                    onClick={() => openInvoiceCreator(job)} 
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-sky-600 transition-all shadow-xl"
                  >
                    Draft Invoice
                  </button>
                </Card>
              );
            }) : (
              <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Operational Queue Clear</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- ENHANCED INVOICE LEDGER & FILTER TERMINAL --- */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Historical Financial Ledger</h2>
          <div className="flex flex-wrap gap-3">
             {/* Search */}
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search ID or Client..." 
                  value={ledgerSearch}
                  onChange={e => setLedgerSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-sky-500 outline-none w-48 shadow-sm transition-all"
                />
                <div className="absolute left-3 top-2.5 text-slate-400"><Icons.Plus /></div>
             </div>
             {/* Status Filter */}
             <select 
               value={statusFilter} 
               onChange={e => setStatusFilter(e.target.value)}
               className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-sky-500 outline-none shadow-sm transition-all"
             >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Sent">Sent</option>
                <option value="Draft">Draft</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refunded">Refunded</option>
                <option value="Partially Refunded">Partially Refunded</option>
             </select>
             {/* Client Filter */}
             <select 
               value={clientFilter} 
               onChange={e => setClientFilter(e.target.value)}
               className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-sky-500 outline-none shadow-sm transition-all max-w-[150px]"
             >
                <option value="All">All Clients</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.shortName}</option>)}
             </select>
             {/* Date Filter */}
             <input 
               type="date"
               value={dateFilter}
               onChange={e => setDateFilter(e.target.value)}
               className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-sky-500 outline-none shadow-sm transition-all"
             />
             {/* Reset */}
             {(ledgerSearch || statusFilter !== 'All' || clientFilter !== 'All' || dateFilter) && (
               <button 
                 onClick={() => { setLedgerSearch(''); setStatusFilter('All'); setClientFilter('All'); setDateFilter(''); }}
                 className="px-4 py-2 bg-slate-100 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
               >
                 Reset
               </button>
             )}
          </div>
        </div>

        <Card className="overflow-hidden border-none shadow-xl bg-white rounded-[32px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                  <th className="px-10 py-6">Identity</th>
                  <th className="px-10 py-6">Account Name</th>
                  <th className="px-10 py-6">Total Amount</th>
                  <th className="px-10 py-6">Workflow Status</th>
                  <th className="px-10 py-6 text-right">Operations Terminal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPreviewInvoice(inv)} className="font-black text-slate-900 hover:text-sky-600 transition-colors uppercase tracking-tight">
                          {inv.invoiceNumber}
                        </button>
                        {inv.type === 'CreditNote' && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[7px] font-black uppercase">Credit Note</span>
                        )}
                      </div>
                      <p className="text-[8px] text-slate-400 font-black mt-1 uppercase tracking-widest">{inv.date}</p>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-black text-slate-700">{getClient(inv.clientId)?.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{inv.serviceDescription || 'Mission Settlement'}</p>
                    </td>
                    <td className="px-10 py-6">
                      <p className={`font-black text-sm tabular-nums ${inv.status === 'Cancelled' ? 'text-slate-300 line-through' : inv.type === 'CreditNote' ? 'text-red-500' : 'text-slate-900'}`}>
                        {inv.type === 'CreditNote' ? '-' : ''}${inv.totalAmount.toFixed(2)}
                      </p>
                      {inv.refundAmount ? (
                        <p className="text-[9px] font-black text-red-500 uppercase">-${inv.refundAmount.toFixed(2)} Refunded</p>
                      ) : null}
                    </td>
                    <td className="px-10 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${getStatusTag(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex justify-end gap-2">
                        {/* Collect / Uncollect Toggle - only for Invoices, not Credit Notes (which are assumed paid/reconciled immediately) */}
                        {inv.type !== 'CreditNote' && (inv.status === 'Sent' || inv.status === 'Overdue' || inv.status === 'Draft' || inv.status === 'Paid') && (
                          <button 
                            onClick={() => toggleCollection(inv)} 
                            className={`p-2.5 rounded-xl transition-all border group/btn ${inv.status === 'Paid' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white'}`} 
                            title={inv.status === 'Paid' ? 'Revert to Uncollected' : 'Collect Payment'}
                          >
                            <span className="text-[9px] font-black uppercase px-1">{inv.status === 'Paid' ? 'Uncollect' : 'Collect'}</span>
                          </button>
                        )}
                        
                        {/* Refund Logic - only for paid invoices, not credit notes */}
                        {inv.type !== 'CreditNote' && (inv.status === 'Paid' || inv.status === 'Partially Refunded') && (
                          <button onClick={() => openRefundModal(inv)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100" title="Issue Refund">
                            <span className="text-[9px] font-black uppercase px-1">Refund</span>
                          </button>
                        )}

                        {/* Edit Logic */}
                        {inv.status !== 'Paid' && inv.status !== 'Cancelled' && inv.status !== 'Refunded' && (
                          <button onClick={() => openEditModal(inv)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all border border-slate-200" title="Modify Invoice">
                            <span className="text-[9px] font-black uppercase px-1">Edit</span>
                          </button>
                        )}

                        {/* Void / Reverse Void Toggle */}
                        {inv.status !== 'Paid' && inv.status !== 'Refunded' && inv.status !== 'Partially Refunded' && (
                          <button 
                            onClick={() => toggleVoid(inv)} 
                            className={`p-2.5 rounded-xl transition-all border ${inv.status === 'Cancelled' ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-red-50 hover:text-red-500'}`} 
                            title={inv.status === 'Cancelled' ? 'Reverse Void Action' : 'Void Invoice'}
                          >
                            <span className="text-[9px] font-black uppercase px-1">{inv.status === 'Cancelled' ? 'Reverse Void' : 'Void'}</span>
                          </button>
                        )}

                        <button onClick={() => setPreviewInvoice(inv)} className="p-2.5 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-500 hover:text-white transition-all border border-sky-100" title="View Digital Protocol">
                          <Icons.Sparkles />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-24 text-center text-[10px] font-black text-slate-300 uppercase">No Matching Ledger Entries</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* --- REFUND MODAL --- */}
      {isRefundModalOpen && activeInvoice && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl bg-white rounded-[40px] overflow-hidden p-10 space-y-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Standard Refund Workflow</h3>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Protocol {activeInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setIsRefundModalOpen(false)} className="text-slate-400 text-4xl font-light">&times;</button>
            </div>
            
            <div className="space-y-6">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Refund Magnitude ($)</label>
                  <input 
                    type="number" 
                    max={activeInvoice.totalAmount - (activeInvoice.refundAmount || 0)}
                    className="w-full border-slate-200 border p-4 rounded-2xl text-2xl font-black text-red-600 outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    value={refundForm.amount}
                    onChange={e => setRefundForm({...refundForm, amount: parseFloat(e.target.value)})}
                  />
                  <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Max Available: ${(activeInvoice.totalAmount - (activeInvoice.refundAmount || 0)).toFixed(2)}</p>
               </div>
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Strategic Justification</label>
                  <textarea 
                    className="w-full border-slate-200 border p-4 rounded-2xl text-xs font-medium outline-none h-24"
                    value={refundForm.reason}
                    onChange={e => setRefundForm({...refundForm, reason: e.target.value})}
                  />
               </div>
            </div>

            <div className="space-y-4">
              <p className="text-[9px] text-slate-400 font-bold uppercase text-center leading-relaxed">
                Clicking authorize will update the original invoice AND generate a formal Credit Note (Storno) for accounting reconciliation.
              </p>
              <button onClick={handleProcessRefund} className="w-full py-5 bg-red-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-500/20 hover:bg-red-700 transition-all">
                Authorize Reversal & Credit Note
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* --- EDIT INVOICE MODAL --- */}
      {isEditModalOpen && activeInvoice && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl bg-white rounded-[40px] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center text-slate-900 bg-slate-50">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Ledger Modification</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice {activeInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 text-4xl font-light">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 space-y-8">
               <div className="grid grid-cols-2 gap-8">
                 <div className="col-span-2">
                   <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Service Line / Description</label>
                   <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold" value={editForm.serviceDescription || ''} onChange={e => setEditForm({...editForm, serviceDescription: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Issue Date</label>
                   <input type="date" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Due Date</label>
                   <input type="date" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black" value={editForm.dueDate || ''} onChange={e => setEditForm({...editForm, dueDate: e.target.value})} />
                 </div>
                 <div className="col-span-2 border-t border-slate-100 pt-8 mt-4">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Internal Ledger Notes</p>
                    <textarea className="w-full border-slate-200 border p-4 rounded-2xl text-xs font-medium min-h-[100px]" value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
                 </div>
               </div>
            </div>

            <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-4">
               <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Abort</button>
               <button onClick={handleUpdateEdit} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">Commit Changes</button>
            </div>
          </Card>
        </div>
      )}

      {/* --- INVOICE PREVIEWER --- */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[600] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[90vh] flex flex-col bg-slate-100 rounded-[48px] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white">
               <div>
                 <h2 className="text-xl font-black uppercase tracking-tight">
                   {previewInvoice.type === 'CreditNote' ? 'Digital Credit Note' : 'Digital Service Protocol'}
                 </h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Electronic Settlement Record</p>
               </div>
               <button onClick={() => setPreviewInvoice(null)} className="text-slate-400 hover:text-slate-900 text-3xl font-light">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 flex justify-center bg-slate-200/50">
               <Card className="w-full max-w-[210mm] bg-white shadow-2xl p-16 flex flex-col min-h-[297mm] border-none">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-20">
                     <div className="space-y-4">
                        <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-white"><Icons.Sparkles /></div>
                        <div>
                          <p className="text-lg font-black tracking-tighter uppercase italic">SparkleFlow GmbH</p>
                          <p className="text-[10px] font-medium text-slate-500">Service Road 42, 10115 Berlin</p>
                          <p className="text-[10px] font-medium text-slate-500">VAT ID: DE991288331</p>
                        </div>
                     </div>
                     <div className="text-right space-y-1">
                        <h1 className={`text-5xl font-black uppercase tracking-tighter ${previewInvoice.type === 'CreditNote' ? 'text-red-600' : 'text-slate-900'}`}>
                          {previewInvoice.type === 'CreditNote' ? 'Credit Note' : 'Invoice'}
                        </h1>
                        <p className={`text-sm font-black tracking-widest ${previewInvoice.type === 'CreditNote' ? 'text-red-500' : 'text-sky-600'}`}>{previewInvoice.invoiceNumber}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter mt-2 border ${getStatusTag(previewInvoice.status)}`}>{previewInvoice.status}</span>
                     </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-2 gap-20 mb-20">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Billing To</p>
                        <p className="text-sm font-black text-slate-900">{getClient(previewInvoice.clientId)?.name}</p>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed mt-1">
                          {getClient(previewInvoice.clientId)?.street}<br />
                          {getClient(previewInvoice.clientId)?.zipCity}
                        </p>
                     </div>
                     <div className="text-right">
                        <div className="space-y-3">
                           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Document Date</p><p className="text-xs font-black text-slate-900">{previewInvoice.date}</p></div>
                           {previewInvoice.type !== 'CreditNote' && (
                             <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due Date</p><p className="text-xs font-black text-slate-900">{previewInvoice.dueDate}</p></div>
                           )}
                           {previewInvoice.parentInvoiceId && (
                             <div className="pt-2"><p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Reference Doc</p><p className="text-[10px] font-black text-slate-900">Orig. Inv: {invoices.find(i => i.id === previewInvoice.parentInvoiceId)?.invoiceNumber}</p></div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Items */}
                  <table className="w-full mb-20">
                     <thead>
                        <tr className={`border-b-2 text-[10px] font-black uppercase tracking-widest ${previewInvoice.type === 'CreditNote' ? 'border-red-600 text-red-600' : 'border-slate-900 text-slate-900'}`}>
                           <th className="text-left py-4">Manifest Description</th>
                           <th className="text-center py-4">Quantity</th>
                           <th className="text-right py-4">Unit Rate</th>
                           <th className="text-right py-4">Amount</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        <tr>
                           <td className="py-6">
                              <p className="text-sm font-black text-slate-900">{previewInvoice.serviceDescription || 'Cleaning Mission Execution'}</p>
                              {previewInvoice.type === 'CreditNote' && (
                                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Adjustment for previously billed services</p>
                              )}
                           </td>
                           <td className="py-6 text-center text-sm font-bold text-slate-700">1.00</td>
                           <td className="py-6 text-right text-sm font-bold text-slate-700">${previewInvoice.subtotal.toFixed(2)}</td>
                           <td className={`py-6 text-right text-sm font-black ${previewInvoice.type === 'CreditNote' ? 'text-red-500' : 'text-slate-900'}`}>
                             {previewInvoice.type === 'CreditNote' ? '-' : ''}${previewInvoice.subtotal.toFixed(2)}
                           </td>
                        </tr>
                     </tbody>
                  </table>

                  {/* Totals */}
                  <div className="ml-auto w-64 space-y-4 pt-10 border-t border-slate-100">
                     <div className="flex justify-between text-xs font-bold text-slate-500"><span>Subtotal</span><span>${previewInvoice.subtotal.toFixed(2)}</span></div>
                     <div className="flex justify-between text-xs font-bold text-slate-500"><span>Tax ({previewInvoice.taxRate}%)</span><span>${previewInvoice.taxAmount.toFixed(2)}</span></div>
                     {previewInvoice.discount > 0 && <div className="flex justify-between text-xs font-black text-red-600"><span>Discount</span><span>-${previewInvoice.discount.toFixed(2)}</span></div>}
                     <div className={`flex justify-between text-lg font-black pt-4 border-t-2 ${previewInvoice.type === 'CreditNote' ? 'text-red-600 border-red-600' : 'text-slate-900 border-slate-900'}`}>
                       <span>{previewInvoice.type === 'CreditNote' ? 'Credit Amount' : 'Final Total'}</span>
                       <span>{previewInvoice.type === 'CreditNote' ? '-' : ''}${previewInvoice.totalAmount.toFixed(2)}</span>
                     </div>
                     {previewInvoice.refundAmount && previewInvoice.type !== 'CreditNote' ? (
                       <div className="flex justify-between text-xs font-black text-red-600 italic"><span>Refunded To Client</span><span>-${previewInvoice.refundAmount.toFixed(2)}</span></div>
                     ) : null}
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-20 border-t border-slate-50 text-center">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
                       {previewInvoice.type === 'CreditNote' ? 'This document serves as a standard storno/credit notification.' : 'Payment methods: Wire Transfer / Direct Debit / Stripe Flow'}
                     </p>
                     <p className="text-[8px] font-medium text-slate-400 mt-2">SparkleFlow Enterprise Financial Intelligence Terminal</p>
                  </div>
               </Card>
            </div>
          </div>
        </div>
      )}

      {/* --- INVOICE GENERATOR MODAL (AUTOMATED) --- */}
      {isModalOpen && activeJob && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl bg-white rounded-[48px] overflow-hidden border-none flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-slate-900">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Mission Settlement</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manual Invoice Validation Terminal</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-5xl font-light hover:text-slate-900 transition-colors">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Entity</p>
                  <p className="text-2xl font-black text-slate-900 leading-tight">{getClient(activeJob.clientId)?.name}</p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Reference</p>
                  <p className="text-sm font-black text-slate-900">{activeJob.serviceType} Mission</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-y border-slate-100 py-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Service Rate ($/hr)</label>
                    <input disabled className="w-full border-slate-100 bg-slate-50 border p-4 rounded-2xl text-sm font-black text-slate-400" value={getClient(activeJob.clientId)?.serviceRate || 40} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Hours Logged</label>
                    <input disabled className="w-full border-slate-100 bg-slate-50 border p-4 rounded-2xl text-sm font-black text-slate-400" value={activeJob.estimatedHours} />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Applied Tax (%)</label>
                    <input type="number" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black text-sky-600" value={form.taxRate} onChange={e => setForm({...form, taxRate: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Discount Adjustment ($)</label>
                    <input type="number" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black text-red-600" value={form.discount} onChange={e => setForm({...form, discount: parseFloat(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl flex justify-between items-center text-white">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400 mb-1">Final Settlement Amount</p>
                  <p className="text-4xl font-black italic tracking-tighter">
                    ${((activeJob.estimatedHours * (getClient(activeJob.clientId)?.serviceRate || 40) - form.discount) * (1 + form.taxRate / 100)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-6">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
              <button onClick={handleCreateAutomated} className="flex-1 py-5 bg-slate-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all">Authorize & Generate</button>
            </div>
          </Card>
        </div>
      )}

      {/* --- MANUAL INVOICE GENERATOR MODAL --- */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl bg-white rounded-[48px] overflow-hidden border-none flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 bg-slate-900 flex justify-between items-center text-white">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Manual Invoicing Terminal</h3>
                <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mt-1">One-off Financial Ledger Entry</p>
              </div>
              <button onClick={() => setIsManualModalOpen(false)} className="text-white text-5xl font-light hover:text-sky-400 transition-colors">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-hide">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Account Select*</label>
                  <select 
                    className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    value={manualForm.clientId}
                    onChange={e => setManualForm({...manualForm, clientId: e.target.value})}
                  >
                    <option value="">Choose Billing Entity...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Service Manifest / Description</label>
                  <input 
                    className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50 focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    placeholder="e.g. Additional Deep Clean, Materials, etc."
                    value={manualForm.serviceDescription}
                    onChange={e => setManualForm({...manualForm, serviceDescription: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Quantity / Hours</label>
                  <input 
                    type="number"
                    className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50"
                    value={manualForm.quantity}
                    onChange={e => setManualForm({...manualForm, quantity: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Unit Rate ($)</label>
                  <input 
                    type="number"
                    className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50"
                    value={manualForm.rate}
                    onChange={e => setManualForm({...manualForm, rate: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Tax Rate (%)</label>
                  <input 
                    type="number"
                    className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black text-sky-600 bg-slate-50"
                    value={manualForm.taxRate}
                    onChange={e => setManualForm({...manualForm, taxRate: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Discount Amount ($)</label>
                  <input 
                    type="number"
                    className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black text-red-600 bg-slate-50"
                    value={manualForm.discount}
                    onChange={e => setManualForm({...manualForm, discount: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Manual Settlement</p>
                  <p className="text-3xl font-black text-slate-900">
                    ${((manualForm.quantity * manualForm.rate - manualForm.discount) * (1 + manualForm.taxRate / 100)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-6">
              <button onClick={() => setIsManualModalOpen(false)} className="flex-1 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all">Discard</button>
              <button onClick={handleCreateManual} className="flex-1 py-5 bg-sky-500 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-sky-600 transition-all">Commit to Ledger</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
