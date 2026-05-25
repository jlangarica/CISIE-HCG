/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Header from './components/Header';
import StepProgress from './components/StepProgress';
import ToastContainer from './components/ToastContainer';

import SearchStage from './components/SearchStage';
import ResultsStage from './components/ResultsStage';
import ResponsibilityStage from './components/ResponsibilityStage';
import FormStage from './components/FormStage';
import CompletedStage from './components/CompletedStage';

import { HCG_CATALOG } from './data';
import { searchCatalogue } from './utils';
import { UserStep, SearchResult, InclusionFormState, NotificationToast } from './types';

const defaultFormState: InclusionFormState = {
  articulo: {
    descripcion: '',
    familia: '',
    unidadMedida: '',
    unidadMedidaOtro: '',
    partida: '',
  },
  solicitante: {
    nombre: '',
    cargo: '',
    servicio: '',
    unidadHospitalaria: 'Fray Antonio Alcalde'
  },
  complementaria: {
    costoReferencia: '',
    justificacion: '',
    proveedor: '',
    pdfCargado: false,
    pdfNombre: undefined,
    pdfTamano: undefined
  }
};

export default function App() {
  const [currentStep, setCurrentStep] = useState<UserStep>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [formState, setFormState] = useState<InclusionFormState>(defaultFormState);

  // Helper to append a dynamic system notification toast
  const addToast = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Automatically remove after 4.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Step 1: Search Submit Handler
  const handleSearchSubmit = async (query: string) => {
    setSearchQuery(query);
    
    // Perform instant client-side fuzzy medical searching for snappy feedback
    const matched = searchCatalogue(query, HCG_CATALOG);
    setSearchResults(matched);
    
    // Auto-prepopulate part of Step 4 description as a base
    setFormState(prev => ({
      ...prev,
      articulo: {
        ...prev.articulo,
        descripcion: query.toUpperCase()
      }
    }));

    setCurrentStep(2);
    
    if (matched.length > 0) {
      const highestScore = matched[0].similarity;
      if (highestScore >= 70) {
        addToast(`Búsqueda heurística finalizada. ADVERTENCIA: Se encontraron coincidencias con hasta ${highestScore}% de similitud.`, 'warning');
      } else {
        addToast(`Búsqueda heurística finalizada. Encontradas ${matched.length} coincidencias parciales.`, 'info');
      }
    } else {
      addToast('No se detectaron coincidencias similares heurísticas en la base de datos.', 'success');
    }

    // Now, trigger backend Server V3 Advanced Trigram execution
    try {
      const res = await fetch("/api/buscar-similitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, catalog: HCG_CATALOG }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setSearchResults(data.results);
        if (data.results.length > 0) {
          const topScore = data.results[0].similarity;
          if (topScore >= 70) {
            addToast(`Búsqueda V3 refinada con éxito. Encontrados registros con similitud de hasta ${topScore}%.`, 'warning');
          } else {
            addToast(`Búsqueda V3 refinada. ${data.results.length} coincidencias analizadas de bajo nivel.`, 'info');
          }
        } else {
          addToast('Auditoría léxica V3 finalizada sin duplicados en catálogo.', 'success');
        }
      }
    } catch (err) {
      console.error("Failed to fetch advanced search results from backend, keeping local:", err);
    }
  };

  // Step 2 handlers
  const handleResultsBack = () => {
    setCurrentStep(1);
  };

  const handleResultsNext = () => {
    setCurrentStep(3);
  };

  // Step 3 handlers
  const handleResponsibilityBack = () => {
    setCurrentStep(2);
  };

  const handleResponsibilityNext = () => {
    setCurrentStep(4);
  };

  // Step 4 handlers
  const handleFormBack = () => {
    setCurrentStep(3);
  };

  const handleFormSubmit = () => {
    setCurrentStep(5);
    addToast('La inclusión al catálogo ha sido enviada con folio firmado digitalmente.', 'success');
  };

  // Step 5 resetting
  const handleReset = () => {
    setFormState(defaultFormState);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentStep(1);
    addToast('Sistema Verificador reiniciado. Nueva consulta abierta.', 'info');
  };

  return (
    <div className="min-h-screen animate-gradient-bg flex flex-col font-sans" id="hcg-root-layout">
      {/* Official Hospital Civil de Guadalajara banner */}
      <Header />

      {/* Main Body Stage Container utilizing flat premium design card */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        <div className="premium-main-card overflow-hidden">
          {/* Real-time Stage Stepper wizard indicator */}
          <StepProgress currentStep={currentStep} />

          {/* Stepped views container screen */}
          <div className="p-6 md:p-10">
            {currentStep === 1 && (
              <div className="phase-transition-card" id="step-1-animate-container">
                <SearchStage 
                  initialSearch={searchQuery} 
                  onSearchSubmit={handleSearchSubmit} 
                  addToast={addToast} 
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="phase-transition-card" id="step-2-animate-container">
                <ResultsStage 
                  searchQuery={searchQuery} 
                  results={searchResults} 
                  onBack={handleResultsBack} 
                  onNext={handleResultsNext} 
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="phase-transition-card" id="step-3-animate-container">
                <ResponsibilityStage 
                  onBack={handleResponsibilityBack} 
                  onNext={handleResponsibilityNext} 
                  addToast={addToast} 
                />
              </div>
            )}

            {currentStep === 4 && (
              <div className="phase-transition-card" id="step-4-animate-container">
                <FormStage 
                  originalSearchQuery={searchQuery} 
                  formState={formState} 
                  setFormState={setFormState} 
                  onBack={handleFormBack} 
                  onSubmit={handleFormSubmit} 
                  addToast={addToast} 
                />
              </div>
            )}

            {currentStep === 5 && (
              <div className="phase-transition-card" id="step-5-animate-container">
                <CompletedStage 
                  formState={formState} 
                  onReset={handleReset} 
                  addToast={addToast} 
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="bg-white/80 backdrop-blur-xs border-t border-slate-200 py-6 select-none">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Hospital Civil de Guadalajara. Todos los derechos reservados.</p>
          <p className="mt-1 font-mono text-[10px]">Verificador de Catálogo - Dirección Regional de Control de Suministros • v4.2.0 • CISIE</p>
        </div>
      </footer>

      {/* Live Toasts Alerts overlay */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
