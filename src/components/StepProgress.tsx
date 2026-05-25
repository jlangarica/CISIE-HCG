import React from 'react';
import { Check } from 'lucide-react';
import { UserStep } from '../types';

interface StepProgressProps {
  currentStep: UserStep;
}

const STEPS_DATA = [
  { step: 1, label: 'Búsqueda', desc: 'Evitar duplicados' },
  { step: 2, label: 'Resultados', desc: 'Análisis de catálogo' },
  { step: 3, label: 'Declaración', desc: 'Filtro regulatorio' },
  { step: 4, label: 'Formulario', desc: 'Inclusión técnica' },
  { step: 5, label: 'Expediente', desc: 'Formato descargable' },
];

export default function StepProgress({ currentStep }: StepProgressProps) {
  return (
    <div className="w-full bg-white border-b border-slate-200 py-6 px-4 md:px-8 shadow-xs" id="hcg-stepper-progress">
      <div className="max-w-7xl mx-auto">
        {/* Desktop Step Indicator */}
        <div className="hidden md:flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 z-0 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${((currentStep - 1) / (STEPS_DATA.length - 1)) * 100}%` }}
          />

          {STEPS_DATA.map((item) => {
            const isCompleted = item.step < currentStep;
            const isActive = item.step === currentStep;
            
            return (
              <div key={item.step} className="flex flex-col items-center z-10 flex-1" id={`step-node-${item.step}`}>
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : isActive 
                        ? 'bg-slate-900 text-white ring-4 ring-indigo-100 shadow-md scale-110' 
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3px]" />
                  ) : (
                    item.step
                  )}
                </div>
                <div className="text-center mt-3">
                  <p className={`text-xs font-bold tracking-tight ${isActive ? 'text-slate-900 font-extrabold' : 'text-slate-500'}`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium hidden lg:block">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Step Indicator */}
        <div className="md:hidden flex items-center justify-between" id="hcg-stepper-mobile">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#dc2626]">
              Flujo de Trabajo
            </span>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Etapa {currentStep}:</span>
              <span className="text-indigo-600">{STEPS_DATA[currentStep - 1].label}</span>
            </h2>
          </div>
          <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold font-mono">
            {currentStep}/5
          </div>
        </div>
        
        {/* Mobile Progress Bar */}
        <div className="md:hidden w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
          <div 
            className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
            style={{ width: `${(currentStep / STEPS_DATA.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
