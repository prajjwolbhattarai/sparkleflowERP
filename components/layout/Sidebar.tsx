
import React from 'react';
import { Icons } from '../../constants';

interface SidebarProps {
  currentView: string;
  setView: (v: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: Icons.Dashboard },
    { id: 'crm', label: 'Clients (CRM)', Icon: Icons.Clients },
    { id: 'employees', label: 'Employees', Icon: Icons.Users },
    { id: 'payroll', label: 'Payroll Hub', Icon: Icons.Sparkles },
    { id: 'jobs', label: 'Work Orders', Icon: Icons.Calendar },
    { id: 'billing', label: 'Billing & Invoices', Icon: Icons.Dashboard }, 
    { id: 'field', label: 'Field Missions', Icon: Icons.Sparkles },
    { id: 'reports', label: 'Intelligence', Icon: Icons.Users },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-10 shadow-2xl">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="p-2 bg-sky-500 rounded-lg text-white">
          <Icons.Sparkles />
        </div>
        <span className="font-bold text-xl tracking-tight">SparkleFlow</span>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === item.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.Icon />
            <span className="font-medium text-xs font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 p-4 rounded-2xl text-[10px] text-slate-400 border border-slate-700/50">
          <p className="font-black text-slate-300 mb-1 uppercase tracking-widest">Enterprise v5.2</p>
          <div className="flex items-center gap-2 mt-2">
             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
             <span>Financial Core Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
