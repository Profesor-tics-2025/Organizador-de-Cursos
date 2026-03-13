import { GoogleGenAI, Type } from "@google/genai";
import { Offer, Course, TeacherSettings, Session } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeOffer(
  offer: Offer,
  existingCourses: Course[],
  existingSessions: Session[],
  settings: TeacherSettings
) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Analiza la siguiente oferta de curso para un docente freelance y genera una recomendación profesional.
    
    OFERTA:
    - Entidad: ${offer.entity}
    - Curso: ${offer.courseName}
    - Fechas: ${offer.startDate} a ${offer.endDate}
    - Horario: ${offer.schedule}
    - Duración: ${offer.duration} horas
    - Remuneración: ${offer.remuneration}€
    
    CONFIGURACIÓN DEL DOCENTE:
    - Horas máximas/semana: ${settings.maxHoursPerWeek}
    - Tarifa mínima/hora: ${settings.minHourlyRate}€
    - Preferencia: ${settings.preferredModality}
    
    CURSOS ACTUALES:
    ${existingCourses.map(c => `- ${c.name} (${c.startDate} a ${c.endDate})`).join('\n')}
    
    SESIONES PROGRAMADAS:
    ${existingSessions.map(s => `- ${s.date} de ${s.startTime} a ${s.endTime}`).join('\n')}
    
    Evalúa:
    1. Disponibilidad (conflictos de horario).
    2. Carga de trabajo (si supera las horas semanales).
    3. Rentabilidad (si cumple la tarifa mínima).
    4. Ajuste a preferencias.
    
    Responde en formato JSON con los campos:
    - recommendation: "recomendable aceptar" | "aceptable con ajustes" | "no recomendable"
    - explanation: Una breve explicación en español (máximo 3 frases).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["recommendation", "explanation"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing offer:", error);
    return {
      recommendation: "aceptable con ajustes",
      explanation: "No se pudo realizar el análisis automático. Por favor, revisa manualmente."
    };
  }
}

export async function analyzeScheduleConflicts(
  courses: Course[],
  sessions: Session[],
  offers: Offer[]
) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Como asistente experto en gestión de horarios para docentes, analiza el siguiente calendario de sesiones, cursos pendientes y ofertas recibidas para detectar conflictos críticos, solapamientos o riesgos de fatiga.
    
    CURSOS ACTUALES Y CONFIRMADOS:
    ${courses.filter(c => c.status === 'confirmado').map(c => `- ${c.name} (${c.entity})`).join('\n')}
    
    CURSOS PENDIENTES DE CONFIRMACIÓN:
    ${courses.filter(c => c.status === 'pendiente').map(c => `- ${c.name} (${c.entity}) - Horario previsto: ${c.schedule}`).join('\n')}

    OFERTAS RECIBIDAS:
    ${offers.filter(o => o.status === 'oferta recibida').map(o => `- ${o.courseName} (${o.entity}) - Horario: ${o.schedule}`).join('\n')}
    
    SESIONES PROGRAMADAS (DETALLE):
    ${sessions.map(s => `- ${s.date}: ${s.startTime} a ${s.endTime} (Curso: ${courses.find(c => c.id === s.courseId)?.name})`).join('\n')}
    
    Identifica:
    1. Solapamientos exactos (mismo día y hora). Indica qué cursos/sesiones/ofertas están en conflicto.
    2. Conflictos potenciales entre cursos confirmados y los que están en estado "pendiente" u "oferta".
    3. Sesiones con menos de 30 min de margen entre ellas si son en centros distintos.
    4. Días con más de 8 horas de docencia acumulada (sumando confirmados y pendientes).
    
    Para cada conflicto detectado, propón una solución específica (ej: "Mover sesión de las 10:00 a las 16:00", "Rechazar oferta X por incompatibilidad total", "Pedir cambio de horario en curso Y").

    Responde en formato JSON con los campos:
    - conflicts: Array de objetos { type: "error" | "warning", message: string, date: string, solution: string }
    - summary: Un resumen general del estado del calendario, mencionando específicamente si los cursos pendientes encajan bien (máximo 2 frases).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conflicts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  message: { type: Type.STRING },
                  date: { type: Type.STRING },
                  solution: { type: Type.STRING }
                },
                required: ["type", "message", "date", "solution"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["conflicts", "summary"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      conflicts: data.conflicts || [],
      summary: data.summary || "Análisis completado."
    };
  } catch (error) {
    console.error("Error analyzing schedule:", error);
    return {
      conflicts: [],
      summary: "No se pudo realizar el análisis inteligente en este momento. Por favor, inténtalo de nuevo."
    };
  }
}
