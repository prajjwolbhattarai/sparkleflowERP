
import React, { useState } from 'react';
import { Client, CustomerType, Job, Invoice, ServiceType } from '../../types';
import { Card } from '../../components/shared/Card';
import { Header } from '../../components/layout/Header';
import { Icons } from '../../constants';

interface CRMViewProps {
  clients: Client[];
  onAddClient: (c: Client) => void;
  onUpdateClient: (c: Client) => void;
  onDeleteClient: (id: string) => void;
  jobs?: Job[];
  invoices?: Invoice[];
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const CRMView: React.FC<CRMViewProps> = ({ 
  clients, 
  onAddClient, 
  onUpdateClient, 
  onDeleteClient,
  jobs = [],
  invoices = []
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClientForDossier, setSelectedClientForDossier] = useState<Client | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<'overview' | 'work' | 'finance' | 'intel'>('overview');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'lifecycle' | 'contact' | 'logistics' | 'invoicing'>('basic');
  const [formData, setFormData] = useState<Partial<Client>>({
    customerType: 'Company',
    status: 'Interested party',
    tags: [],
    preferredCleanupDays: [],
    recommendedStartTime: '08:00',
    recommendedHours: 2,
    staffNeeded: 1,
    serviceRate: 40,
    billingCycle: 'Immediate'
  });

  const openCreateModal = () => {
    setFormData({ 
      customerType: 'Company', 
      status: 'Interested party', 
      tags: [], 
      preferredCleanupDays: [],
      recommendedStartTime: '08:00',
      recommendedHours: 2,
      staffNeeded: 1,
      serviceRate: 40,
      billingCycle: 'Immediate',
      createdAt: new Date().toISOString().split('T')[0]
    });
    setIsEditMode(false);
    setIsModalOpen(true);
    setActiveTab('basic');
  };

  const openEditModal = (client: Client) => {
    setFormData(client);
    setIsEditMode(true);
    setIsModalOpen(true);
    setActiveTab('basic');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && formData.id) {
      onUpdateClient(formData as Client);
    } else {
      const newClient: Client = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      } as Client;
      onAddClient(newClient);
    }
    setIsModalOpen(false);
  };

  const toggleDay = (day: string) => {
    const current = formData.preferredCleanupDays || [];
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    setFormData({ ...formData, preferredCleanupDays: updated });
  };

  const filteredClients = clients.filter(c => {
    const matchesArchive = !c.isArchived;
    const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (c.shortName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || c.customerType === typeFilter;
    return matchesArchive && matchesSearch && matchesType;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <Header title="Client Database" />
        <button onClick={openCreateModal} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-black shadow-xl">
          <Icons.Plus /> Register New Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="col-span-2 relative">
          <input type="text" placeholder="Search by name or short name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all" />
          <div className="absolute left-3.5 top-3.5 text-slate-400"><Icons.Plus /></div>
        </div>
        <div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none">
            <option value="All">All Entities</option>
            <option value="Company">Company</option>
            <option value="Individual">Individual</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Identity</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5">
                    <button onClick={() => setSelectedClientForDossier(client)} className="text-left group">
                      <p className="text-sm font-black text-slate-900 group-hover:text-sky-600 transition-colors">{client.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{client.shortName} &bull; {client.customerType}</p>
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-slate-600 truncate max-w-xs">{client.street}, {client.zipCity}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">{client.status}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => openEditModal(client)} className="text-sky-600 font-black text-[10px] uppercase hover:underline">Modify</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Client Dossier (Detail View) */}
      {selectedClientForDossier && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 lg:p-12">
          <Card className="w-full h-full max-w-7xl shadow-2xl bg-white rounded-[48px] overflow-hidden flex flex-col border-none">
            <div className="p-10 border-b border-slate-100 flex justify-between items-start">
              <div className="flex gap-8 items-center">
                <div className="w-20 h-20 bg-slate-900 text-white rounded-[32px] flex items-center justify-center text-3xl font-black uppercase shadow-2xl">
                  {selectedClientForDossier.name?.[0]}
                </div>
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedClientForDossier.name}</h2>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[10px] font-black bg-sky-50 text-sky-600 px-3 py-1 rounded-full uppercase tracking-widest border border-sky-100">{selectedClientForDossier.customerType}</span>
                    <span className="text-[10px] font-black bg-slate-50 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-100">{selectedClientForDossier.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedClientForDossier(null)} className="p-4 hover:bg-slate-100 rounded-2xl text-slate-400 text-3xl font-light transition-all">&times;</button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-72 bg-slate-50 border-r border-slate-100 p-8 flex flex-col gap-3">
                {[
                  { id: 'overview', label: 'Overview', icon: Icons.Dashboard },
                  { id: 'work', label: 'Work History', icon: Icons.Calendar },
                  { id: 'finance', label: 'Invoices', icon: Icons.Dashboard },
                  { id: 'intel', label: 'Logistics Info', icon: Icons.Sparkles },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveDossierTab(tab.id as any)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeDossierTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-white hover:text-slate-600'}`}
                  >
                    <tab.icon /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-white scrollbar-hide">
                {activeDossierTab === 'overview' && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Base Hourly Rate</p>
                         <h4 className="text-3xl font-black text-slate-900">${selectedClientForDossier.serviceRate}/hr</h4>
                       </div>
                       <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Site Area</p>
                         <h4 className="text-3xl font-black text-sky-600">{selectedClientForDossier.cleanupArea || 'N/A'}</h4>
                       </div>
                       <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billing Cycle</p>
                         <h4 className="text-3xl font-black text-emerald-600 uppercase tracking-tighter">{selectedClientForDossier.billingCycle || 'Immediate'}</h4>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Account Metadata</h3>
                        <div className="space-y-4">
                           <div className="flex justify-between border-b border-slate-100 pb-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Debtor Number</span>
                             <span className="text-xs font-black text-slate-900">{selectedClientForDossier.debtorNumber || 'Standard'}</span>
                           </div>
                           <div className="flex justify-between border-b border-slate-100 pb-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Routing Reference</span>
                             <span className="text-xs font-black text-slate-900">{selectedClientForDossier.referenceNumber || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between border-b border-slate-100 pb-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase">VAT ID</span>
                             <span className="text-xs font-black text-slate-900">{selectedClientForDossier.vatId || 'None'}</span>
                           </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Communication</h3>
                        <div className="space-y-4">
                           <div className="flex justify-between border-b border-slate-100 pb-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Primary Email</span>
                             <span className="text-xs font-black text-slate-900">{selectedClientForDossier.email}</span>
                           </div>
                           <div className="flex justify-between border-b border-slate-100 pb-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Phone Manifest</span>
                             <span className="text-xs font-black text-slate-900">{selectedClientForDossier.phone}</span>
                           </div>
                           <div className="flex justify-between border-b border-slate-100 pb-3">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Deploy Location</span>
                             <span className="text-xs font-black text-slate-900">{selectedClientForDossier.street}, {selectedClientForDossier.zipCity}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'work' && (
                  <div className="animate-in fade-in duration-500 space-y-8">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Historical Mission Log</h3>
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Protocol</th><th className="px-6 py-4">Status</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {jobs.filter(j => j.clientId === selectedClientForDossier.id).map(job => (
                           <tr key={job.id} className="text-sm font-bold text-slate-700">
                             <td className="px-6 py-4">{job.scheduledDate}</td>
                             <td className="px-6 py-4">{job.serviceType}</td>
                             <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-[9px] uppercase font-black">{job.status}</span></td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
                )}

                {activeDossierTab === 'finance' && (
                  <div className="animate-in fade-in duration-500 space-y-8">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">Financial Ledger</h3>
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <tr><th className="px-6 py-4">Invoice #</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">Status</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {invoices.filter(i => i.clientId === selectedClientForDossier.id).map(inv => (
                           <tr key={inv.id} className="text-sm font-bold text-slate-700">
                             <td className="px-6 py-4 font-black">{inv.invoiceNumber}</td>
                             <td className="px-6 py-4">{inv.date}</td>
                             <td className="px-6 py-4 text-emerald-600 font-black">${inv.totalAmount.toFixed(2)}</td>
                             <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] uppercase font-black">{inv.status}</span></td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
                )}

                {activeDossierTab === 'intel' && (
                  <div className="animate-in fade-in duration-500 space-y-12">
                     <div className="grid grid-cols-2 gap-12">
                       <div className="space-y-6">
                         <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-amber-500 pl-4">Site Intelligence</h3>
                         <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100"><p className="text-[10px] font-black text-amber-600 uppercase mb-2">Cleaner Access Notes</p><p className="text-sm italic text-slate-700">"{selectedClientForDossier.incidentSiteNotes || 'None'}"</p></div>
                         {selectedClientForDossier.warning && (
                           <div className="p-6 bg-red-50 rounded-3xl border-2 border-red-200 animate-pulse"><p className="text-[10px] font-black text-red-600 uppercase mb-2">High Priority Warning</p><p className="text-sm font-black text-red-700 uppercase">{selectedClientForDossier.warning}</p></div>
                         )}
                       </div>
                       <div className="space-y-6">
                         <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-sky-500 pl-4">Service Parameters</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center"><p className="text-[9px] font-black text-slate-400 uppercase">Recommended Hrs</p><p className="text-lg font-black text-slate-900">{selectedClientForDossier.recommendedHours}h</p></div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center"><p className="text-[9px] font-black text-slate-400 uppercase">Staff Payload</p><p className="text-lg font-black text-slate-900">{selectedClientForDossier.staffNeeded} pers</p></div>
                         </div>
                         <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Preferred Cleanup Days</p><p className="text-xs font-black text-slate-900">{selectedClientForDossier.preferredCleanupDays?.join(', ') || 'N/A'}</p></div>
                       </div>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Account Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <Card className="w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border-none overflow-hidden bg-white rounded-[48px]">
             <div className="p-10 border-b border-slate-100 flex justify-between items-center text-slate-900">
               <div>
                 <h2 className="text-3xl font-black uppercase tracking-tight">{isEditMode ? 'Modify Account Protocol' : 'Initialize New Account'}</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Enterprise Customer Resource Mapping</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-4xl font-light hover:text-slate-900 transition-colors">&times;</button>
             </div>

             <div className="flex bg-slate-50 px-10 py-3 border-b border-slate-100 gap-4 overflow-x-auto scrollbar-hide">
               {[
                 {id:'basic', label:'Basic Data'}, 
                 {id:'address', label:'Address & Info'}, 
                 {id:'lifecycle', label:'Status & CSR'}, 
                 {id:'contact', label:'Communication'}, 
                 {id:'logistics', label:'Field Logistics'}, 
                 {id:'invoicing', label:'Billing Terminal'}
               ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600'}`}>
                   {tab.label}
                 </button>
               ))}
             </div>

             <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-hide">
                {activeTab === 'basic' && (
                  <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Short Name*</label>
                      <input required className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50/50" value={formData.shortName || ''} onChange={e => setFormData({...formData, shortName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Customer Type</label>
                      <select className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50/50" value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value as any})}>
                        <option value="Company">Company</option>
                        <option value="Individual">Individual</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Full Legal Name*</label>
                      <input required className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50/50" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                  </div>
                )}

                {activeTab === 'address' && (
                  <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Street</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">ZIP / City</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.zipCity || ''} onChange={e => setFormData({...formData, zipCity: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Address Suffix (e.g. Backyard, 3rd Floor)</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.addressSuffix || ''} onChange={e => setFormData({...formData, addressSuffix: e.target.value})} />
                    </div>
                  </div>
                )}

                {activeTab === 'lifecycle' && (
                  <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Account Status</label>
                      <select className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="Interested party">Interested party</option>
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">CSR (Representative)</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.csr || ''} onChange={e => setFormData({...formData, csr: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Customer Since</label>
                      <input type="date" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.customerSince || ''} onChange={e => setFormData({...formData, customerSince: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Customer Until</label>
                      <input type="date" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.customerUntil || ''} onChange={e => setFormData({...formData, customerUntil: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Tags (Separated by commas)</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" placeholder="VIP, Weekly, Commercial..." value={formData.tags?.join(', ') || ''} onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(s => s.trim())})} />
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Homepage</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.homepage || ''} onChange={e => setFormData({...formData, homepage: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Email Address</label>
                      <input type="email" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Phone (Landline)</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Mobile Number</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Fax Number</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.fax || ''} onChange={e => setFormData({...formData, fax: e.target.value})} />
                    </div>
                  </div>
                )}

                {activeTab === 'logistics' && (
                  <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                       <div className="col-span-1">
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Cleanup Area (sqm)</label>
                          <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50/50" value={formData.cleanupArea || ''} onChange={e => setFormData({...formData, cleanupArea: e.target.value})} />
                       </div>
                       <div className="col-span-1">
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Rec. Start Time</label>
                          <input type="time" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50/50" value={formData.recommendedStartTime || '08:00'} onChange={e => setFormData({...formData, recommendedStartTime: e.target.value})} />
                       </div>
                       <div className="col-span-1">
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Rec. Hours Needed</label>
                          <input type="number" step="0.5" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50/50" value={formData.recommendedHours} onChange={e => setFormData({...formData, recommendedHours: parseFloat(e.target.value)})} />
                       </div>
                       <div className="col-span-1">
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Staff Payload</label>
                          <input type="number" className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-black bg-slate-50/50" value={formData.staffNeeded} onChange={e => setFormData({...formData, staffNeeded: parseInt(e.target.value)})} />
                       </div>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Preferred Cleanup Days</label>
                       <div className="flex flex-wrap gap-2">
                         {WEEKDAYS.map(day => (
                           <button type="button" key={day} onClick={() => toggleDay(day)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.preferredCleanupDays?.includes(day) ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-sky-400 hover:text-sky-600'}`}>
                             {day}
                           </button>
                         ))}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                      <div className="space-y-6">
                         <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Brief Information</label>
                           <textarea className="w-full bg-white border-slate-200 border p-4 rounded-2xl text-xs font-medium min-h-[100px] outline-none" value={formData.briefInfo || ''} onChange={e => setFormData({...formData, briefInfo: e.target.value})} />
                         </div>
                         <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                           <label className="block text-[10px] font-black text-amber-600 uppercase mb-3 tracking-widest">Incident Site Notes (Cleaner App)</label>
                           <textarea className="w-full bg-white border-amber-200 border p-4 rounded-2xl text-xs font-bold text-amber-900 min-h-[120px] outline-none" placeholder="Gate codes, key locations..." value={formData.incidentSiteNotes || ''} onChange={e => setFormData({...formData, incidentSiteNotes: e.target.value})} />
                         </div>
                      </div>
                      <div className="flex flex-col justify-end">
                        <div className="p-8 bg-red-50 rounded-[40px] border-2 border-red-200 shadow-xl shadow-red-500/10">
                           <label className="block text-[11px] font-black text-red-600 uppercase mb-4 tracking-widest flex items-center gap-2"><Icons.Sparkles /> Critical Warning Protocol</label>
                           <input className="w-full bg-white border-red-200 border p-5 rounded-2xl text-sm font-black text-red-700 outline-none placeholder:text-red-200" placeholder="HIGH PRIORITY ALERT FOR FIELD STAFF" value={formData.warning || ''} onChange={e => setFormData({...formData, warning: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'invoicing' && (
                  <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="col-span-2 p-8 bg-slate-900 rounded-[40px] text-white space-y-6 mb-4">
                       <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Automated Billing Configuration</h4>
                       <div className="grid grid-cols-2 gap-8">
                          <div>
                             <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Billing Frequency</label>
                             <select className="w-full bg-slate-800 border-slate-700 border p-4 rounded-2xl text-sm font-black text-white outline-none focus:border-sky-500 transition-all" value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value as any})}>
                                <option value="Immediate">Immediate (Post-Mission)</option>
                                <option value="Weekly">Weekly (Every Monday)</option>
                                <option value="Monthly">Monthly (1st of Month)</option>
                                <option value="Manual">Manual Only</option>
                             </select>
                          </div>
                          <div>
                             <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Base Hourly Rate ($/hr)</label>
                             <input type="number" className="w-full bg-slate-800 border-slate-700 border p-4 rounded-2xl text-sm font-black text-emerald-400" value={formData.serviceRate} onChange={e => setFormData({...formData, serviceRate: parseFloat(e.target.value)})} />
                          </div>
                       </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">VAT ID Number</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.vatId || ''} onChange={e => setFormData({...formData, vatId: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Debtor Number</label>
                      <input className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-bold bg-slate-50/50" value={formData.debtorNumber || ''} onChange={e => setFormData({...formData, debtorNumber: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Instructions for Invoicing</label>
                      <textarea className="w-full border-slate-200 border p-4 rounded-2xl text-sm font-medium bg-slate-50/50 min-h-[120px] outline-none" placeholder="Displayed during the billing process..." value={formData.invoicingInstructions || ''} onChange={e => setFormData({...formData, invoicingInstructions: e.target.value})} />
                    </div>
                  </div>
                )}
             </form>

             <div className="p-10 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
               <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-200 transition-all">Discard Changes</button>
               <button onClick={handleSubmit} className="px-14 py-4 bg-slate-900 text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95">
                 {isEditMode ? 'Commit Update' : 'Initialize Account'}
               </button>
             </div>
          </Card>
        </div>
      )}
    </div>
  );
};
