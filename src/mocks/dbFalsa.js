// Funciones falsas del CONTRATO 4 para desarrollar Perfil.
// Cuando db.js las tenga, cambia el import en cada componente a '../../services/db'.
import { carrerasMock } from './usuario'

const reportesMock = [
  {
    id: 'reporte-1',
    categoria: 'Fuente sin agua',
    descripcion: 'La fuente de la entrada del parque no sale agua.',
    confirmaciones: 12,
    fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'reporte-2',
    categoria: 'Tramo sin sombra',
    descripcion: 'Cortaron los árboles cerca del km 2.',
    confirmaciones: 1,
    fecha: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export async function getEstadisticas() {
  return { km_total: 18.3, rutas_compartidas: 2, racha_semanas: 3 }
}

export async function getCarreras() {
  return carrerasMock
}

export async function getMisReportes() {
  return reportesMock
}
