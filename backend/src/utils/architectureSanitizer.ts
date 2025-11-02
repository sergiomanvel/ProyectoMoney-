/**
 * 🏗️ Sanitizador de items para modos arquitectónicos
 * Elimina vocabulario de contratista cuando estamos en modo arquitecto
 */

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Limpia items para eliminar vocabulario de contratista en modo arquitecto
 */
export function sanitizeArchitectureItems(
  items: QuoteItem[],
  subtype?: "anteproyecto" | "full"
): QuoteItem[] {
  return items.map(item => {
    let d = item.description;

    // Remover palabras de contratista
    d = d.replace(/suministro de materiales( y .*?)?/gi, "Elaboración del anteproyecto arquitectónico");
    d = d.replace(/suministro de insumos( y .*?)?/gi, "Documentación técnica preliminar del anteproyecto");
    d = d.replace(/mano de obra calificada( para)?/gi, "Desarrollo técnico del anteproyecto");
    d = d.replace(/limpieza y entrega final de la obra/gi, "Entrega de documentación del anteproyecto");
    d = d.replace(/ejecución de la obra/gi, "supervisión de la propuesta arquitectónica");
    d = d.replace(/mano de obra/gi, "desarrollo técnico");
    d = d.replace(/suministro/gi, "elaboración");

    // Si es SOLO anteproyecto, remover ideas de ejecución/instalación
    if (subtype === "anteproyecto") {
      d = d.replace(/instalación(es)?/gi, "criterios de instalación (preliminar)");
      d = d.replace(/instalacion(es)?/gi, "criterios de instalación (preliminar)");
      d = d.replace(/construcción/gi, "desarrollo del diseño");
      d = d.replace(/construccion/gi, "desarrollo del diseño");
      d = d.replace(/obra física/gi, "desarrollo preliminar");
      d = d.replace(/ejecución física/gi, "desarrollo preliminar");
      d = d.replace(/supervisión de obra/gi, "revisión de la propuesta arquitectónica");
      d = d.replace(/dirección de obra/gi, "supervisión de la propuesta");
    }

    return { ...item, description: d.trim() };
  });
}

