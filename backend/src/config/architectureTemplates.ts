/**
 * Plantillas específicas para arquitectura vs contratista
 * Distingue entre el servicio de un arquitecto (diseño, supervisión, documentación)
 * vs el de un contratista (suministro, materiales, mano de obra)
 */

export const ARCHITECTURE_TEMPLATES = {
  /**
   * Templates para arquitectos: proyecto, documentación, supervisión
   */
  architect: [
    "Levantamiento de información, análisis del sitio y requisitos del cliente",
    "Elaboración de anteproyecto arquitectónico (plantas, alzados, distribución)",
    "Desarrollo de proyecto ejecutivo: detalles constructivos, instalaciones, acabados",
    "Coordinación con especialidades (estructuras, instalaciones, HVAC) si aplica",
    "Supervisión técnica y control de obra conforme a planos aprobados",
    "Entrega de documentación final, planos actualizados (as-built) y memoria"
  ],

  /**
   * Templates para contratistas: suministro, ejecución, entrega física
   */
  contractor: [
    "Suministro de materiales e insumos según proyecto",
    "Mano de obra calificada para ejecución de obra civil e instalaciones",
    "Revisión técnica y control de calidad durante la obra",
    "Limpieza y entrega final de la obra"
  ]
};

/**
 * Pesos de distribución para arquitectura (más énfasis en proyecto/diseño)
 */
export const ARCHITECTURE_PRICE_WEIGHTS = {
  proyecto: 0.60,      // 60% para diseño y documentación
  supervision: 0.25,   // 25% para supervisión de obra (si aplica)
  entrega: 0.15        // 15% para documentación final
};

/**
 * Pesos de distribución para contratista (más énfasis en ejecución)
 */
export const CONTRACTOR_PRICE_WEIGHTS = {
  suministro: 0.40,
  manoObra: 0.35,
  revision: 0.15,
  entrega: 0.10
};

