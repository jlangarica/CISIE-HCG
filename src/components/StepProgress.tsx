import React from 'react';
import { Check } from 'lucide-react';
import { UserStep } from '../types';

interface StepProgressProps {
  currentStep: UserStep;
}

const STEPS_DATA = [
  { step: 1, label: 'Buscar' },
  { step: 2, label: 'Resultados' },
  { step: 3, label: 'Confirmar' },
  { step: 4, label: 'Formulario' },
  { step: 5, label: 'Completado' },
];

export default function StepProgress({ currentStep }: StepProgressProps) {
  return (
    <div className="w-full bg-white border-b border-slate-100 py-4 px-6 md:px-8" id="hcg-stepper-progress">
      <div className="max-w-4xl mx-auto">
        {/* Desktop Step Indicator */}
        <div className="hidden md:flex items-center justify-between relative">
          {STEPS_DATA.map((item, idx) => {
            const isCompleted = item.step < currentStep;
            const isActive = item.step === currentStep;
            
            return (
              <React.Fragment key={item.step}>
                {/* Step Item */}
                <div className="flex items-center gap-2.5 z-10" id={`step-node-${item.step}`}>
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 pointer-events-none select-none ${
                      isCompleted 
                        ? 'bg-blue-600 text-white border border-blue-600' 
                        : isActive 
                          ? 'border-2 border-blue-600 text-blue-600 bg-white ring-4 ring-blue-50' 
                          : 'bg-white border border-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3px]" />
                    ) : (
                      item.step
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${
                    isCompleted || isActive ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
                  }`}>
                    {item.label}
                  </span>
                </div>

                {/* Connecting Line */}
                {idx < STEPS_DATA.length - 1 && (
                  <div className="flex-1 h-[2px] bg-slate-100 mx-4 relative overflow-hidden rounded-full">
                    <div 
                      className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-500 ease-in-out" 
                      style={{ 
                        width: isCompleted ? '100%' : '0%',
                        transformOrigin: 'left'
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Step Indicator */}
        <div className="md:hidden flex items-center justify-between" id="hcg-stepper-mobile">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600">
              Progreso de Solicitud
            </span>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Etapa {currentStep}:</span>
              <span className="text-blue-800">{STEPS_DATA[currentStep - 1].label}</span>
            </h2>
          </div>
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold font-mono">
            {currentStep} / {STEPS_DATA.length}
          </div>
        </div>
        
        {/* Mobile Progress Bar */}
        <div className="md:hidden w-full h-[3px] bg-slate-100 rounded-full mt-3 overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-400" 
            style={{ width: `${(currentStep / STEPS_DATA.length) * 105}%` }}
          />
        </div>
      </div>
    </div>
  );
}
