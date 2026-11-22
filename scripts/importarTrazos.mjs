// Convierte los dibujos de geojson.io en rutas de la app.
// Uso: guarda cada dibujo como data/trazos/<id-de-la-ruta>.geojson y corre:  npm run rutas
//
// En cada dibujo:
//  - Líneas: el circuito. Puede ser una sola línea o varias (una por tramo).
//    A un tramo sin sombra ponle la propiedad  sombra = baja  (si no tiene, cuenta como sombra).
//  - Marcadores (opcional): propiedad  tipo = agua | bano | medico  y  nombre = ...
import fs from 'node:fs'
import path from 'node:path'

const CARPETA = 'data/trazos'
const ARCHIVO_RUTAS = 'data/rutas.json'

// Distancia en km entre dos puntos [lng, lat]
function km(a, b) {
  const R = 6371
  const rad = (g) => (g * Math.PI) / 180
  const dLat = rad(b[1] - a[1])
  const dLng = rad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const largo = (coords) => coords.slice(1).reduce((s, c, i) => s + km(coords[i], c), 0)
const redondear = ([lng, lat]) => [Number(lng.toFixed(6)), Number(lat.toFixed(6))]

function leerTipo(texto = '') {
  const t = String(texto).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (t.startsWith('agua') || t.startsWith('fuente') || t.startsWith('bebedero')) return 'agua'
  if (t.startsWith('ban') || t.startsWith('sanitario')) return 'bano'
  if (t.startsWith('med') || t.startsWith('primeros')) return 'medico'
  return null
}

function leerSombra(valor) {
  const t = String(valor ?? '').toLowerCase()
  return ['baja', 'sol', 'no', 'sin sombra'].includes(t) ? 'baja' : 'alta'
}

if (!fs.existsSync(CARPETA)) {
  console.log(`No existe la carpeta ${CARPETA}. Créala y guarda ahí tus dibujos.`)
  process.exit(1)
}

const rutas = JSON.parse(fs.readFileSync(ARCHIVO_RUTAS, 'utf8'))
const archivos = fs.readdirSync(CARPETA).filter((a) => /\.(geo)?json$/i.test(a))
if (archivos.length === 0) {
  console.log(`No hay dibujos en ${CARPETA}. Guarda ahí los archivos .geojson de geojson.io.`)
  process.exit(1)
}

const resumen = []
let hayErrores = false

for (const archivo of archivos) {
  const id = path.basename(archivo).replace(/\.(geo)?json$/i, '')
  const ruta = rutas.find((r) => r.id === id)
  if (!ruta) {
    console.log(`✗ ${archivo}: no hay una ruta con id "${id}" en ${ARCHIVO_RUTAS}.`)
    console.log(`  Ids válidos: ${rutas.map((r) => r.id).join(', ')}`)
    hayErrores = true
    continue
  }

  let dibujo
  try {
    dibujo = JSON.parse(fs.readFileSync(path.join(CARPETA, archivo), 'utf8'))
  } catch {
    console.log(`✗ ${archivo}: el archivo no es un geojson válido. Vuelve a guardarlo desde geojson.io.`)
    hayErrores = true
    continue
  }

  const features = dibujo.type === 'FeatureCollection' ? dibujo.features : [dibujo]
  const tramos = []
  const puntos = []
  for (const f of features) {
    const g = f.geometry
    if (!g) continue
    if (g.type === 'LineString') tramos.push({ sombra: leerSombra(f.properties?.sombra), coords: g.coordinates })
    if (g.type === 'MultiLineString') g.coordinates.forEach((c) => tramos.push({ sombra: leerSombra(f.properties?.sombra), coords: c }))
    if (g.type === 'Polygon') tramos.push({ sombra: leerSombra(f.properties?.sombra), coords: g.coordinates[0] })
    if (g.type === 'Point') {
      const tipo = leerTipo(f.properties?.tipo)
      if (tipo) puntos.push({ tipo, nombre: f.properties?.nombre || tipo, coord: g.coordinates })
    }
  }
  if (tramos.length === 0) {
    console.log(`✗ ${archivo}: no tiene ninguna línea. Dibuja el circuito con la herramienta de línea.`)
    hayErrores = true
    continue
  }

  // Circuito: si no termina donde empieza, lo cerramos
  const inicio = tramos[0].coords[0]
  const ultimoTramo = tramos[tramos.length - 1]
  const fin = ultimoTramo.coords[ultimoTramo.coords.length - 1]
  const separacionM = km(inicio, fin) * 1000
  if (separacionM > 5) ultimoTramo.coords = [...ultimoTramo.coords, inicio]

  const totalKm = tramos.reduce((s, t) => s + largo(t.coords), 0)
  const sombraKm = tramos.filter((t) => t.sombra === 'alta').reduce((s, t) => s + largo(t.coords), 0)
  const sombraPct = Math.round((sombraKm / totalKm) * 100)

  ruta.geojson = {
    type: 'FeatureCollection',
    features: [
      ...tramos.map((t) => ({
        type: 'Feature',
        properties: { sombra: t.sombra },
        geometry: { type: 'LineString', coordinates: t.coords.map(redondear) },
      })),
      ...puntos.map((p) => ({
        type: 'Feature',
        properties: { tipo: p.tipo, nombre: p.nombre },
        geometry: { type: 'Point', coordinates: redondear(p.coord) },
      })),
    ],
  }
  const esperado = Number(ruta.distancia_esperada_km ?? ruta.distancia_km)
  ruta.distancia_esperada_km = esperado
  ruta.distancia_km = Math.round(totalKm * 10) / 10
  ruta.sombra_pct = sombraPct
  ruta.sombra_nivel = sombraPct >= 70 ? 'mucha_sombra' : sombraPct <= 30 ? 'sol_total' : 'mixta'
  ruta.fuentes_agua = puntos.filter((p) => p.tipo === 'agua').length
  ruta.puntos_medicos = puntos.filter((p) => p.tipo === 'medico').length
  ruta.lat_inicio = Number(inicio[1].toFixed(6))
  ruta.lng_inicio = Number(inicio[0].toFixed(6))
  ruta.trazo_aproximado = false

  const diferencia = esperado ? Math.abs(totalKm - esperado) / esperado : 0
  resumen.push({
    ruta: ruta.nombre,
    'km dibujados': totalKm.toFixed(2),
    'km esperados': esperado ? esperado.toFixed(1) : '-',
    sombra: `${sombraPct}%`,
    agua: ruta.fuentes_agua,
    cerrado: separacionM > 5 ? `se cerró (${Math.round(separacionM)} m)` : 'sí',
    revisar: diferencia > 0.15 ? '⚠ distancia muy distinta' : '',
  })
}

fs.writeFileSync(ARCHIVO_RUTAS, JSON.stringify(rutas, null, 2) + '\n')
if (resumen.length) console.table(resumen)
console.log(hayErrores ? 'Terminó con avisos: revisa los mensajes de arriba.' : `Listo: ${ARCHIVO_RUTAS} actualizado.`)
