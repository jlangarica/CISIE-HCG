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
    <div className="max-w-3xl mx-auto px-4 py-8" id="search-stage-container">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight" id="search-title">
          Consulta de Catálogo Institucional
        </h2>
        <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto">
          Antes de proponer una nueva clave institucional, es mandatorio verificar que no exista un artículo similar o sustituto para mantener la eficiencia logística.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10" id="search-form">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-32 py-4 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none text-base transition-all"
            placeholder="Escriba el artículo a buscar (ej: guantes desechables 50 piezas)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="catalog-search-input"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 bg-[#1e293b] hover:bg-slate-800 text-white px-5 rounded-xl font-medium text-sm transition-colors shadow-sm"
            id="search-action-btn"
          >
            Consultar
          </button>
        </div>

        {/* Preset quick queries */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-400">Búsquedas sugeridas:</span>
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset.text)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-300"
              id={`preset-btn-${idx}`}
            >
              "{preset.label}"
            </button>
          ))}
        </div>
      </form>

      {/* Normative reminder block */}
      <div 
        className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs flex gap-4"
        id="normative-panel"
      >
        <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-900 tracking-tight uppercase flex items-center gap-1.5">
            REGLAMENTO PARA LA ADQUISICIÓN DE BIENES
          </h4>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            Conforme a la normativa interna del <strong className="font-semibold text-amber-950">Hospital Civil de Guadalajara (Artículo 42)</strong>, todo personal administrativo u operativo que solicite la compra de materiales o suministros debe pasar primeramente por la validación de clave homóloga.
          </p>
          <div className="mt-3 flex flex-col gap-1.5 text-xs text-amber-700">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Garantiza la unificación de marcas y especificaciones.
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Reduce los tiempos de compra al evitar la creación innecesaria de almacén.
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Optimiza el presupuesto anual del hospital.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
