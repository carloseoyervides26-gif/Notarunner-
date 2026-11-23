// Comentarios "Agregado por la aplicación": se generan con los datos de cada ruta.
// Función pura: no usa React ni internet.

export function comentariosDeApp(rutas = []) {
  const lista = []
  const agregar = (ruta, clave, texto) =>
    lista.push({
      id: `app-${ruta.id}-${clave}`,
      route_id: ruta.id,
      ruta_nombre: ruta.nombre,
      texto,
      autor: null,
      deApp: true,
      esMio: false,
      confirmaciones: null,
      fecha: null,
    })

  for (const ruta of rutas) {
    const km = Number(ruta.distancia_km)
    if (km > 0) {
      agregar(ruta, 'circuito', `Circuito de ${km.toFixed(1)} km: empiezas y terminas en el mismo punto.`)
    }

    // Sombra, agua y horario solo si la ruta ya tiene su trazo (datos medidos)
    const tieneTrazo = ruta.geojson?.features?.length > 0
    if (tieneTrazo) {
      const sombra = ruta.sombra_pct ?? 0
      if (sombra >= 60) {
        agregar(ruta, 'sombra', `Tiene mucha sombra (${sombra}%). Buena opción para días de calor.`)
      } else if (sombra <= 35) {
        agregar(
          ruta,
          'sombra',
          `Tiene poca sombra (${sombra}%). Conviene correrla antes de las 10:00 o después de las 18:00.`,
        )
      } else {
        agregar(ruta, 'sombra', `Sombra mixta (${sombra}%). Lleva gorra y bloqueador si hay sol.`)
      }

      const fuentes = ruta.fuentes_agua ?? 0
      agregar(
        ruta,
        'agua',
        fuentes > 0
          ? `Tiene ${fuentes} ${fuentes === 1 ? 'fuente de agua registrada' : 'fuentes de agua registradas'} en el recorrido.`
          : 'No tiene fuentes de agua registradas: lleva tu propia agua.',
      )
    }

    if (ruta.solo_am && ruta.aviso_horario) agregar(ruta, 'horario', `${ruta.aviso_horario}.`)
    if (ruta.notas) agregar(ruta, 'notas', ruta.notas)
  }
  return lista
}

// Quita acentos y mayúsculas para buscar ("niños" encuentra "Ninos")
export function normalizar(texto = '') {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
