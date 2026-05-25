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
  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    
    // Perform fuzzy medical searching
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
        addToast(`Búsqueda finalizada. ADVERTENCIA: Se encontraron coincidencias con hasta ${highestScore}% de similitud.`, 'warning');
      } else {
        addToast(`Búsqueda finalizada. Encontradas ${matched.length} coincidencias parciales de bajo nivel.`, 'info');
      }
    } else {
      addToast('No se detectaron coincidencias similares en la base de datos.', 'success');
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="hcg-root-layout">
      {/* Official Hospital Civil de Guadalajara banner */}
      <Header />

      {/* Real-time Stage Stepper wizard indicator */}
      <StepProgress currentStep={currentStep} />

      {/* Main Body Stage Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
        
        {currentStep === 1 && (
          <SearchStage 
            initialSearch={searchQuery} 
            onSearchSubmit={handleSearchSubmit} 
            addToast={addToast} 
          />
        )}

        {currentStep === 2 && (
          <ResultsStage 
            searchQuery={searchQuery} 
            results={searchResults} 
            onBack={handleResultsBack} 
            onNext={handleResultsNext} 
          />
        )}

        {currentStep === 3 && (
          <ResponsibilityStage 
            onBack={handleResponsibilityBack} 
            onNext={handleResponsibilityNext} 
            addToast={addToast} 
          />
        )}

        {currentStep === 4 && (
          <FormStage 
            originalSearchQuery={searchQuery} 
            formState={formState} 
            setFormState={setFormState} 
            onBack={handleFormBack} 
            onSubmit={handleFormSubmit} 
            addToast={addToast} 
          />
        )}

        {currentStep === 5 && (
          <CompletedStage 
            formState={formState} 
            onReset={handleReset} 
            addToast={addToast} 
          />
        )}

      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-4 select-none">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Hospital Civil de Guadalajara. Todos los derechos reservados.</p>
          <p className="mt-1 font-mono text-[10px]">Verificador de Catálogo - Dirección Regional de Control de Suministros • v4.1.14</p>
        </div>
      </footer>

      {/* Live Toasts Alerts overlay */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
