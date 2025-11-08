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
    "Levantamiento topográfico, normativo y programa arquitectónico",
    "Conceptualización y anteproyecto con plantas, alzados y renders",
    "Proyecto arquitectónico ejecutivo con detalles constructivos y acabados",
    "Coordinación de ingenierías estructurales, instalaciones y sostenibilidad",
    "Gestión de tramitología, licencias y documentación para permisos",
    "Supervisión arquitectónica y control de calidad durante la obra",
    "Revisión de pruebas, listas de punch list y entrega de obra conforme",
    "Elaboración de planos as-built, memoria descriptiva y manuales de uso"
  ],

  /**
   * Templates para contratistas: suministro, ejecución, entrega física
   */
  contractor: [
    "Planeación de obra, logística y habilitación de frente de trabajo",
    "Suministro de materiales certificados y gestión de proveedores",
    "Ejecución de obra civil, albañilerías y estructura",
    "Instalaciones eléctricas, hidráulicas y sistemas especiales",
    "Supervisión de seguridad industrial y control de calidad",
    "Acabados finos, herrería, carpintería y detalles de cierre",
    "Puesta en marcha de sistemas y pruebas funcionales",
    "Limpieza profunda, entrega final y documentación de garantía"
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

