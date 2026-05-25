import React, { useState } from 'react';
import { ChevronLeft, ArrowRight, ShieldCheck, Landmark } from 'lucide-react';

interface ResponsibilityStageProps {
  onBack: () => void;
  onNext: () => void;
  addToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function ResponsibilityStage({ onBack, onNext, addToast }: ResponsibilityStageProps) {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);

  const areAllChecked = checked1 && checked2 && checked3;

  const handleNextSubmit = () => {
    if (!areAllChecked) {
      addToast('Debe marcar todas las declaraciones obligatorias para continuar con la solicitud.', 'warning');
      return;
    }
    addToast('Declaraciones de responsabilidad suscritas correctamente. Formulario de inclusión habilitado.', 'success');
    onNext();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="responsibility-stage-container">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight" id="resp-title">
          Declaración de Responsabilidad Administrativa
        </h2>
        <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto">
          Por favor, declare bajo protesta de decir verdad que el insumo solicitado no se encuentra registrado en el sistema. Esta acción tiene implicaciones de orden normativo y presupuestal.
        </p>
      </div>

      <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 md:p-8 shadow-sm text-slate-800" id="official-declaration-card">
        <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-4 mb-6">
          <Landmark className="w-6 h-6 text-slate-700 shrink-0" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Órgano de Control de Abasto</h4>
            <h3 className="text-sm font-bold text-slate-800 uppercase">HOSPITAL CIVIL DE GUADALAJARA • COMITÉ DE ADQUISICIONES</h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <strong>Art. 42 Bis. Responsabilidades en el Control de Abasto:</strong> Toda inclusión de nuevo insumo, medicina o refacción en la base de datos del hospital genera gastos de catalogación, almacenamiento, auditoría externa e inventarios. El solicitante asume el compromiso legal y técnico de que las especificaciones propuestas son esenciales y no redundantes.
        </p>

        {/* Checklist elements */}
        <div className="space-y-4" id="regulatory-checklist">
          <label 
            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
              checked1 
                ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
            id="lbl-check1"
          >
            <input
              type="checkbox"
              checked={checked1}
              onChange={(e) => setChecked1(e.target.checked)}
              className="mt-1 w-5 h-5 accent-indigo-600 shrink-0 cursor-pointer"
              id="check1"
            />
            <div className="text-xs md:text-sm">
              <strong className="font-extrabold text-[#111827]">Búsqueda y Revisión Exhaustiva Obligatoria</strong>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Declaro bajo protesta de decir verdad que he revisado exhaustivamente el catálogo institucional HCG y que ningún artículo actualmente disponible satisface los requerimientos técnicos y de concentración requeridos para las operaciones de mi departamento.
              </p>
            </div>
          </label>

          <label 
            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
              checked2 
                ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
            id="lbl-check2"
          >
            <input
              type="checkbox"
              checked={checked2}
              onChange={(e) => setChecked2(e.target.checked)}
              className="mt-1 w-5 h-5 accent-indigo-600 shrink-0 cursor-pointer"
              id="check2"
            />
            <div className="text-xs md:text-sm">
              <strong className="font-extrabold text-[#111827]">Autorización de Ajustes y Homologación Directa</strong>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Entiendo que el Departamento de Catalogación y el Comité de Adquisiciones de Bienes tienen la facultad jurídica de denegar esta inclusión, o sustituirla por equivalentes homólogos de mercado, respondiendo a la política general de optimización presupuestaria del HCG.
              </p>
            </div>
          </label>

          <label 
            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
              checked3 
                ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
            id="lbl-check3"
          >
            <input
              type="checkbox"
              checked={checked3}
              onChange={(e) => setChecked3(e.target.checked)}
              className="mt-1 w-5 h-5 accent-indigo-600 shrink-0 cursor-pointer"
              id="check3"
            />
            <div className="text-xs md:text-sm">
              <strong className="font-extrabold text-[#111827]">Autenticidad Técnica y Justificación Comercial</strong>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Declaro que la cotización oficial adjuntada en el siguiente paso es verídica, vigente, y emitida por un proveedor legítimo de la industria de salud.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Navigation actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-700 border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-sm transition-colors cursor-pointer"
          id="btn-back-to-duplicates"
        >
          <ChevronLeft className="w-5 h-5 shrink-0" />
          Verificar Resultados
        </button>

        <button
          onClick={handleNextSubmit}
          disabled={!areAllChecked}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm transition-all shadow-md ${
            areAllChecked 
              ? 'bg-[#1e293b] hover:bg-slate-800 text-white hover:shadow-lg cursor-pointer' 
              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
          id="btn-authorize-form"
        >
          Autorizar y Abrir Formulario
          <ArrowRight className="w-5 h-5 shrink-0" />
        </button>
      </div>
    </div>
  );
}
