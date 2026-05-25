import React from 'react';
import { SearchCheck } from 'lucide-react';

export default function Header() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4" id="hcg-app-header">
      {/* Institutional Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-4 self-start sm:self-auto">
          <img
            src="https://portal.hcg.gob.mx/hcg/sites/hcgtransparencia.dd/files/styles/boletines_galeria_eventos/public/imgEventosCS/Logotipo%20HCG_17.jpg?itok=Hix5xedr"
            alt="Logo HCG"
            className="h-12 w-auto object-contain rounded shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-950 tracking-wider uppercase">
              OPD Hospital Civil de Guadalajara
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">
              División de Servicios Administrativos
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 self-end sm:self-auto text-right">
          <div className="hidden sm:block">
            <span className="text-[10px] block text-slate-400 uppercase tracking-widest font-bold">Usuario Conectado</span>
            <span className="text-xs font-semibold text-slate-700">Dr. Julián Ramírez Pérez</span>
          </div>
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            CISIE
          </span>
        </div>
      </div>

      {/* Hero Title Section */}
      <div className="text-center my-4 sm:my-8">
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2 sm:gap-3">
          <SearchCheck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 shrink-0" />
          <span>Catálogo de Bienes, Servicios y Activos</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium max-w-2xl mx-auto">
          Comité de Insumos, Servicios, Infraestructura y Equipamiento
        </p>
      </div>
    </div>
  );
}
