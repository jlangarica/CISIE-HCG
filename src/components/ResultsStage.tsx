import React from 'react';
import { ChevronLeft, ArrowRight, ShieldAlert, BadgeInfo, CheckCircle, RefreshCw } from 'lucide-react';
import { SearchResult } from '../types';

interface ResultsStageProps {
  searchQuery: string;
  results: SearchResult[];
  onBack: () => void;
  onNext: () => void;
}

export default function ResultsStage({ searchQuery, results, onBack, onNext }: ResultsStageProps) {
  // Determine if there is any dangerously high duplication risk (similarity >= 70%)
  const highRiskItems = results.filter(r => r.similarity >= 70);
  const mediumRiskItems = results.filter(r => r.similarity >= 40 && r.similarity < 70);

  const getRiskBadge = (sim: number) => {
    if (sim >= 70) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          Similitud Alta ({sim}%) - Riesgo Crítico
        </span>
      );
    }
    if (sim >= 40) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Similitud Media ({sim}%) - Evaluar Sustituto
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        Similitud Baja ({sim}%) - Bajo Riesgo
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" id="results-stage-container">
      {/* Search Recap header */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4" id="search-recap">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Consulta Analizada</span>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 mt-0.5">
            <span className="text-[#1c3d5a]">“</span>
            <span>{searchQuery}</span>
            <span className="text-[#1c3d5a]">”</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            El sistema analizó abreviaturas médicas y corrigió errores tipográficos en el catálogo oficial de la institución.
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl font-medium text-xs transition-colors shadow-xs cursor-pointer self-start md:self-center"
          id="back-query-btn"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          Nueva consulta
        </button>
      </div>

      {results.length === 0 ? (
        // No results found at all (under 5% similarity)
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center" id="no-duplicates-found">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-emerald-900">¡Libre de Coincidencias Directas!</h3>
          <p className="text-sm text-emerald-800 mt-2 max-w-xl mx-auto">
            No encontramos ningún artículo en el catálogo institucional que coincida o sea similar a su solicitud. Puede proceder con total tranquilidad para redactar e ingresar su nueva propuesta bajo los lineamientos oficiales.
          </p>
          <div className="mt-6">
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              id="proceed-free-btn"
            >
              Iniciar Solicitud de Clave
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // Matches lists
        <div className="space-y-6" id="duplicates-found-view">
          {/* Notification box for alert level */}
          {highRiskItems.length > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-900 uppercase">
                  Peligro: Coincidencias Críticas Identificadas
                </h4>
                <p className="text-xs text-red-800 mt-1 leading-relaxed">
                  Se encontraron uno o más artículos con un porcentaje de similitud alto (<strong className="font-semibold text-red-900">≥70%</strong>) en la base de datos institucional. Por regla general de abasto, la existencia de estas claves bloquea la creación de nuevos códigos salvo justificación técnica ineludible debidamente firmada por la Jefatura.
                </p>
              </div>
            </div>
          ) : mediumRiskItems.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
              <BadgeInfo className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 uppercase">
                  Sugerencia de Sustitución o Homologación
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Se detectaron artículos con similitud parcial (<strong className="font-semibold text-amber-900">40%-69%</strong>). Verifique detenidamente si la clave existente (ej: diferente concentración o presentación) puede cubrir el requerimiento sin recurrir a la creación de una nueva ficha.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900 uppercase">
                  Bajo Riesgo de Duplicidad
                </h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Las similitudes encontradas son menores. Es muy probable que su insumo sea único en el hospital. De cualquier forma, examine la lista para confirmar antes de transitar a la declaración de responsabilidad.
                </p>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" id="results-table-container">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-extrabold text-slate-800">
                Artículos Sugeridos del Catálogo Real
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {results.length} coincidencias analizadas
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="results-table">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase select-none">
                    <th className="py-3 px-4 md:px-6">Clave HCG</th>
                    <th className="py-3 px-4 md:px-6">Descripción Oficial en Catálogo</th>
                    <th className="py-3 px-4 md:px-6">Estado</th>
                    <th className="py-3 px-4 md:px-6 text-right">Filtro de Similitud</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {results.slice(0, 8).map((res, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors" id={`row-item-${res.item.id}`}>
                      <td className="py-3 md:py-4 px-4 md:px-6 font-mono font-semibold text-slate-900 text-xs truncate max-w-[150px]">
                        {res.item.clave}
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6">
                        <p className="font-semibold text-slate-800 leading-tight">{res.item.descripcion}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-1.5">
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {res.item.familia}
                          </span>
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            U. Medida: {res.item.unidadMedida}
                          </span>
                          {res.matchedTokens.length > 0 && (
                            <span className="text-[10px] italic text-[#dc2626]">
                              Tokens: {res.matchedTokens.join(', ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6">
                        {res.item.estado === 'Activo' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-400 border border-slate-200">
                            Inactivo/Descontinuado
                          </span>
                        )}
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6 text-right whitespace-nowrap">
                        {getRiskBadge(res.similarity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p>
                * Las coincidencias son aproximaciones lingüísticas y semánticas. Revise con el departamento de compras en caso de duda técnica.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
            <button
              onClick={onBack}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-700 border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              id="return-step-1"
            >
              <ChevronLeft className="w-5 h-5 shrink-0" />
              Regresar a Buscar
            </button>

            <button
              onClick={onNext}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-sm transition-colors shadow-md hover:shadow-lg cursor-pointer"
              id="continue-step-3"
            >
              Ninguno coincide - Solicitar inclusión de nueva clave
              <ArrowRight className="w-5 h-5 shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
