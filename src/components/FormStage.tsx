import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ArrowRight, Sparkles, Upload, FileText, Trash2, 
  User, Clipboard, DollarSign, Settings, Check, HelpCircle, AlertTriangle 
} from 'lucide-react';
import { 
  InclusionFormState, AIRecommendation, NotificationToast 
} from '../types';
import { googleSignIn, logout, initAuth } from '../firebase';
import type { User } from 'firebase/auth';
import { uploadToDrive, appendToSpreadsheet, sendGmailNotification } from '../utils/workspaceServices';
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

  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);

  const [isSyncingWorkspace, setIsSyncingWorkspace] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    drive: 'idle',
    sheets: 'idle',
    gmail: 'idle'
  });

  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        addToast('Sesión de Google Workspace iniciada con éxito.', 'success');
      }
    } catch (err) {
      console.error('Failed to sign in with Google:', err);
      addToast('Error al iniciar sesión con Google.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      addToast('Sesión de Google Workspace cerrada.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };
  
  // Exit protection modal state
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'back' | 'reset' | null>(null);

  // Field validation visual triggers
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    // Fire smart assistant upon entering Paso 4, using original terms searched
    if (originalSearchQuery) {
      const fetchAiRecommendation = async () => {
        setIsAiLoading(true);
        try {
          const res = await fetch("/api/sugerir-ia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: originalSearchQuery }),
          });
          const data = await res.json();
          if (data.success && data.recommendation) {
            setAiRecommendation(data.recommendation);
            addToast("Asistente Inteligente HCG: Catálogo analizado en tiempo real.", "success");
          } else {
            // Check if fallback needed due to lack of API key or other things
            const localRec = getSmartRecommendations(originalSearchQuery);
            setAiRecommendation(localRec);
            if (data.fallback) {
              addToast(data.message, "warning");
            }
          }
        } catch (err) {
          console.error("AI fetch failed, falling back to local analysis:", err);
          const localRec = getSmartRecommendations(originalSearchQuery);
          setAiRecommendation(localRec);
        } finally {
          setIsAiLoading(false);
        }
      };

      fetchAiRecommendation();
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
            setUploadedPdfFile(file); // Store raw File object for Drive
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
    setUploadedPdfFile(null); // Clear raw File object
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

  const handleNextSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!googleUser || !googleToken) {
      addToast('Por favor, conecte su cuenta institucional de Google para autorizar el reporte.', 'warning');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Confirm mutating operations
    const confirmed = window.confirm(
      `¿Confirmas el envío de esta solicitud? Se guardarán los documentos en Google Drive, se añadirá el registro en la hoja de Google Sheets y se enviará la notificación por Gmail.`
    );
    if (!confirmed) return;

    // Generate unique folio identification code before upload
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const assignedFolio = `HCG-CAT-2026-${randomNum}`;

    // Temporarily update local state directly
    setFormState(prev => ({ ...prev, folio: assignedFolio }));
    setIsSyncingWorkspace(true);
    setSyncStatus({ drive: 'running', sheets: 'idle', gmail: 'idle' });

    try {
      // Step 1: Upload to Google Drive (folder 1h_2yEAXoHdOQzhDCBYvvIDjGDr91NZrM)
      const folderId = '1h_2yEAXoHdOQzhDCBYvvIDjGDr91NZrM';
      let driveOk = true;

      if (uploadedPdfFile) {
        const destPdfName = `${assignedFolio}_cotizacion_${uploadedPdfFile.name}`;
        const fileId = await uploadToDrive(
          googleToken,
          folderId,
          destPdfName,
          'application/pdf',
          uploadedPdfFile
        );
        if (!fileId) driveOk = false;
      }

      // Generate text summary
      const requestTextContent = [
        `========================================================================`,
        `                 HOSPITAL CIVIL DE GUADALAJARA`,
        `     FORMATO OFICIAL DE SOLICITUD DE INCLUSIÓN AL CATÁLOGO`,
        `========================================================================`,
        `FOLIO CONTROL: ${assignedFolio}`,
        `FECHA REGISTRO: ${new Date().toLocaleString('es-MX')}`,
        ``,
        `--- 1. DATOS DEL SOLICITANTE ---`,
        `Nombre: ${formState.solicitante.nombre || 'N/A'}`,
        `Cargo: ${formState.solicitante.cargo || 'N/A'}`,
        `Servicio Clínico: ${formState.solicitante.servicio || 'N/A'}`,
        `Unidad Hospitalaria: ${formState.solicitante.unidadHospitalaria || 'N/A'}`,
        ``,
        `--- 2. DETALLES DEL ARTÍCULO ---`,
        `Descripción Técnica: ${formState.articulo.descripcion || 'N/A'}`,
        `Familia Almacén: ${formState.articulo.familia || 'N/A'}`,
        `Unidad de Medida: ${formState.articulo.unidadMedida === 'Otro (Especificar)' ? formState.articulo.unidadMedidaOtro : formState.articulo.unidadMedida}`,
        `Partida Presupuestal: ${formState.articulo.partida || 'N/A'}`,
        ``,
        `--- 3. DETALLES ECONÓMICOS & JUSTIFICACIÓN ---`,
        `Costo Unitario de Referencia: $${formState.complementaria.costoReferencia || '0.00'} MXN`,
        `Distribuidor / Proveedor de Referencia: ${formState.complementaria.proveedor || 'N/A'}`,
        `Soporte PDF Cargado: ${formState.complementaria.pdfNombre || 'N/A'}`,
        `Justificación Clínica/Logística:`,
        `"${formState.complementaria.justificacion || 'Sin justificación.'}"`,
        ``,
        `========================================================================`,
        `SISTEMA VERIFICADOR DE CATÁLOGO CENTRAL HCG - CLOUD SERVER ARCHIVE`,
        `========================================================================`
      ].join('\r\n');

      const textFileId = await uploadToDrive(
        googleToken,
        folderId,
        `${assignedFolio}_solicitud_registro.txt`,
        'text/plain',
        new Blob([requestTextContent], { type: 'text/plain;charset=utf-8' })
      );
      if (!textFileId) driveOk = false;

      setSyncStatus(prev => ({ ...prev, drive: driveOk ? 'success' : 'error', sheets: 'running' }));

      // Step 2: Append to Google Sheets
      const spreadsheetId = '1sI_Yy5A7_HqSH1FY4ftg9EMs-jMw7HpQQFV4Ai7X6z8';
      const gid = '661900702';
      const sheetSuccess = await appendToSpreadsheet(
        googleToken,
        spreadsheetId,
        gid,
        formState,
        assignedFolio
      );

      setSyncStatus(prev => ({ ...prev, sheets: sheetSuccess ? 'success' : 'error', gmail: 'running' }));

      // Step 3: Send email notification via Gmail
      const targetSupportEmail = 'jlangarica@hcg.gob.mx';
      const emailSuccess = await sendGmailNotification(
        googleToken,
        targetSupportEmail,
        assignedFolio,
        formState
      );

      setSyncStatus(prev => ({ ...prev, gmail: emailSuccess ? 'success' : 'error' }));

      if (driveOk && sheetSuccess && emailSuccess) {
        addToast('Sincronización con Google Workspace exitosa.', 'success');
      } else {
        addToast('Sincronización finalizada con algunos avisos o incidentes técnicos.', 'warning');
      }

      setTimeout(() => {
        setIsSyncingWorkspace(false);
        onSubmit();
      }, 1500);

    } catch (err) {
      console.error('Workspace syncing error:', err);
      addToast('La sincronización falló, pero se guardará de forma local temporalmente.', 'warning');
      setIsSyncingWorkspace(false);
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
      {/* 0. AI LOADER BANNER */}
      {isAiLoading && (
        <div 
          className="flex items-center gap-3 p-4 bg-blue-50/80 border border-blue-200/50 rounded-2xl mb-6 text-sm text-blue-700 font-medium animate-pulse" 
          id="iaLoaderBanner"
        >
          <div className="w-5 h-5 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" aria-hidden="true" />
          <span>Estandarizando propuesta técnica automatizada con IA en segundo plano...</span>
        </div>
      )}

      {/* 1. SMART AI RECOMMENDATION BANNER */}
      {aiRecommendation && showAiBanner && (
        <div 
          className="border-2 border-green-500 bg-green-50 p-6 rounded-2xl shadow-xs flex flex-col gap-3 mb-8" 
          id="smart-assistant-banner"
        >
          <div className="flex items-center gap-2 text-green-700">
            <Sparkles className="w-5 h-5 text-green-600 animate-pulse" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Asistente de Estandarización Inteligente</h3>
            <span className="text-xs text-green-600/80 ml-auto">Confianza: {aiRecommendation.confianza}%</span>
          </div>
          
          <p className="text-xs text-slate-600 leading-relaxed">
            He analizado tu solicitud basada en la consulta de búsqueda inicial "{originalSearchQuery}". Para cumplir con los estrictos estándares de homologación del hospital, sugiero la siguiente redacción institucional y clasificaciones técnicas:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-green-200 text-xs font-mono text-slate-800 leading-normal">
              <span className="text-[9px] uppercase font-bold text-green-700 block mb-1 font-sans">Redacción Estandarizada</span>
              <span className="font-bold">{aiRecommendation.descripcionEstandarizada}</span>
            </div>
            
            <div className="bg-white p-3.5 rounded-xl border border-green-200 text-xs text-slate-705 space-y-1">
              <span className="text-[9px] uppercase font-bold text-green-700 block mb-1">Estructura Presupuestal</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Familia:</span>
                <span className="font-bold text-slate-800 text-[11px] truncate max-w-[150px]">{aiRecommendation.familiaRecomendada}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Partida:</span>
                <span className="font-bold text-slate-800 text-[11px] truncate max-w-[150px]">{aiRecommendation.partidaRecomendada}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1.5">
            <button
              type="button"
              onClick={handleApplyAi}
              disabled={aiApplied}
              className={`text-xs font-bold py-2 px-4 rounded uppercase transition-colors cursor-pointer ${
                aiApplied
                  ? 'bg-green-700 text-white cursor-default'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              id="btn-apply-ai"
            >
              {aiApplied ? '✓ Sugerencia Aplicada' : 'Aplicar Sugerencia'}
            </button>
            <button
              type="button"
              onClick={handleRejectAi}
              className="px-4 py-2 border border-slate-300 text-slate-500 text-xs font-bold rounded uppercase hover:bg-slate-50 cursor-pointer"
              id="btn-reject-ai"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}

      {/* GOOGLE WORKSPACE CONNECTION BANNER */}
      <div 
        className={`border rounded-2xl p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 shadow-xs ${
          googleUser 
            ? 'border-emerald-200 bg-emerald-50/70 text-slate-800' 
            : 'border-slate-200 bg-slate-50 text-slate-700'
        }`}
        id="workspace-oauth-banner"
      >
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`p-3 rounded-xl shrink-0 ${googleUser ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm tracking-tight text-slate-900 font-sans">
              {googleUser ? 'Conexión de Google Workspace Activa' : 'Habilitar Guardado en Google Workspace'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-normal font-sans">
              {googleUser 
                ? `Iniciaste sesión como ${googleUser.email}. Con permiso, archivaremos tu cotización en Google Drive, registraremos la fila en Sheets y notificaremos al Comite en jlangarica@hcg.gob.mx por Gmail autónomamente.`
                : 'Sincroniza directamente este trámite con la carpeta oficial de Google Drive, la base clínica de Sheets y alertas por Gmail.'
              }
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto flex justify-end font-sans">
          {googleUser ? (
            <button
              onClick={handleGoogleLogout}
              className="px-4 py-2 text-xs font-bold border border-rose-300 hover:border-rose-400 text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              id="google-disconnect-btn"
            >
              Desconectar Cuenta
            </button>
          ) : (
            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-2.5 px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
              id="google-connect-btn"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isLoggingIn ? 'Conectando...' : 'Acceder con Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CORE FORM SEGMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="form-grid-layout">
        {/* Row 1 / Col 8: Form parameters */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECTION 1: DATOS DEL ARTÍCULO */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative" id="panel-articulo">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <Clipboard className="w-5 h-5 text-blue-800" />
              <h3 className="text-lg font-bold text-slate-800">1. Identificación del Artículo Solicitado</h3>
            </div>

            <div className="space-y-6">
              {/* Descripción con Floating Label */}
              <div>
                <div className={`floating-label-group ${errors.desc ? 'floating-label-group-error' : ''}`}>
                  <input
                    type="text"
                    value={formState.articulo.descripcion}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, articulo: { ...prev.articulo, descripcion: e.target.value } }));
                      if (errors.desc) setErrors(prev => ({ ...prev, desc: '' }));
                      if (aiApplied) setAiApplied(false);
                    }}
                    className="floating-input"
                    placeholder=" "
                    id="form-desc"
                  />
                  <label className="floating-label">Descripción Técnica Completa *</label>
                </div>
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Familia de Insumos *
                  </label>
                  <select
                    value={formState.articulo.familia}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, articulo: { ...prev.articulo, familia: e.target.value } }));
                      if (errors.familia) setErrors(prev => ({ ...prev, familia: '' }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-800 focus:outline-none transition-all cursor-pointer ${
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Partida Presupuestal Autorizada *
                  </label>
                  <select
                    value={formState.articulo.partida}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, articulo: { ...prev.articulo, partida: e.target.value } }));
                      if (errors.partida) setErrors(prev => ({ ...prev, partida: '' }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-800 focus:outline-none transition-all cursor-pointer ${
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Unidad de Medida / Presentación *
                  </label>
                  <select
                    value={formState.articulo.unidadMedida}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, articulo: { ...prev.articulo, unidadMedida: e.target.value } }));
                      if (errors.unidad) setErrors(prev => ({ ...prev, unidad: '' }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-800 focus:outline-none transition-all cursor-pointer ${
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

                {/* ANIMATED GRID EXPANSION FOR CUSTOM UNIT */}
                <div className={`collapsible-grid md:col-span-1 ${formState.articulo.unidadMedida === 'Otro (Especificar)' ? 'collapsible-grid-open' : ''}`}>
                  <div className="collapsible-inner pt-4 md:pt-0">
                    <div className={`floating-label-group ${errors.unidadOtro ? 'floating-label-group-error' : ''}`}>
                      <input
                        type="text"
                        value={formState.articulo.unidadMedidaOtro || ''}
                        onChange={(e) => {
                          setFormState(prev => ({ ...prev, articulo: { ...prev.articulo, unidadMedidaOtro: e.target.value } }));
                          if (errors.unidadOtro) setErrors(prev => ({ ...prev, unidadOtro: '' }));
                        }}
                        className="floating-input"
                        placeholder=" "
                        id="form-unidad-otro"
                      />
                      <label className="floating-label">Especifique Unidad de Medida *</label>
                    </div>
                    {errors.unidadOtro && <p className="text-xs text-red-500 font-medium mt-1">{errors.unidadOtro}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: DATOS DEL SOLICITANTE */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs" id="panel-solicitante">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <User className="w-5 h-5 text-blue-800" />
              <h3 className="text-lg font-bold text-slate-800">2. Identificación del Funcionario Solicitante</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className={`floating-label-group ${errors.solNombre ? 'floating-label-group-error' : ''}`}>
                  <input
                    type="text"
                    value={formState.solicitante.nombre}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, solicitante: { ...prev.solicitante, nombre: e.target.value } }));
                      if (errors.solNombre) setErrors(prev => ({ ...prev, solNombre: '' }));
                    }}
                    className="floating-input"
                    placeholder=" "
                    id="form-sol-nombre"
                  />
                  <label className="floating-label">Nombre Completo del Solicitante *</label>
                </div>
                {errors.solNombre && <p className="text-xs text-red-500 font-medium mt-1">{errors.solNombre}</p>}
              </div>

              <div>
                <div className={`floating-label-group ${errors.solCargo ? 'floating-label-group-error' : ''}`}>
                  <input
                    type="text"
                    value={formState.solicitante.cargo}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, solicitante: { ...prev.solicitante, cargo: e.target.value } }));
                      if (errors.solCargo) setErrors(prev => ({ ...prev, solCargo: '' }));
                    }}
                    className="floating-input"
                    placeholder=" "
                    id="form-sol-cargo"
                  />
                  <label className="floating-label">Cargo Formal *</label>
                </div>
                {errors.solCargo && <p className="text-xs text-red-500 font-medium mt-1">{errors.solCargo}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div>
                <div className={`floating-label-group ${errors.solServicio ? 'floating-label-group-error' : ''}`}>
                  <input
                    type="text"
                    value={formState.solicitante.servicio}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, solicitante: { ...prev.solicitante, servicio: e.target.value } }));
                      if (errors.solServicio) setErrors(prev => ({ ...prev, solServicio: '' }));
                    }}
                    className="floating-input"
                    placeholder=" "
                    id="form-sol-servicio"
                  />
                  <label className="floating-label">Servicio Clínico / Departamento *</label>
                </div>
                {errors.solServicio && <p className="text-xs text-red-500 font-medium mt-1">{errors.solServicio}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Unidad Hospitalaría HCG *
                </label>
                <select
                  value={formState.solicitante.unidadHospitalaria}
                  onChange={(e) => {
                    setFormState(prev => ({ ...prev, solicitante: { ...prev.solicitante, unidadHospitalaria: e.target.value as any } }));
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-800 focus:outline-none transition-all cursor-pointer"
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
              <DollarSign className="w-5 h-5 text-blue-800" />
              <h3 className="text-lg font-bold text-slate-800">3. Información Económica e Institucional</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className={`floating-label-group ${errors.costo ? 'floating-label-group-error' : ''}`}>
                  <input
                    type="text"
                    value={formState.complementaria.costoReferencia}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, complementaria: { ...prev.complementaria, costoReferencia: e.target.value } }));
                      if (errors.costo) setErrors(prev => ({ ...prev, costo: '' }));
                    }}
                    className="floating-input pl-8"
                    placeholder=" "
                    id="form-costo"
                  />
                  <div className="absolute left-4 top-[17px] text-slate-500 font-semibold text-sm pointer-events-none">$</div>
                  <label className="floating-label pl-4">Costo de Referencia Unitario (MXN) *</label>
                </div>
                {errors.costo ? (
                  <p className="text-xs text-red-500 font-medium mt-1">{errors.costo}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">Costo según cotización formal de mercado.</p>
                )}
              </div>

              <div>
                <div className={`floating-label-group ${errors.proveedor ? 'floating-label-group-error' : ''}`}>
                  <input
                    type="text"
                    value={formState.complementaria.proveedor}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, complementaria: { ...prev.complementaria, proveedor: e.target.value } }));
                      if (errors.proveedor) setErrors(prev => ({ ...prev, proveedor: '' }));
                    }}
                    className="floating-input"
                    placeholder=" "
                    id="form-proveedor"
                  />
                  <label className="floating-label">Proveedor Sugerido / Marca *</label>
                </div>
                {errors.proveedor && <p className="text-xs text-red-500 font-medium mt-1">{errors.proveedor}</p>}
              </div>
            </div>

            <div className="mt-5">
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
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-800 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-800 focus:outline-none transition-all resize-none ${
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
              <Upload className="w-4 h-4 text-blue-800" />
              Documentación Obligatoria
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Debe adjuntar una cotización formal digitalizada (en formato PDF). Este archivo se integrará directamente al expediente de compras del HCG.
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center relative ${
                formState.complementaria.pdfCargado
                  ? 'border-emerald-500 bg-emerald-50/30'
                  : isDragging
                  ? 'border-blue-800 bg-blue-50/40 animate-pulse scale-[1.01]'
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
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-800 mb-3">
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
                  <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-800 animate-spin mx-auto mb-3" />
                  <span className="text-xs font-bold text-slate-700 block">
                    Cargando y firmando archivo...
                  </span>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 max-w-xs mx-auto overflow-hidden">
                    <div className="bg-blue-800 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
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
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-sm transition-all duration-150 active:scale-98 shadow-md hover:shadow-lg cursor-pointer"
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

      {/* WORKSPACE SYNCHRONIZATION OVERLAY MODAL */}
      {isSyncingWorkspace && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs" 
          id="workspace-sync-modal"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 flex flex-col items-center">
            {/* Spinning Loader Ring */}
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-x-0 inset-y-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 tracking-tight text-center">
              Sincronizando con Google Workspace...
            </h3>
            <p className="text-[10px] text-slate-400 text-center mt-1.5 mb-6">
              Por favor, no cierre esta ventana mientras archivamos y registramos su solicitud con autorización.
            </p>

            {/* Steps Progress */}
            <div className="w-full space-y-3">
              {/* Drive step */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    syncStatus.drive === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    syncStatus.drive === 'running' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Guardando cotización en Google Drive</span>
                </div>
                <div>
                  {syncStatus.drive === 'success' && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Completado</span>}
                  {syncStatus.drive === 'running' && <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full animate-bounce">Subiendo...</span>}
                  {syncStatus.drive === 'idle' && <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">En espera</span>}
                  {syncStatus.drive === 'error' && <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">Omitido</span>}
                </div>
              </div>

              {/* Sheets step */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    syncStatus.sheets === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    syncStatus.sheets === 'running' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Añadiendo solicitud a Google Sheets</span>
                </div>
                <div>
                  {syncStatus.sheets === 'success' && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Completado</span>}
                  {syncStatus.sheets === 'running' && <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full animate-bounce">Añadiendo...</span>}
                  {syncStatus.sheets === 'idle' && <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">En espera</span>}
                  {syncStatus.sheets === 'error' && <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">Error</span>}
                </div>
              </div>

              {/* Gmail step */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    syncStatus.gmail === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    syncStatus.gmail === 'running' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Enviando aviso vía Gmail</span>
                </div>
                <div>
                  {syncStatus.gmail === 'success' && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Enviado</span>}
                  {syncStatus.gmail === 'running' && <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full animate-bounce">Enviando...</span>}
                  {syncStatus.gmail === 'idle' && <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">En espera</span>}
                  {syncStatus.gmail === 'error' && <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">Error</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
