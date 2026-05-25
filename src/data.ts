import { CatalogItem } from './types';

export const UNIDADES_HOSPITALARIAS = [
  'Fray Antonio Alcalde',
  'Dr. Juan I. Menchaca',
  'Unidad de Consulta Externa'
] as const;

export const FAMILIAS = [
  'MEDICAMENTOS ANASTÉSICOS',
  'MATERIAL DE CURACIÓN',
  'MATERIAL DE LABORATORIO',
  'MATERIAL RADIOLÓGICO Y ULTRASONIDO',
  'INSTRUMENTAL MÉDICO Quirúrgico',
  'EQUIPO MÉDICO Y BIOMÉDICO',
  'MATERIAL DE ODONTOLOGÍA',
  'SERVICIOS DE MANTENIMIENTO DE EQUIPO',
  'SUSTANCIAS QUÍMICAS Y REACTIVOS',
  'SOPORTE Y ACCESORIOS DE ORTOPEDIA y PRÓTESIS',
  'PRODUCTOS ALIMENTICIOS PARA PACIENTES',
  'OTROS INSUMOS DE CONSUMO GENERAL'
];

export const UNIDADES_MEDIDA = [
  'Pieza (PZA)',
  'Caja (CJA)',
  'Frasco (FCO)',
  'Paquete (PQT)',
  'Litro (L)',
  'Amolleta/Ampolleta (AMP)',
  'Par (PAR)',
  'Tubo (TUB)',
  'Rollo (ROL)',
  'Miligramo (MG)',
  'Otro (Especificar)'
];

export const PARTIDAS_PRESUPUESTALES = [
  { clave: '25101', nombre: 'Sustancias químicas químicas básicas' },
  { clave: '25301', nombre: 'Medicinas y productos farmacéuticos' },
  { clave: '25401', nombre: 'Materiales, accesorios y suministros médicos' },
  { clave: '25501', nombre: 'Materiales, accesorios y suministros de laboratorio' },
  { clave: '25901', nombre: 'Otros productos químicos y de laboratorio' },
  { clave: '29501', nombre: 'Refacciones y accesorios menores de equipo e instrumental médico y de laboratorio' },
  { clave: '35401', nombre: 'Instalación, reparación y mantenimiento de equipo e instrumental médico y de laboratorio' }
];

export const HCG_CATALOG: CatalogItem[] = [
  {
    id: '1',
    clave: '010.000.0104.00',
    descripcion: 'PARACETAMOL TABLETA 500 MG VÍA ORAL',
    estado: 'Activo',
    familia: 'MEDICAMENTOS ANASTÉSICOS',
    partida: '25301 - Medicinas y productos farmacéuticos',
    unidadMedida: 'Caja (CJA)'
  },
  {
    id: '2',
    clave: '010.000.0200.00',
    descripcion: 'IBUPROFENO TABLETA 400 MG VÍA ORAL',
    estado: 'Activo',
    familia: 'MEDICAMENTOS ANASTÉSICOS',
    partida: '25301 - Medicinas y productos farmacéuticos',
    unidadMedida: 'Caja (CJA)'
  },
  {
    id: '3',
    clave: '010.000.1234.00',
    descripcion: 'LOSARTÁN POTÁSICO TABLETA 50 MG COAT',
    estado: 'Activo',
    familia: 'MEDICAMENTOS ANASTÉSICOS',
    partida: '25301 - Medicinas y productos farmacéuticos',
    unidadMedida: 'Caja (CJA)'
  },
  {
    id: '4',
    clave: '010.000.4101.00',
    descripcion: 'AMOXICILINA SUSPENSIÓN 250 MG / 5 ML FRASCO 75 ML',
    estado: 'Inactivo',
    familia: 'MEDICAMENTOS ANASTÉSICOS',
    partida: '25301 - Medicinas y productos farmacéuticos',
    unidadMedida: 'Frasco (FCO)'
  },
  {
    id: '5',
    clave: '060.435.0028.00',
    descripcion: 'GUANTES DE EXPLORACIÓN DE LÁTEX DESECHABLES TALLA MEDIANA CAJA CON 100 PIEZAS',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Caja (CJA)'
  },
  {
    id: '6',
    clave: '060.435.0030.00',
    descripcion: 'GUANTES DE LÁTEX PARA CIRUGÍA TALLA 7.5 ESTÉRIL DESECHABLES',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Par (PAR)'
  },
  {
    id: '7',
    clave: '060.435.0040.00',
    descripcion: 'GUANTE DE LÁTEX PARA EXAMEN TALLA CHICA CAJA CON 100 PIEZAS',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Caja (CJA)'
  },
  {
    id: '8',
    clave: '060.435.0042.00',
    descripcion: 'GUANTE DE LÁTEX PARA EXAMEN TALLA GRANDE CAJA CON 100 PIEZAS',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Caja (CJA)'
  },
  {
    id: '9',
    clave: '060.125.1878.00',
    descripcion: 'JERINGA DESECHABLE DE PLÁSTICO DE 3 ML CON AGUJA 21G X 32 MM',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Pieza (PZA)'
  },
  {
    id: '10',
    clave: '060.125.1902.00',
    descripcion: 'JERINGA DE PLÁSTICO GRABADA DE 5 ML CON AGUJA 22G X 32 MM',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Pieza (PZA)'
  },
  {
    id: '11',
    clave: '060.125.1920.00',
    descripcion: 'JERINGA DESECHABLE DE PLÁSTICO DE 10 ML CON AGUJA 21G X 32 MM',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Pieza (PZA)'
  },
  {
    id: '12',
    clave: '060.831.0543.00',
    descripcion: 'SOLUCIÓN FISIOLÓGICA DE CLORURO DE SODIO AL 0.9% FRASCO 500 ML',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Frasco (FCO)'
  },
  {
    id: '13',
    clave: '060.550.0120.00',
    descripcion: 'GASA SIMPLE SECA RECTÁNGULO DE ALGODÓN 10 X 10 CM PAQUETE CON 100 PIEZAS',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Paquete (PQT)'
  },
  {
    id: '14',
    clave: '060.345.0921.00',
    descripcion: 'CUBREBOCAS TRIPLE CAPA CON AJUSTE ELÁSTICO DESECHABLE CAJA CON 50 PIEZAS',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Caja (CJA)'
  },
  {
    id: '15',
    clave: '020.100.0105.00',
    descripcion: 'AGUA DESTILADA ESTÉRIL PARA USO MÉDICO FRASCO 1 LITRO',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Frasco (FCO)'
  },
  {
    id: '16',
    clave: '080.360.0115.00',
    descripcion: 'ALCOHOL ETÍLICO DESNATURALIZADO AL 70% ENVASE CON 1 LITRO',
    estado: 'Activo',
    familia: 'SUSTANCIAS QUÍMICAS Y REACTIVOS',
    partida: '25101 - Sustancias químicas químicas básicas',
    unidadMedida: 'Frasco (FCO)'
  },
  {
    id: '17',
    clave: '060.620.0110.00',
    descripcion: 'VENDAR ADHESIVA ELÁSTICA (TENSOPLAST) 7.5 CM X 4.5 M',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Pieza (PZA)'
  },
  {
    id: '18',
    clave: '080.220.0340.00',
    descripcion: 'REACTIVO AGUA DE FIJADOR TIPO REVELADOR RADIOGRÁFICO MARCA KODAK BIDÓN 19 L',
    estado: 'Activo',
    familia: 'MATERIAL RADIOLÓGICO Y ULTRASONIDO',
    partida: '25501 - Materiales, accesorios y suministros de laboratorio',
    unidadMedida: 'Frasco (FCO)'
  },
  {
    id: '19',
    clave: '080.220.0355.00',
    descripcion: 'PELÍCULA RADIOGRÁFICA DENTAL INFANTIL INF-01 CAJA CON 150 COMBINACIONES',
    estado: 'Activo',
    familia: 'MATERIAL RADIOLÓGICO Y ULTRASONIDO',
    partida: '25501 - Materiales, accesorios y suministros de laboratorio',
    unidadMedida: 'Caja (CJA)'
  },
  {
    id: '20',
    clave: '010.000.3201.00',
    descripcion: 'ÁCIDO ACETILSALICÍLICO TABLETA SOLUBLE 100 MG CAJA CON 30 PIEZAS',
    estado: 'Activo',
    familia: 'MEDICAMENTOS ANASTÉSICOS',
    partida: '25301 - Medicinas y productos farmacéuticos',
    unidadMedida: 'Caja (CJA)'
  },
  {
    id: '21',
    clave: '060.015.0110.00',
    descripcion: 'ELECTRODOS DESECHABLES PARA ADULTO MONITOREO CARDIÁCO PAQUETE CON 50 PIEZAS',
    estado: 'Activo',
    familia: 'MATERIAL DE CURACIÓN',
    partida: '25401 - Materiales, accesorios y suministros médicos',
    unidadMedida: 'Paquete (PQT)'
  },
  {
    id: '22',
    clave: '010.000.5188.00',
    descripcion: 'INSULINA HUMANA ACCIÓN RÁPIDA (REGULAR) SOLUCIÓN INYECTABLE 100 UI/ML FRASCO 10 ML',
    estado: 'Activo',
    familia: 'MEDICAMENTOS ANASTÉSICOS',
    partida: '25301 - Medicinas y productos farmacéuticos',
    unidadMedida: 'Frasco (FCO)'
  }
];
