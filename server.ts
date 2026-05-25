import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables for local testing
dotenv.config();

// Lazily initialize Gemini AI client if GEMINI_API_KEY is available
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI:", err);
    }
  }
  return aiClient;
}

// Medical abbreviations for normalizer
const CLINICAL_ABBREVIATIONS: { [key: string]: string } = {
  MG: "MILIGRAMOS",
  ML: "MILILITROS",
  TAB: "TABLETA",
  CAP: "CAPSULA",
  AMP: "AMPOLLA",
  FCO: "FRASCO",
  CJA: "CAJA",
  PZA: "PIEZA",
  "C/": "CON",
  "S/": "SIN",
};

/**
 * Normalizes clinical description for high-performance indexing/matching
 */
function normalizeText(text: string): string {
  if (!text) return "";
  let txt = text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/C\//g, " CON ")
    .replace(/S\//g, " SIN ");

  // Standardize spaces around numbers (e.g., "500mg" -> "500 mg")
  txt = txt
    .replace(/([0-9]+)([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([0-9])/g, "$1 $2");

  // Expand clinical abbreviations
  const words = txt.split(/[^A-Z0-9%/]+/);
  const expanded = words.map((w) => CLINICAL_ABBREVIATIONS[w] || w);
  
  return expanded
    .filter(Boolean)
    .join(" ")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates trigrams aligned for medical word matches to match high-precision lookup
 */
function generateTrigrams(text: string): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/).filter((w) => w.length >= 3);
  const trigrams = new Set<string>();
  
  for (const w of words) {
    for (let i = 0; i <= w.length - 3; i++) {
      trigrams.add(w.substring(i, i + 3));
    }
  }
  return Array.from(trigrams);
}

/**
 * Calculates Trigram Jaccard similarity coefficient
 */
function JaccardTrigramSimilarity(query: string, target: string): number {
  const queryTrigrams = generateTrigrams(query);
  const targetTrigrams = generateTrigrams(target);
  
  if (queryTrigrams.length === 0 || targetTrigrams.length === 0) return 0;
  
  const querySet = new Set(queryTrigrams);
  const intersection = targetTrigrams.filter((t) => querySet.has(t));
  const unionSize = new Set([...queryTrigrams, ...targetTrigrams]).size;
  
  return unionSize > 0 ? (intersection.length / unionSize) * 100 : 0;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "2mb" }));

  // API Route: AI-powered Standardization (Sugerir campos con IA)
  app.post("/api/sugerir-ia", async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Parámetro 'query' es requerido." });
    }

    const ai = getAi();
    if (!ai) {
      console.log("No GEMINI_API_KEY found, returning warning");
      return res.status(200).json({ 
        success: false, 
        message: "Asistente inteligente limitado sin API key de Gemini. Se continuará con propuesta sintética.",
        fallback: true
      });
    }

    try {
      console.log(`Analyzing query "${query}" with gemini-3.5-flash...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Clasifica este insumo clínico o servicio: "${query}"`,
        config: {
          systemInstruction: `Eres el sistema unificado de catalogación oficial del Hospital Civil de Guadalajara (HCG). Tu función es clasificar el insumo ingresado por el usuario utilizando su descripción.

REGLAS DE PROCESAMIENTO Y GENERACIÓN:
1. descripcionEstandarizada: Re-escribe y normaliza la descripción del insumo en MAYÚSCULAS. La redacción debe ser técnica, genérica y alineada estrictamente con normas internacionales (anteponiendo el nombre base, características esenciales, dimensiones, concentraciones, empaque, omitiendo marcas comerciales o términos informales).
2. partidaRecomendada: Determina la partida presupuestal exacta a la que pertenece el insumo. Debe coincidir con uno de los siguientes:
   - "25101 - Sustancias químicas químicas básicas"
   - "25301 - Medicinas y productos farmacéuticos"
   - "25401 - Materiales, accesorios y suministros médicos"
   - "25501 - Materiales, accesorios y suministros de laboratorio"
   - "25901 - Otros productos químicos y de laboratorio"
   - "29501 - Refacciones y accesorios menores de equipo e instrumental médico y de laboratorio"
   - "35401 - Instalación, reparación y mantenimiento de equipo e instrumental médico y de laboratorio"
3. unidadRecomendada: Mapea a una de estas opciones: "Pieza (PZA)", "Caja (CJA)", "Frasco (FCO)", "Paquete (PQT)", "Litro (L)", "Amolleta/Ampolleta (AMP)", "Par (PAR)", "Tubo (TUB)", "Rollo (ROL)", "Miligramo (MG)".
4. familiaRecomendada: Macro-categoría correspondiente a la partida. Por ejemplo: "MEDICAMENTOS ANASTÉSICOS", "MATERIAL DE CURACIÓN", "MATERIAL DE LABORATORIO", "MATERIAL RADIOLÓGICO Y ULTRASONIDO", "INSTRUMENTAL MÉDICO Quirúrgico", "EQUIPO MÉDICO Y BIOMÉDICO", "MATERIAL DE ODONTOLOGÍA", "SERVICIOS DE MANTENIMIENTO DE EQUIPO", "SUSTANCIAS QUÍMICAS Y REACTIVOS", "SOPORTE Y ACCESORIOS DE ORTOPEDIA y PRÓTESIS", "PRODUCTOS ALIMENTICIOS PARA PACIENTES", "OTROS INSUMOS DE CONSUMO GENERAL".
5. confianza: Grado de certeza porcentual (de 0 a 100) en base a la precisión del mapeo.

Responde únicamente el objeto JSON adecuado. No incluyas explicaciones adicionales ni bloques de código que no sean JSON.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              descripcionEstandarizada: { type: Type.STRING },
              partidaRecomendada: { type: Type.STRING },
              unidadRecomendada: { type: Type.STRING },
              familiaRecomendada: { type: Type.STRING },
              confianza: { type: Type.INTEGER }
            },
            required: ["descripcionEstandarizada", "partidaRecomendada", "unidadRecomendada", "familiaRecomendada", "confianza"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response string received from Gemini.");
      }

      const parsed = JSON.parse(responseText.trim());
      return res.json({ success: true, recommendation: parsed });
    } catch (err: any) {
      console.error("Gemini classification failed:", err);
      return res.status(500).json({ error: "Fallo de comunicación con Gemini: " + err.message });
    }
  });

  // API Route: Server-side Advanced Search Similitud Calculator (Trigrams + Custom Jaccard Matching)
  app.post("/api/buscar-similitudes", async (req, res) => {
    const { query, catalog } = req.body;
    if (!query || !Array.isArray(catalog)) {
      return res.status(400).json({ error: "Parámteros 'query' y 'catalog' (Array) requeridos." });
    }

    try {
      const results = catalog.map((item: any) => {
        const score = JaccardTrigramSimilarity(query, item.descripcion);
        return {
          item,
          similarity: Math.round(score),
          matchedTokens: generateTrigrams(query).filter(t => generateTrigrams(item.descripcion).includes(t))
        };
      })
      .filter((r) => r.similarity > 5)
      .sort((a, b) => b.similarity - a.similarity);

      return res.json({ success: true, results });
    } catch (err: any) {
      console.error("Search similarity computation failed:", err);
      return res.status(500).json({ error: "Fallo matemático de indexación: " + err.message });
    }
  });

  // Serve Frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
