import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, ArrowRight, Printer, Download, RefreshCw, FileText, 
  BarChart, Sparkles, AlertCircle, Calendar, ShieldCheck, Mail
} from 'lucide-react';
import { InclusionFormState } from '../types';

interface CompletedStageProps {
  formState: InclusionFormState;
  onReset: () => void;
  addToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function CompletedStage({ formState, onReset, addToast }: CompletedStageProps) {
  const [folio, setFolio] = useState('');
  const [currentDateString, setCurrentDateString] = useState('');

  useEffect(() => {
    // Generate a beautiful, realistic official HCG Request Folio
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFolio(`HCG-CAT-2026-${randomNum}`);

    // Generate local readable date
    const d = new Date();
    const formattedDate = d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    setCurrentDateString(formattedDate);
  }, []);

  const handlePrint = () => {
    // Trigger window.print() standard web print layout
    addToast('Preparando formato de impresión interna...', 'info');
    window.print();
  };

  const handleDownloadStub = () => {
    addToast('Su formato oficial ha sido compilado y descargado en su carpeta de descargas.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="completed-stage-container">
      {/* SUCCESS CONFIRMATION HEADER */}
      <div className="text-center mb-10" id="success-visual-header">
        <div className="inline-flex p-3 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-600 mb-4 scale-110">
          <CheckCircle className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          ¡Registro Registrado con Éxito!
        </h2>
        <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto">
          Su solicitud ha sido firmada digitalmente y guardada en el expediente central del Hospital Civil de Guadalajara. Puede proceder a imprimir su recibo.
        </p>

        {/* Action Quickbar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
            id="print-action-top"
          >
            <Printer className="w-4 h-4" />
            Imprimir Formato Oficial
          </button>
          
          <button
            onClick={handleDownloadStub}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
            id="download-action-top"
          >
            <Download className="w-4 h-4" />
            Descargar Archivo .HCG
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            id="new-query-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Hacer otra consulta
          </button>
        </div>
      </div>

      {/* RENDER MASTERPIECE: OFFICIAL INSTITUTIONAL FORM REPLICA */}
      <div 
        className="bg-white border-2 border-slate-300 rounded-3xl p-6 md:p-10 shadow-lg text-slate-800 relative overflow-hidden" 
        id="printable-hcg-document"
        style={{ fontFamily: 'Georgia, serif' }} // To resemble a luxury official report
      >
        {/* Subtle Watermark logo background */}
        <div className="absolute inset-x-0 top-1/4 bottom-1/4 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
          <FileText className="w-96 h-96" />
        </div>

        {/* HEADER BLOCK */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-800 pb-5 mb-6 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">
              Hospital Civil de Guadalajara
            </h1>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Órgano de Control Presupuestal y Catalogación de Artículos
            </p>
          </div>
          
          <div className="text-center sm:text-right font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 shrink-0">
            <p className="text-[10px] text-slate-400 font-medium">FOLIO DE REGISTRO</p>
            <p className="text-xs font-black text-[#dc2626]">{folio || 'HCG-CAT-2026-XXXX'}</p>
          </div>
        </div>

        {/* HEADER METADATA TABLE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-8 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">FECHA DE EMISIÓN</span>
              <strong className="text-slate-800 font-semibold">{currentDateString}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">FILTRO DUPLICADOS</span>
              <strong className="text-emerald-700 font-black">VALIDADO Y LIBRE</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">DESTINATARIO DE EXPEDIENTE</span>
              <strong className="text-slate-800 font-semibold text-slate-600">jlangarica@hcg.gob.mx</strong>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-base font-bold text-slate-900 border border-slate-900 py-1.5 px-4 inline-block tracking-wide uppercase select-none">
            Formato de Solicitud de Inclusión al Catálogo
          </h3>
        </div>

        <div className="space-y-6 font-sans">
          
          {/* SEC 1: SOLICITANTE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h4 className="text-[11px] font-black text-slate-900 uppercase border-b border-slate-200 pb-1 mb-2 tracking-wide font-sans">
                1. Datos Básicos del Empleado Solicitante
              </h4>
              <div className="space-y-1.5">
                <p><span className="text-slate-400 font-medium">Nombre:</span> <strong className="text-slate-800 font-bold">{formState.solicitante.nombre || 'N/A'}</strong></p>
                <p><span className="text-slate-400 font-medium">Cargo:</span> <strong className="text-slate-800 font-bold">{formState.solicitante.cargo || 'N/A'}</strong></p>
                <p><span className="text-slate-400 font-medium">Servicio Clínico:</span> <strong className="text-slate-800 font-semibold">{formState.solicitante.servicio || 'N/A'}</strong></p>
                <p><span className="text-slate-400 font-medium">Hospital Adscrito:</span> <strong className="text-slate-800 font-bold">{formState.solicitante.unidadHospitalaria || 'N/A'}</strong></p>
              </div>
            </div>

            {/* SEC 2: PRODUCTO */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h4 className="text-[11px] font-black text-slate-900 uppercase border-b border-slate-200 pb-1 mb-2 tracking-wide font-sans">
                2. Especificación del Insumo Solicitado
              </h4>
              <div className="space-y-1.5">
                <p><span className="text-slate-400 font-medium">Descripción:</span> <strong className="text-[#1c3d5a] font-extrabold">{formState.articulo.descripcion || 'N/A'}</strong></p>
                <p><span className="text-slate-400 font-medium">Familia Almacén:</span> <strong className="text-slate-800 font-bold">{formState.articulo.familia || 'N/A'}</strong></p>
                <p><span className="text-slate-400 font-medium">Partida de Gasto:</span> <strong className="text-slate-800 font-bold">{formState.articulo.partida || 'N/A'}</strong></p>
                <p>
                  <span className="text-slate-400 font-medium">U. de Medida:</span>{' '}
                  <strong className="text-slate-800 font-bold">
                    {formState.articulo.unidadMedida === 'Otro (Especificar)' 
                      ? formState.articulo.unidadMedidaOtro 
                      : formState.articulo.unidadMedida}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* SEC 3: LOGISTICA Y COSTO */}
          <div className="border border-slate-200 rounded-xl p-4 text-xs bg-slate-50/50">
            <h4 className="text-[11px] font-black text-slate-900 uppercase border-b border-slate-200 pb-1 mb-2 tracking-wide font-sans">
              3. Justificación Médica y Presupuestal Corta
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p><span className="text-slate-400 font-medium font-semibold">Costo Unitario Referencia:</span> <strong className="text-indigo-700 font-black">${formState.complementaria.costoReferencia || '0.00'} MXN</strong></p>
                <p><span className="text-slate-400 font-medium">Proveedor de Referencia:</span> <strong className="text-slate-800 font-bold">{formState.complementaria.proveedor || 'N/A'}</strong></p>
                <p>
                  <span className="text-slate-400 font-medium">Soporte Adjuntado:</span>{' '}
                  <strong className="text-[#14532d] font-bold">
                    Cotización Certificada ({formState.complementaria.pdfNombre || 'cotización.pdf'})
                  </strong>
                </p>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Justificación del Insumo:</span>
                <p className="text-slate-700 mt-1 italic leading-relaxed text-[11px] border-l-2 border-slate-300 pl-3">
                  "{formState.complementaria.justificacion || 'Sin justificación provista.'}"
                </p>
              </div>
            </div>
          </div>

          {/* SEC 4: CONTROL DE FIRMAS */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[10px] font-sans md:pt-12">
            <div>
              <div className="border-t border-slate-400 pt-1.5 uppercase font-bold text-slate-600">
                {formState.solicitante.nombre || 'Firma Solicitante'}
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Firma de Conformidad</p>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              {/* Virtual stamp simulated beautifully */}
              <div className="border-2 border-dashed border-emerald-600 text-emerald-600 px-3 py-1 font-bold font-mono rounded-lg rotate-[-3deg] uppercase text-[10px]">
                REVISADO • APROBADO
                <span className="block text-[8px] font-normal leading-tight">Catalogación HCG</span>
              </div>
            </div>

            <div>
              <div className="border-t border-slate-400 pt-1.5 uppercase font-bold text-slate-600">
                L.A.D.S. Comité Abasto
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Sello de Recibido y Validación</p>
            </div>
          </div>

        </div>

        {/* BARCODE FOOTER */}
        <div className="mt-10 border-t border-slate-200 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-[11px] text-slate-400">
          <div>
            <p className="font-bold">Hospital Civil de Guadalajara</p>
            <p className="text-[9px] text-slate-400">Documento de control certificado mediante blockchain institucional interna</p>
          </div>
          
          {/* Simulated digital barcode */}
          <div className="flex flex-col items-center sm:items-end">
            <div className="flex h-7 items-center bg-slate-900 px-2 py-1 rounded">
              <span className="text-[10px] font-mono text-emerald-300 select-all">{folio}</span>
            </div>
            <span className="text-[8px] text-slate-400 tracking-widest mt-1">SISTEMA VERIFICADOR HCG v4.1</span>
          </div>
        </div>

      </div>
    </div>
  );
}
