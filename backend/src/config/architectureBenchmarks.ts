/**
 * Benchmarks específicos para Arquitectura y Contratista
 * Estos benchmarks se usan cuando se detecta modo architect o contractor
 */

export interface ArchitectureBenchmarks {
  architect: Record<string, { average: number; residencial?: number; industrial?: number; comercial?: number; rehabilitacion?: number; reforma?: number }>;
  contractor: Record<string, { average: number; residencial?: number; industrial?: number; comercial?: number; rehabilitacion?: number; reforma?: number }>;
}

export const architectureBenchmarks: ArchitectureBenchmarks = {
  architect: {
    'levantamiento topográfico': { average: 8000, residencial: 8000, industrial: 10000, comercial: 9000, rehabilitacion: 7000, reforma: 6000 },
    'anteproyecto': { average: 15000, residencial: 15000, industrial: 18000, comercial: 16500, rehabilitacion: 13500, reforma: 12000 },
    'proyecto ejecutivo': { average: 25000, residencial: 25000, industrial: 30000, comercial: 27500, rehabilitacion: 22500, reforma: 20000 },
    'coordinación de especialidades': { average: 12000, residencial: 12000, industrial: 14500, comercial: 13200, rehabilitacion: 10800, reforma: 9600 },
    'supervisión de obra': { average: 18000, residencial: 18000, industrial: 22000, comercial: 19800, rehabilitacion: 16200, reforma: 14400 },
    'documentación final': { average: 10000, residencial: 10000, industrial: 12000, comercial: 11000, rehabilitacion: 9000, reforma: 8000 },
    'gestión de tramitología': { average: 8000, residencial: 8000, industrial: 9500, comercial: 8800, rehabilitacion: 7200, reforma: 6400 },
    'estudio de impacto ambiental': { average: 12000, residencial: 12000, industrial: 15000, comercial: 13500, rehabilitacion: 10800, reforma: 9600 }
  },
  contractor: {
    'suministro de materiales': { average: 35000, residencial: 35000, industrial: 42000, comercial: 38500, rehabilitacion: 31500, reforma: 28000 },
    'mano de obra especializada': { average: 28000, residencial: 28000, industrial: 33600, comercial: 30800, rehabilitacion: 25200, reforma: 22400 },
    'ejecución de obra civil': { average: 48000, residencial: 48000, industrial: 57600, comercial: 52800, rehabilitacion: 43200, reforma: 38400 },
    'instalaciones especializadas': { average: 42000, residencial: 42000, industrial: 50400, comercial: 46200, rehabilitacion: 37800, reforma: 33600 },
    'acabados finos': { average: 31000, residencial: 31000, industrial: 37200, comercial: 34100, rehabilitacion: 27900, reforma: 24800 },
    'puesta en marcha': { average: 15000, residencial: 15000, industrial: 18000, comercial: 16500, rehabilitacion: 13500, reforma: 12000 },
    'control de calidad': { average: 12000, residencial: 12000, industrial: 14500, comercial: 13200, rehabilitacion: 10800, reforma: 9600 },
    'seguridad en obra': { average: 10000, residencial: 10000, industrial: 12000, comercial: 11000, rehabilitacion: 9000, reforma: 8000 }
  }
};

