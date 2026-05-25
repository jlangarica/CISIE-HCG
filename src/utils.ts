import { CatalogItem, SearchResult, AIRecommendation } from './types';
import { HCG_CATALOG, FAMILIAS, PARTIDAS_PRESUPUESTALES, UNIDADES_MEDIDA } from './data';

// Dictionary of HCG medical / technical abbreviations and synonyms
const ABBREVIATIONS: { [key: string]: string } = {
  'MG': 'MILIGRAMOS',
  'G': 'GRAMOS',
  'GR': 'GRAMOS',
  'ML': 'MILILITROS',
  'PZA': 'PIEZA',
  'PZAS': 'PIEZAS',
  'C/': 'CON',
  'CON/': 'CON',
  'MCA': 'MARCA',
  'TAB': 'TABLETA',
  'TABS': 'TABLETAS',
  'LT': 'LITRO',
  'LTS': 'LITROS',
  'SOL': 'SOLUCION',
  'SOLN': 'SOLUCION',
  'AMP': 'AMPOLLETA',
  'AMPS': 'AMPOLLETAS',
  'FCO': 'FRASCO',
  'FCOS': 'FRASCOS',
  'CJA': 'CAJA',
  'CJAS': 'CAJAS',
  'PQT': 'PAQUETE',
  'PQTS': 'PAQUETES',
  'CH': 'CHICA',
  'M': 'MEDIANA',
  'GDE': 'GRANDE',
  'X': 'POR',
  'EST': 'ESTERIL',
  'CAPT': 'CAPSULA',
  'CAPS': 'CAPSULAS'
};

/**
 * Normalizes input string by removing accents, converting to uppercase, and stripping non-alphanumeric chars.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toUpperCase()
    .trim();
}

/**
 * Normalizes and expands abbreviations in a given string.
 */
export function expandAbbreviations(text: string): string {
  const normalized = normalizeText(text);
  // Tokenize by spaces and punctuation
  const words = normalized.split(/[^A-Z0-9%/]+/);
  
  const expanded = words.map(word => {
    // Check if directly in abbreviations dictionary
    if (ABBREVIATIONS[word]) {
      return ABBREVIATIONS[word];
    }
    // Handle things like "C/10" or "C/100" -> "CON 10..."
    if (word.startsWith('C/') && word.length > 2) {
      return 'CON ' + word.substring(2);
    }
    return word;
  });

  return expanded.filter(Boolean).join(' ');
}

/**
 * Simple Levenshtein distance to cover spelling mistakes / typos.
 */
function getLevenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j, alen = a.length, blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  for (i = 0; i <= alen; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= blen; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[alen][blen];
}

/**
 * Calculates similarity between a search word and a catalog word.
 */
function wordSimilarity(wordA: string, wordB: string): number {
  if (wordA === wordB) return 1.0;
  // If one starts with the other and is long enough
  if (wordA.length > 3 && wordB.length > 3) {
    if (wordA.startsWith(wordB) || wordB.startsWith(wordA)) {
      return 0.85;
    }
  }
  
  const maxLength = Math.max(wordA.length, wordB.length);
  const distance = getLevenshteinDistance(wordA, wordB);
  const similarity = 1 - distance / maxLength;
  
  return similarity;
}

/**
 * Complex catalog similarity matching engine. Calculates percentage of risk representation.
 */
export function computeCatalogSimilarity(searchQuery: string, itemDescription: string): SearchResult {
  const normQuery = normalizeText(searchQuery);
  const normItem = normalizeText(itemDescription);
  
  const queryExpanded = expandAbbreviations(searchQuery);
  const itemExpanded = expandAbbreviations(itemDescription);
  
  const queryTokens = queryExpanded.split(/\s+/).filter(t => t.length > 1);
  const itemTokens = itemExpanded.split(/\s+/).filter(t => t.length > 1);
  
  if (queryTokens.length === 0) {
    return { item: null as any, similarity: 0, matchedTokens: [] };
  }

  let matchScoreSum = 0;
  const matchedTokens: string[] = [];

  // For each token in query, find its best match in the catalog item
  queryTokens.forEach(qToken => {
    let bestMatchForToken = 0;
    let matchingCatalogWord = '';
    
    itemTokens.forEach(iToken => {
      const sim = wordSimilarity(qToken, iToken);
      if (sim > bestMatchForToken) {
        bestMatchForToken = sim;
        matchingCatalogWord = iToken;
      }
    });

    if (bestMatchForToken > 0.6) { // threshold for soft match
      // Weighted towards matching fully: exact matches score 1, soft matches score sim
      matchScoreSum += bestMatchForToken;
      matchedTokens.push(qToken);
    }
  });

  // Calculate similarity based on combined criteria
  // 1. Percentage of query tokens matched
  const queryMatchRatio = matchScoreSum / queryTokens.length;
  
  // 2. Exact match bonus
  let bonus = 0;
  if (normItem.includes(normQuery) && normQuery.length > 4) {
    bonus = 0.2;
  }

  let finalSimilarity = Math.min(1.0, queryMatchRatio + bonus) * 100;
  
  // Custom case: if search query is fully present as words
  const allMatched = queryTokens.every(q => itemExpanded.includes(q));
  if (allMatched && finalSimilarity < 85) {
    finalSimilarity = 85 + (finalSimilarity * 0.15);
  }

  // Rounding similarity
  finalSimilarity = Math.round(finalSimilarity);

  return {
    item: null as any, // caller attaches original item
    similarity: isNaN(finalSimilarity) ? 0 : finalSimilarity,
    matchedTokens
  };
}

/**
 * Searches the list and returns items ranked by similarity.
 */
export function searchCatalogue(query: string, catalog: CatalogItem[]): SearchResult[] {
  if (!query || query.trim().length === 0) return [];
  
  return catalog
    .map(item => {
      const result = computeCatalogSimilarity(query, item.descripcion);
      return {
        ...result,
        item
      };
    })
    .filter(res => res.similarity > 5) // filter out completely unrelated products
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Smart recommendation engine (Paso 4 Assistant)
 * Analyzes search text and devises standard nomenclature + categories.
 */
export function getSmartRecommendations(originalSearch: string): AIRecommendation {
  const norm = normalizeText(originalSearch);
  
  let descEstandar = originalSearch.toUpperCase().trim();
  let familia = FAMILIAS[FAMILIAS.length - 1]; // "OTROS INSUMOS DE CONSUMO GENERAL"
  let partida = PARTIDAS_PRESUPUESTALES[PARTIDAS_PRESUPUESTALES.length - 1]; // standard last
  let unidad = UNIDADES_MEDIDA[0]; // "Pieza (PZA)"
  let confianza = 50;

  // Let's implement active NLP matching logic
  const isMedicamento = /(PARACETAMOL|IBUPROFENO|AMOXICILINA|LOSARTAN|ASPIRINA|ACIDO|INSULINA|TABLETA|CORT|INYECTABLE|MG|UI)/i.test(norm);
  const isMaterialCuracion = /(GUANTE|JERINGA|GASA|CUBREBOCAS|ALCOHOL|Venda|ESTÈRIL|ALGODON|EXAMEN|YODO|CINTA|TAPABOCA|MICROPORE)/i.test(norm);
  const isLaboratorio = /(REACTIVO|FIJADOR|KODAK|AGUA DENT|PROBETA|MATRAZ|MICROSCOPIO_SLIDE|SUERO|SANGRE|TUBO INS|PIPETA)/i.test(norm);
  const isRadiologia = /(PLACA|PELICULA|RADIOGRAF|RX|RAYOS|ULTRASONIDO|GEL ELECT)/i.test(norm);
  const isServicio = /(MANTENIMIENTO|REPARACION|CALIBRACION|COMPRESOR|BIOMÈDICO)/i.test(norm);

  if (isMedicamento) {
    familia = 'MEDICAMENTOS ANASTÉSICOS';
    partida = PARTIDAS_PRESUPUESTALES.find(p => p.clave === '25301') || PARTIDAS_PRESUPUESTALES[0];
    unidad = 'Caja (CJA)';
    confianza = 85;

    // Standardize denomination: "DRUG [PRESENTATION] [STRENGTH], [ADMINISTRATION], [PACKAGING]"
    const matchDrug = norm.match(/(PARACETAMOL|IBUPROFENO|AMOXICILINA|LOSARTAN|INSULINA|ACIDO ACETILSALICILICO)/i);
    const drugName = matchDrug ? matchDrug[0] : 'MEDICAMENTO_DESCONOCIDO';
    
    const matchMg = norm.match(/(\d+)\s*(MG|MILIGRAMOS)/i);
    const mg = matchMg ? `${matchMg[1]} MG` : '500 MG';

    const matchSusp = norm.includes('SUSP') || norm.includes('JARABE') ? 'SUSPENSIÓN' : 'TABLETA';
    
    descEstandar = `${drugName} ${matchSusp} ${mg}, VÍA ORAL, ADULTO`;

  } else if (isMaterialCuracion) {
    familia = 'MATERIAL DE CURACIÓN';
    partida = PARTIDAS_PRESUPUESTALES.find(p => p.clave === '25401') || PARTIDAS_PRESUPUESTALES[0];
    unidad = norm.includes('CAJA') ? 'Caja (CJA)' : norm.includes('PAR') ? 'Par (PAR)' : 'Pieza (PZA)';
    confianza = 90;

    if (/(GUANTE|GUANTES)/i.test(norm)) {
      const gSize = norm.includes('MED') || norm.includes('MEDIANA') || norm.includes(' T/M') || norm.includes(' M ') ? 'MEDIANA' :
                    norm.includes('CH') || norm.includes('CHICA') || norm.includes(' T/CH') ? 'CHICA' :
                    norm.includes('GD') || norm.includes('GRANDE') || norm.includes(' T/G') ? 'GRANDE' : 'MEDIANA';
      descEstandar = `GUANTES DE EXPLORACIÓN DE LÁTEX, DESECHABLES, TALLA ${gSize}, PRESENTACIÓN EN CAJA CON 100 PIEZAS`;
    } else if (/(JERINGA|JERINGAS)/i.test(norm)) {
      const matchMl = norm.match(/(\d+)\s*(ML|MILILITROS)/i);
      const ml = matchMl ? `${matchMl[1]} ML` : '5 ML';
      descEstandar = `JERINGA DE PLÁSTICO DESECHABLE CON AGUJA ESTÉRIL, CAPACIDAD ${ml}, PIEZA INDIVIDUAL`;
    } else {
      descEstandar = `${norm} - MATERIAL DE CURACIÓN DE ALTA CALIDAD HCG ESTÁNDAR`;
    }

  } else if (isLaboratorio) {
    familia = 'MATERIAL DE LABORATORIO';
    partida = PARTIDAS_PRESUPUESTALES.find(p => p.clave === '25501') || PARTIDAS_PRESUPUESTALES[0];
    unidad = 'Pieza (PZA)';
    confianza = 80;
    descEstandar = `${norm} PARA DIAGNÓSTICO EN LABORATORIO CLÍNICO INSTITUCIONAL`;

  } else if (isRadiologia) {
    familia = 'MATERIAL RADIOLÓGICO Y ULTRASONIDO';
    partida = PARTIDAS_PRESUPUESTALES.find(p => p.clave === '25501') || PARTIDAS_PRESUPUESTALES[0];
    unidad = 'Caja (CJA)';
    confianza = 88;
    descEstandar = `PELÍCULA RADIOGRÁFICA ESPECIALIZADA PARA PROTOCOLOS DE IMAGENOLOGÍA HCG`;

  } else if (isServicio) {
    familia = 'SERVICIOS DE MANTENIMIENTO DE EQUIPO';
    partida = PARTIDAS_PRESUPUESTALES.find(p => p.clave === '35401') || PARTIDAS_PRESUPUESTALES[0];
    unidad = 'Pieza (PZA)';
    confianza = 75;
    descEstandar = `SERVICIO DE INSTALACIÓN, MANTENIMIENTO O CALIBRACIÓN PREVENTIVA DE EQUIPOMÉDICO`;
  }

  // Ensure standard formatting
  descEstandar = descEstandar.toUpperCase().replace(/\s+/g, ' ');

  return {
    descripcionEstandarizada: descEstandar,
    familiaRecomendada: familia,
    partidaRecomendada: `${partida.clave} - ${partida.nombre}`,
    unidadRecomendada: unidad,
    confianza
  };
}
