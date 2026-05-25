import React, { useState } from 'react';
import { Search, Info, HelpCircle } from 'lucide-react';

interface SearchStageProps {
  initialSearch: string;
  onSearchSubmit: (query: string) => void;
  addToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

const PRESET_QUERIES = [
  { text: 'guantes de látex caja 100', label: 'Guantes Látex' },
  { text: 'paracetamol mg tableta', label: 'Paracetamol' },
  { text: 'jeringa de plastico 3 ml', label: 'Jeringa 3ml' },
  { text: 'reactivo fijador radiográfico', label: 'Reactivo RX' },
];

export default function SearchStage({ initialSearch, onSearchSubmit, addToast }: SearchStageProps) {
  const [query, setQuery] = useState(initialSearch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      addToast('Por favor, escriba una descripción válida para iniciar la búsqueda.', 'warning');
      return;
    }
    if (query.trim().length < 3) {
      addToast('La consulta de búsqueda debe tener al menos 3 caracteres.', 'info');
      return;
    }
    onSearchSubmit(query.trim());
  };

  const handlePresetClick = (q: string) => {
    setQuery(q);
    onSearchSubmit(q);
  };

  return (
    <div className="max-w-3xl mx-auto py-4" id="search-stage-container">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-850 tracking-tight" id="search-title">
          Verificador de Claves y Duplicados
        </h2>
        <p className="text-slate-500 mt-2 text-xs sm:text-sm max-w-xl mx-auto">
          Antes de proponer una nueva clave institucional, es mandatorio verificar que no exista un artículo similar o sustituto para mantener la coherencia técnica del catálogo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10" id="search-form">
        <div className="relative flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-700 transition-all">
          <div className="pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            className="w-full pl-3 pr-28 py-3 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none text-sm md:text-base font-medium"
            placeholder="Ej: guantes de látex caja 100..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="catalog-search-input"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white px-5 rounded-lg font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
            id="search-action-btn"
          >
            Verificar
          </button>
        </div>

        {/* Normative badge below the search input */}
        <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
          <span className="inline-flex bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
            Regla 2.5
          </span>
          <span>Es obligatorio consultar el catálogo vigente antes de solicitar una nueva clave.</span>
        </p>

        {/* Preset quick queries */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
          <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Sugerencias rápidas:</span>
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset.text)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-slate-200 hover:border-slate-300"
              id={`preset-btn-${idx}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </form>

      {/* Normative reminder block */}
      <div 
        className="mt-12 bg-amber-50/50 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-xs flex gap-4"
        id="normative-panel"
      >
        <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-amber-900 tracking-tight uppercase">
            REGLAMENTO PARA LA ADQUISICIÓN DE BIENES
          </h4>
          <p className="text-xs text-amber-800 mt-1.5 leading-relaxed font-medium">
            Conforme a la normativa interna del <strong className="font-bold text-amber-950">Hospital Civil de Guadalajara (Artículo 42)</strong>, todo personal administrativo u operativo que solicite la compra de materiales o suministros debe pasar primeramente por la validación de clave homóloga.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-xs text-amber-800 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
              Garantiza la unificación de marcas, presentaciones e insumos estandarizados.
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
              Evita el desperdicio presupuestario y la proliferación innecesaria de almacenes.
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
              Garantiza auditorías técnicas limpias y simplificadas para el hospital.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
