import React from 'react';
import { Building2, ShieldAlert } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-[#1e293b] text-white border-b border-slate-700 shadow-sm" id="hcg-app-header">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-700 text-white p-2.5 rounded-lg flex items-center justify-center shadow-inner" id="hcg-shield-logo">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-widest text-red-500 uppercase">HCG</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              <span className="text-xs font-medium text-slate-400">Hospital Civil de Guadalajara</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight" id="main-title">
              Verificador de Catálogo Institucional
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#111827] px-4 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300">
          <ShieldAlert className="w-4 h-4 text-amber-500 inline-block shrink-0 animate-pulse" />
          <span>Filtro Normativo Contra Duplicados (Art. 42 LADS)</span>
        </div>
      </div>
    </header>
  );
}
