
import React from 'react';

export const Header: React.FC<{ title: string }> = ({ title }) => (
  <header className="mb-8 flex items-center justify-between">
    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
    <div className="flex gap-4">
      <div className="relative">
        <input 
          type="text" 
          placeholder="Quick search..." 
          className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-64 transition-all"
        />
        <div className="absolute left-3 top-2.5 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>
    </div>
  </header>
);
