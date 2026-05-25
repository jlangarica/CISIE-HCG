import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ArrowRight, Sparkles, Upload, FileText, Trash2, 
  User, Clipboard, DollarSign, Settings, Check, HelpCircle, AlertTriangle 
} from 'lucide-react';
import { 
  InclusionFormState, AIRecommendation, NotificationToast 
} from '../types';
import { 
  FAMILIAS, UNIDADES_MEDIDA, PARTIDAS_PRESUPUESTALES, UNIDADES_HOSPITALARIAS 
} from '../data';
import { getSmartRecommendations } from '../utils';

interface FormStageProps {
  originalSearchQuery: string;
  formState: InclusionFormState;
  setFormState: React.Dispatch<React.SetStateAction<InclusionFormState>>;
  onBack: () => void;
  onSubmit: () => void;
  addToast: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function FormStage({ 
  originalSearchQuery, 
  formState, 
  setFormState, 
  onBack, 
  onSubmit, 
  addToast 
}: FormStageProps) {
  
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [aiApplied, setAiApplied] = useState(false);
  const [showAiBanner, setShowAiBanner] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Exit protection modal state
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'back' | 'reset' | null>(null);

  // Field validation visual triggers
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Fire smart assistant upon entering Paso 4, using original terms searched
    if (originalSearchQuery) {
      const rec = getSmartRecommendations(originalSearchQuery);
      setAiRecommendation(rec);
    }
  }, [originalSearchQuery]);

  const handleApplyAi = () => {
    if (!aiRecommendation) return;

    // Split recommendation for partida
    const matchingPartida = PARTIDAS_PRESUPUESTALES.find(
      p => `${p.clave} - ${p.nombre}` === aiRecommendation.partidaRecomendada
    );

    setFormState(prev => ({
      ...prev,
      articulo: {
        ...prev.articulo,
        descripcion: aiRecommendation.descripcionEstandarizada,
        familia: aiRecommendation.familiaRecomendada,
        partida: matchingPartida ? `${matchingPartida.clave} - ${matchingPartida.nombre}` : prev.articulo.partida,
        unidadMedida: aiRecommendation.unidadRecomendada,
      }
    }));

    setAiApplied(true);
    addToast('Propuesta de catalogación internacional y clasificación recomendada aplicadas en el formulario.', 'success');
  };

  const handleRejectAi = () => {
    setShowAiBanner(false);
    addToast('Asistente inteligente minimizado. Complete los campos manualmente.', 'info');
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processUploadedFile(file);
    }
  };

  const processUploadedFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      addToast('Solo se permiten documentos en formato PDF de cotización.', 'error');
      return;
    }

    // Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast('El archivo PDF excede el tamaño máximo permitido de 5 MB.', 'warning');
      return;
    }

    // Simulate clean uploading progress bar
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(null);
            setFormState(prevData => ({
              ...prevData,
              complementaria: {
                ...prevData.complementaria,
                pdfCargado: true,
                pdfNombre: file.name,
                pdfTamano: (file.size / 1024 / 1024).toFixed(2) + ' MB'
              }
            }));
            addToast('Cotización digital PDF adjuntada correctamente.', 'success');
          }, 300);
          return 100;
        }
        return prev + 30;
      });
    }, 150);
  };

  const removePdf = () => {
    setFormState(prev => ({
      ...prev,
      complementaria: {
        ...prev.complementaria,
        pdfCargado: false,
        pdfNombre: undefined,
        pdfTamano: undefined
      }
    }));
    addToast('Documento PDF removido de la solicitud.', 'info');
  };

  // Perform form validation
  const validateForm = (): boolean => {
    const tempErrors: { [key: string]: string } = {};

    // Articulo validations
    if (!formState.articulo.descripcion.trim()) {
      tempErrors.desc = 'La descripción técnica es obligatoria.';
    }
    if (!formState.articulo.familia) {
      tempErrors.familia = 'Debe seleccionar una familia de almacén.';
    }
    if (!formState.articulo.unidadMedida) {
      tempErrors.unidad = 'Seleccione una unidad de medida.';
    }
    if (formState.articulo.unidadMedida === 'Otro (Especificar)' && !formState.articulo.unidadMedidaOtro?.trim()) {
      tempErrors.unidadOtro = 'Escriba la unidad de medida personalizada.';
    }
    if (!formState.articulo.partida) {
      tempErrors.partida = 'Debe adjudicar una partida presupuestal aprobada.';
    }

    // Solicitante validations
    if (!formState.solicitante.nombre.trim()) {
      tempErrors.solNombre = 'Escriba el nombre completo del solicitante.';
    }
    if (!formState.solicitante.cargo.trim()) {
      tempErrors.solCargo = 'El cargo formal del solicitante es indispensable.';
    }
    if (!formState.solicitante.servicio.trim()) {
      tempErrors.solServicio = 'Escriba el departamento físico o servicio clínico.';
    }

    // Informacion Complementaria
    if (!formState.complementaria.costoReferencia.trim() || isNaN(Number(formState.complementaria.costoReferencia))) {
      tempErrors.costo = 'Costo unitario referencial requiere un número válido.';
    }
    if (!formState.complementaria.justificacion.trim() || formState.complementaria.justificacion.length < 20) {
      tempErrors.justificacion = 'Se requiere una justificación médica o logística detallada de al menos 20 caracteres.';
    }
    if (!formState.complementaria.proveedor.trim()) {
      tempErrors.proveedor = 'Defina el distribuidor o proveedor sugerido para validación de mercado.';
    }
    if (!formState.complementaria.pdfCargado) {
      tempErrors.pdf = 'Adjuntar una cotización formal digitalizada es mandatorio para evitar el rechazo.';
    }

    setErrors(tempErrors);

    const isValid = Object.keys(tempErrors).length === 0;
    if (!isValid) {
      addToast('Hay campos obligatorios incompletos o erróneos en el formulario.', 'error');
    }
    return isValid;
  };

  const handleNextSubmit = () => {
    if (validateForm()) {
      onSubmit();
    }
  };

  // Exit trigger with dirty check
  const handleBackWithCheck = () => {
    setPendingAction('back');
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    if (pendingAction === 'back') {
      onBack();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" id="form-stage-container">
      {/* 1. SMART AI RECOMMENDATION BANNER */}
      {aiRecommendation && showAiBanner && (
        <div 
          className="bg-radial from-[#1e1b4b] to-[#311042] text-white border border-[#4c1d95] rounded-3xl p-6 mb-8 shadow-xl relative overflow-hidden" 
          id="smart-assistant-banner"
        >
          <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-[-20px] bottom-[-20px] w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start gap-5 relative z-10">
            <div className="bg-linear-to-tr from-indigo-500 to-purple-500 p-3 rounded-2xl shadow-md shrink-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-400 text-[#1e1b4b] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Asistente Inteligente HCG
                  </span>
                  <span className="text-xs text-slate-300">Confianza de acierto: {aiRecommendation.confianza}%</span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 tracking-tight mt-1">
                  Recomendaciones basadas en su búsqueda: "{originalSearchQuery}"
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-black/30 p-4 rounded-xl border border-slate-700/60 font-medium">
                <div>
                  <span className="text-slate-400 block font-normal">Nomenclatura Internacional Propuesta:</span>
                  <span className="text-amber-300 font-bold block mt-1 text-sm">
                    {aiRecommendation.descripcionEstandarizada}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block font-normal">Familia Sugerida:</span>
                    <span className="text-slate-200 block mt-0.5 font-bold truncate">
                      {aiRecommendation.familiaRecomendada}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal">Partida Presupuestal:</span>
                    <span className="text-slate-200 block mt-0.5 font-bold truncate">
                      {aiRecommendation.partidaRecomendada}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleApplyAi}
                  disabled={aiApplied}
                  className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm cursor-pointer transition-all ${
                    aiApplied 
                      ? 'bg-emerald-600 text-white cursor-default' 
                      : 'bg-white hover:bg-slate-100 text-slate-900'
                  }`}
                  id="btn-apply-ai"
                >
                  {aiApplied ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {aiApplied ? 'Sugerencias Aplicadas con Éxito' : 'Aplicar Sugerencia al Formulario'}
                </button>
                <button
                  type="button"
                  onClick={handleRejectAi}
                  className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                  id="btn-reject-ai"
                >
                  Omitir Asistente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CORE FORM SEGMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="form-grid-layout">
        {/* Row 1 / Col 8: Form parameters */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECTION 1: DATOS DEL ARTÍCULO */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative" id="panel-articulo">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <Clipboard className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-800">1. Identificación del Artículo Solicitado</h3>
            </div>

            <div className="space-y-4">
              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción Técnica Completa <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  value={formState.articulo.descripcion}
                  onChange={(e) => {
                    setFormState(prev => ({ ...prev, articulo: { ...prev.articulo, descripcion: e.target.value } }));
                    if (errors.desc) setErrors(prev => ({ ...prev, desc: '' }));
                    if (aiApplied) setAiApplied(false);
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all ${
                    errors.desc ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                  }`}
                  placeholder="Denominación técnica, principio activo o genérico, dosis o medida..."
                  id="form-desc"
                />
                {errors.desc ? (
                  <p className="text-xs text-red-500 font-medium mt-1">{errors.desc}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Redacte de forma neutra: Sustancia / Objeto + Especificidad + Formato de envasado. Evite marcas comerciales en esta sección.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Familia */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Familia de Insumos <span className="text-[#dc2626]">*</span>
                  </label>
                  <select
                    value={formState.articulo.familia}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, articulo: { ...prev.articulo, familia: e.target.value } }));
                      if (errors.familia) setErrors(prev => ({ ...prev, familia: '' }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all cursor-pointer ${
                      errors.familia ? 'border-red-500' : 'border-slate-200'
                    }`}
                    id="form-familia"
                  >
                    <option value="">-- Seleccione una familia --</option>
                    {FAMILIAS.map((fam, i) => (
                      <option key={i} value={fam}>{fam}</option>
                    ))}
                  </select>
                  {errors.familia && <p className="text-xs text-red-500 font-medium mt-1">{errors.familia}</p>}
                </div>

                {/* Partida Presupuestal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Partida Presupuestal Autorizada <span className="text-[#dc2626]">*</span>
                  </label>
                  <select
                    value={formState.articulo.partida}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, articulo: { ...prev.articulo, partida: e.target.value } }));
                      if (errors.partida) setErrors(prev => ({ ...prev, partida: '' }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all cursor-pointer ${
                      errors.partida ? 'border-red-500' : 'border-slate-200'
                    }`}
                    id="form-partida"
                  >
                    <option value="">-- Seleccione partida --</option>
                    {PARTIDAS_PRESUPUESTALES.map((item, i) => (
                      <option key={i} value={`${item.clave} - ${item.nombre}`}>
                        {item.clave} - {item.nombre}
                      </option>
                    ))}
                  </select>
                  {errors.partida && <p className="text-xs text-red-500 font-medium mt-1">{errors.partida}</p>}
                </div>
              </div>

              {/* Unidad de medida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unidad de Medida / Presentación <span className="text-[#dc2626]">*</span>
                  </label>
                  <select
                    value={formState.articulo.unidadMedida}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, articulo: { ...prev.articulo, unidadMedida: e.target.value } }));
                      if (errors.unidad) setErrors(prev => ({ ...prev, unidad: '' }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all cursor-pointer ${
                      errors.unidad ? 'border-red-500' : 'border-slate-200'
                    }`}
                    id="form-unidad"
                  >
                    <option value="">-- Seleccione unidad --</option>
                    {UNIDADES_MEDIDA.map((un, i) => (
                      <option key={i} value={un}>{un}</option>
                    ))}
                  </select>
                  {errors.unidad && <p className="text-xs text-red-500 font-medium mt-1">{errors.unidad}</p>}
                </div>

                {formState.articulo.unidadMedida === 'Otro (Especificar)' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Especifique Unidad de Medida <span className="text-[#dc2626]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.articulo.unidadMedidaOtro || ''}
                      onChange={(e) => {
                        setFormState(prev => ({ ...prev, articulo: { ...prev.articulo, unidadMedidaOtro: e.target.value } }));
                        if (errors.unidadOtro) setErrors(prev => ({ ...prev, unidadOtro: '' }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all ${
                        errors.unidadOtro ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                      }`}
                      placeholder="Escriba la unidad customizada..."
                      id="form-unidad-otro"
                    />
                    {errors.unidadOtro && <p className="text-xs text-red-500 font-medium mt-1">{errors.unidadOtro}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: DATOS DEL SOLICITANTE */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs" id="panel-solicitante">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-800">2. Identificación del Funcionario Solicitante</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Completo <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  value={formState.solicitante.nombre}
                  onChange={(e) => {
                    setFormState(prev => ({ ...prev, solicitante: { ...prev.solicitante, nombre: e.target.value } }));
                    if (errors.solNombre) setErrors(prev => ({ ...prev, solNombre: '' }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all ${
                    errors.solNombre ? 'border-red-500' : 'border-slate-200'
                  }`}
                  placeholder="Nombre completo y apellidos"
                  id="form-sol-nombre"
                />
                {errors.solNombre && <p className="text-xs text-red-500 font-medium mt-1">{errors.solNombre}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cargo Formal <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  value={formState.solicitante.cargo}
                  onChange={(e) => {
                    setFormState(prev => ({ ...prev, solicitante: { ...prev.solicitante, cargo: e.target.value } }));
                    if (errors.solCargo) setErrors(prev => ({ ...prev, solCargo: '' }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all ${
                    errors.solCargo ? 'border-red-500' : 'border-slate-200'
                  }`}
                  placeholder="Ej: Jefe de Quirófanos, Coordinador de Abasto"
                  id="form-sol-cargo"
                />
                {errors.solCargo && <p className="text-xs text-red-500 font-medium mt-1">{errors.solCargo}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Servicio Clínico / Departamento <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  value={formState.solicitante.servicio}
                  onChange={(e) => {
                    setFormState(prev => ({ ...prev, solicitante: { ...prev.solicitante, servicio: e.target.value } }));
                    if (errors.solServicio) setErrors(prev => ({ ...prev, solServicio: '' }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all ${
                    errors.solServicio ? 'border-red-500' : 'border-slate-200'
                  }`}
                  placeholder="Ej: Urgencias Adultos, Unidad de Terapia Intensiva"
                  id="form-sol-servicio"
                />
                {errors.solServicio && <p className="text-xs text-red-500 font-medium mt-1">{errors.solServicio}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Unidad Hospitalaría HCG <span className="text-[#dc2626]">*</span>
                </label>
                <select
                  value={formState.solicitante.unidadHospitalaria}
                  onChange={(e) => {
                    setFormState(prev => ({ ...prev, solicitante: { ...prev.solicitante, unidadHospitalaria: e.target.value as any } }));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all cursor-pointer"
                  id="form-sol-unidad"
                >
                  {UNIDADES_HOSPITALARIAS.map((uni, i) => (
                    <option key={i} value={uni}>{uni}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: DATOS COMPLEMENTARIOS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs" id="panel-complemento">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-800">3. Información Económica e Institucional</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Costo de Referencia Unitario (MXN) <span className="text-[#dc2626]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-semibold text-sm">
                    $
                  </div>
                  <input
                    type="text"
                    value={formState.complementaria.costoReferencia}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, complementaria: { ...prev.complementaria, costoReferencia: e.target.value } }));
                      if (errors.costo) setErrors(prev => ({ ...prev, costo: '' }));
                    }}
                    className={`w-full pl-8 pr-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all ${
                      errors.costo ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="0.00"
                    id="form-costo"
                  />
                </div>
                {errors.costo ? (
                  <p className="text-xs text-red-500 font-medium mt-1">{errors.costo}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">Costo según cotización formal del mercado.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Proveedor Sugerido / Marca <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  value={formState.complementaria.proveedor}
                  onChange={(e) => {
                    setFormState(prev => ({ ...prev, complementaria: { ...prev.complementaria, proveedor: e.target.value } }));
                    if (errors.proveedor) setErrors(prev => ({ ...prev, proveedor: '' }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all ${
                    errors.proveedor ? 'border-red-500' : 'border-slate-200'
                  }`}
                  placeholder="Ej: Distribuidora Médica del Occidente S.A."
                  id="form-proveedor"
                />
                {errors.proveedor && <p className="text-xs text-red-500 font-medium mt-1">{errors.proveedor}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Justificación Técnica Completa <span className="text-[#dc2626]">*</span>
              </label>
              <textarea
                value={formState.complementaria.justificacion}
                onChange={(e) => {
                  setFormState(prev => ({ ...prev, complementaria: { ...prev.complementaria, justificacion: e.target.value } }));
                  if (errors.justificacion) setErrors(prev => ({ ...prev, justificacion: '' }));
                }}
                rows={4}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none transition-all resize-none ${
                  errors.justificacion ? 'border-red-500 bg-red-50/10' : 'border-slate-200'
                }`}
                placeholder="Por qué este insumo clínico es estrictamente indispensable para el hospital frente a otras soluciones en stock..."
                id="form-justificacion"
              />
              {errors.justificacion ? (
                <p className="text-xs text-red-500 font-medium mt-1">{errors.justificacion}</p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  Mínimo 20 caracteres. Justifique las ventajas clínicas, menores efectos secundarios, ahorro de suministros, o especificidad quirúrgica.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Row 1 / Col 4: Drag Drop PDF Area and Guidelines */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* DRAG AND DROP FILE UPLOAD AREA */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col" id="panel-upload">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              Documentación Obligatoria
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Debe adjuntar una cotización formal digitalizada (en formato PDF). Este archivo se integrará directamente al expediente de compras del HCG.
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                isDragging 
                  ? 'border-indigo-600 bg-indigo-50/50' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
              onClick={() => document.getElementById('hidden-file-input')?.click()}
              id="pdf-drop-zone"
            >
              <input
                type="file"
                id="hidden-file-input"
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
              />

              {!formState.complementaria.pdfCargado && uploadProgress === null ? (
                <>
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Arrastre su PDF aquí
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    o haga clic para examinar archivos.
                  </span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mt-3">
                    Máx: 5 MB (Solo PDF)
                  </span>
                </>
              ) : uploadProgress !== null ? (
                <div className="w-full text-center py-4">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto mb-3" />
                  <span className="text-xs font-bold text-slate-700 block">
                    Cargando y firmando archivo...
                  </span>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 max-w-xs mx-auto overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="w-full" id="uploaded-pdf-info">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 block truncate px-2">
                    {formState.complementaria.pdfNombre}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {formState.complementaria.pdfTamano}
                  </span>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePdf();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-bold hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      id="btn-remove-pdf"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover archivo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {errors.pdf && (
              <div className="mt-3 flex items-start gap-1 p-2 bg-red-50 rounded-lg text-xs leading-none text-red-600 border border-red-100 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errors.pdf}</span>
              </div>
            )}
          </div>

          {/* SYSTEM GUIDELINES SUMMARY */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-xs" id="guideline-summary-panel">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Consejos del Formulario</h4>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <p>
                <strong>✔ Nomenclatura Neutra:</strong> No agregue marcas comerciales ("Tylenol", "Kimberly") en la descripción. Mencione el genérico ("Paracetamol", "Látex de exploración").
              </p>
              <p>
                <strong>✔ Partida Presupuestal:</strong> Cerciórese de que la partida concuerda con la partida general anual de su servicio para evitar retrasos de auditoría de finanzas.
              </p>
              <p>
                <strong>✔ Archivo Escaneado:</strong> El PDF debe ser nítido, incluyendo el logo y RFC visible del proveedor proponente para autorizar el alta clínica.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. NAVIGATION BUTTONS WITH MODAL TRIGGERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={handleBackWithCheck}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors cursor-pointer"
          id="btn-back-form"
        >
          <ChevronLeft className="w-5 h-5 shrink-0" />
          Regresar a Declaración
        </button>

        <button
          onClick={handleNextSubmit}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
          id="btn-submit-form"
        >
          Generar Formato de Inclusión
          <ArrowRight className="w-5 h-5 shrink-0" />
        </button>
      </div>

      {/* PROTECTION AGAINST DATA LOSS MODAL */}
      {showExitModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" 
          id="data-loss-modal"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              ¿Desea salir del formulario?
            </h3>
            
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Tiene datos cargados en el formulario de inclusión. Al retroceder o recargar, perderá todo su progreso realizado por motivos de seguridad del catálogo.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all cursor-pointerToken cursor-pointer"
                id="cancel-modal-btn"
              >
                Permanecer en Registro
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                id="confirm-modal-btn"
              >
                Sí, Descartar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
