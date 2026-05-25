export type UserStep = 1 | 2 | 3 | 4 | 5;

export interface CatalogItem {
  id: string;
  clave: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  familia: string;
  partida: string;
  unidadMedida: string;
}

export interface SearchResult {
  item: CatalogItem;
  similarity: number; // Percentage 0 - 100
  matchedTokens: string[];
}

export interface SolicitanteData {
  nombre: string;
  cargo: string;
  servicio: string;
  unidadHospitalaria: 'Fray Antonio Alcalde' | 'Dr. Juan I. Menchaca' | 'Unidad de Consulta Externa';
}

export interface ArticuloData {
  descripcion: string;
  familia: string;
  unidadMedida: string;
  unidadMedidaOtro?: string;
  partida: string;
}

export interface InfoComplementariaData {
  costoReferencia: string;
  justificacion: string;
  proveedor: string;
  pdfCargado: boolean;
  pdfNombre?: string;
  pdfTamano?: string;
}

export interface InclusionFormState {
  articulo: ArticuloData;
  solicitante: SolicitanteData;
  complementaria: InfoComplementariaData;
}

export interface NotificationToast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

export interface AIRecommendation {
  descripcionEstandarizada: string;
  familiaRecomendada: string;
  partidaRecomendada: string;
  unidadRecomendada: string;
  confianza: number; // 0 to 100
}
