// Funciones de datos (CONTRATO 4) con Supabase.
// Todas son async: devuelven datos o lanzan Error con mensaje en español.
import { cliente } from './supabase'
import rutasOficiales from '../../data/rutas.json'

// ---------- Ayudantes ----------

// Usuario con sesión o error claro
async function usuarioActual() {
  const { data } = await cliente().auth.getUser()
  if (!data?.user) throw new Error('Tu sesión terminó. Vuelve a iniciar sesión.')
  return data.user
}

// Convierte un error de Supabase en uno en español
function fallo(error, mensaje) {
  if (error) {
    console.error(error)
    throw new Error(mensaje)
  }
}

// Solo se muestran las rutas oficiales que ya tienen su trazo en el mapa
const rutasConTrazo = rutasOficiales.filter((r) => r.geojson?.features?.length > 0)

// Rutas que publicaron los usuarios (si falla, la app sigue con las oficiales)
async function rutasDeUsuarios() {
  try {
    const { data, error } = await cliente()
      .from('routes')
      .select('*')
      .eq('publica', true)
      .order('creado_en', { ascending: false })
    if (error) throw error
    return (data ?? []).filter((r) => r.geojson?.features?.length > 0)
  } catch {
    return []
  }
}

// Primer punto de un geojson como { lat, lng }
function primerPunto(geojson) {
  const linea = geojson?.features?.find((f) => f.geometry?.type === 'LineString')
  const c = linea?.geometry?.coordinates?.[0]
  return c ? { lat: c[1], lng: c[0] } : { lat: null, lng: null }
}

// ---------- Rutas ----------

export async function getRutas() {
  const deUsuarios = await rutasDeUsuarios()
  return [...rutasConTrazo, ...deUsuarios]
}

export async function getRuta(id) {
  const rutas = await getRutas()
  const ruta = rutas.find((r) => String(r.id) === String(id))
  if (!ruta) throw new Error('No encontramos esa ruta.')
  return ruta
}

// Todas las rutas oficiales, aunque todavía no tengan trazo (para Comunidad)
export async function getNombresRutas() {
  const deUsuarios = await rutasDeUsuarios()
  return [...rutasOficiales, ...deUsuarios].map((r) => ({ id: r.id, nombre: r.nombre }))
}

export async function publicarRuta(datos) {
  await usuarioActual()
  const inicio = primerPunto(datos.geojson)
  const { data, error } = await cliente()
    .from('routes')
    .insert({
      nombre: datos.nombre,
      descripcion: datos.notas || 'Ruta compartida por la comunidad.',
      distancia_km: datos.distancia_km ?? 0,
      sombra_pct: datos.sombra_pct ?? 0,
      sombra_nivel: datos.sombra_nivel ?? 'mixta',
      fuentes_funcionales: datos.fuentes_funcionales ?? true,
      notas: datos.notas || null,
      geojson: datos.geojson,
      lat_inicio: inicio.lat,
      lng_inicio: inicio.lng,
      publica: true,
    })
    .select()
    .single()
  fallo(error, 'No se pudo publicar la ruta. Intenta de nuevo.')
  return data
}

// ---------- Carreras ----------

export async function guardarCarrera(datos) {
  await usuarioActual()
  const { data, error } = await cliente()
    .from('runs')
    .insert({
      route_id: datos.route_id ?? null,
      ruta_nombre: datos.ruta_nombre ?? 'Carrera libre',
      inicio: datos.inicio,
      fin: datos.fin,
      duracion_seg: datos.duracion_seg ?? 0,
      distancia_km: datos.distancia_km ?? 0,
      ritmo_min_km: datos.ritmo_min_km ?? null,
      trayecto: datos.trayecto ?? null,
      sensacion_termica: datos.sensacion_termica ?? null,
    })
    .select()
    .single()
  fallo(error, 'No se pudo guardar tu carrera.')
  return data
}

// Devuelve la forma que usa "Mi historial"
export async function getCarreras(userId) {
  const id = userId ?? (await usuarioActual()).id
  const { data, error } = await cliente()
    .from('runs')
    .select('id, ruta_nombre, inicio, creado_en, distancia_km, duracion_seg, ritmo_min_km')
    .eq('user_id', id)
    .order('inicio', { ascending: false })
  fallo(error, 'No pudimos cargar tu historial.')
  return (data ?? []).map((c) => ({
    id: c.id,
    ruta_nombre: c.ruta_nombre || 'Carrera libre',
    fecha: c.inicio || c.creado_en,
    distancia_km: Number(c.distancia_km),
    tiempo_seg: c.duracion_seg,
    ritmo_prom_seg: c.ritmo_min_km ? Math.round(Number(c.ritmo_min_km) * 60) : null,
  }))
}

// ---------- Carreras programadas ----------

// datos: { fecha: 'AAAA-MM-DD', hora: 'HH:MM', distancia_km, notas, avisar }
export async function crearItinerario(datos) {
  await usuarioActual()
  const { data, error } = await cliente()
    .from('schedules')
    .insert({
      fecha: datos.fecha,
      hora: datos.hora,
      distancia_km: datos.distancia_km,
      notas: datos.notas || null,
      avisar: Boolean(datos.avisar),
    })
    .select()
    .single()
  fallo(error, 'No pudimos guardar tu carrera programada.')
  return data
}

export async function getItinerarios(userId) {
  const id = userId ?? (await usuarioActual()).id
  const { data, error } = await cliente()
    .from('schedules')
    .select('*')
    .eq('user_id', id)
    .order('fecha')
    .order('hora')
  fallo(error, 'No pudimos cargar tus carreras programadas.')
  return data ?? []
}

export async function borrarItinerario(id) {
  const { error } = await cliente().from('schedules').delete().eq('id', id)
  fallo(error, 'No pudimos borrar la carrera.')
}

// ---------- Comentarios de la comunidad (tabla reports) ----------

// Forma común de un comentario
function aComentario(r, miId) {
  return {
    id: r.id,
    route_id: r.route_id,
    ruta_nombre: r.ruta_nombre,
    texto: r.texto,
    autor: r.autor_nombre,
    deApp: false,
    esMio: r.user_id === miId,
    confirmaciones: r.confirmaciones,
    fecha: r.creado_en,
  }
}

// categoria opcional (por ahora todos son 'comentario')
export async function getReportes(categoria) {
  const yo = await usuarioActual()
  let consulta = cliente().from('reports').select('*').order('creado_en', { ascending: false }).limit(200)
  if (categoria) consulta = consulta.eq('categoria', categoria)
  const { data, error } = await consulta
  fallo(error, 'No pudimos cargar los comentarios.')
  return (data ?? []).map((r) => aComentario(r, yo.id))
}

// Forma que usa la pestaña "Mis comentarios" del Perfil
export async function getMisReportes(userId) {
  const id = userId ?? (await usuarioActual()).id
  const { data, error } = await cliente()
    .from('reports')
    .select('*')
    .eq('user_id', id)
    .order('creado_en', { ascending: false })
  fallo(error, 'No pudimos cargar tus comentarios.')
  return (data ?? []).map((r) => ({
    id: r.id,
    categoria: r.ruta_nombre,
    descripcion: r.texto,
    confirmaciones: r.confirmaciones,
    fecha: r.creado_en,
  }))
}

// datos: { route_id, ruta_nombre, texto }. archivoFoto: no se usa en esta versión
// eslint-disable-next-line no-unused-vars
export async function crearReporte(datos, archivoFoto) {
  const yo = await usuarioActual()
  const nombre = yo.user_metadata?.nombre || yo.email?.split('@')[0] || 'Corredor'
  const { data, error } = await cliente()
    .from('reports')
    .insert({
      autor_nombre: nombre,
      route_id: datos.route_id ?? null,
      ruta_nombre: datos.ruta_nombre,
      texto: datos.texto,
    })
    .select()
    .single()
  fallo(error, 'No se pudo publicar tu comentario. Intenta de nuevo.')
  return aComentario(data, yo.id)
}

export async function confirmarReporte(reporteId) {
  const { data, error } = await cliente().rpc('confirmar_reporte', { rid: reporteId })
  fallo(error, 'No se pudo guardar tu confirmación.')
  return data
}

export async function borrarReporte(reporteId) {
  const { error } = await cliente().from('reports').delete().eq('id', reporteId)
  fallo(error, 'No se pudo borrar tu comentario.')
}

// ---------- Estadísticas del Perfil ----------

// Lunes de la semana de una fecha, como texto 'AAAA-MM-DD'
function inicioSemana(fecha) {
  const f = new Date(fecha)
  const dia = (f.getDay() + 6) % 7 // lunes = 0
  f.setHours(0, 0, 0, 0)
  f.setDate(f.getDate() - dia)
  return `${f.getFullYear()}-${f.getMonth() + 1}-${f.getDate()}`
}

export async function getEstadisticas(userId) {
  const id = userId ?? (await usuarioActual()).id
  const [carreras, rutas] = await Promise.all([
    cliente().from('runs').select('distancia_km, inicio, creado_en').eq('user_id', id),
    cliente().from('routes').select('id', { count: 'exact', head: true }).eq('creada_por', id),
  ])
  fallo(carreras.error || rutas.error, 'No pudimos cargar tus números.')

  const lista = carreras.data ?? []
  const km_total = lista.reduce((s, c) => s + Number(c.distancia_km || 0), 0)

  // Racha: semanas seguidas (hasta esta o la pasada) con al menos una carrera
  const semanas = new Set(lista.map((c) => inicioSemana(c.inicio || c.creado_en)))
  let racha = 0
  const cursor = new Date()
  if (!semanas.has(inicioSemana(cursor))) cursor.setDate(cursor.getDate() - 7)
  while (semanas.has(inicioSemana(cursor))) {
    racha++
    cursor.setDate(cursor.getDate() - 7)
  }

  return {
    km_total: Math.round(km_total * 10) / 10,
    rutas_compartidas: rutas.count ?? 0,
    racha_semanas: racha,
  }
}
