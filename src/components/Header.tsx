import React, { useState, useEffect } from 'react';
import { SearchCheck } from 'lucide-react';
import { initAuth } from '../firebase';
import type { User } from 'firebase/auth';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsub();
  }, []);

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
        
        <div className="flex items-center gap-3 self-end sm:self-auto text-right font-sans">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <span className="text-[9px] block text-emerald-600 uppercase tracking-widest font-bold">Sesión Institucional</span>
                <span className="text-xs font-bold text-slate-800">{user.displayName || user.email}</span>
              </div>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-full border border-emerald-300" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 bg-blue-105 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold font-mono">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:block">
              <span className="text-[10px] block text-slate-400 uppercase tracking-widest font-bold">Modo de Consulta</span>
              <span className="text-xs font-semibold text-slate-500">Dr. Julián Ramírez Pérez</span>
            </div>
          )}
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0">
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
