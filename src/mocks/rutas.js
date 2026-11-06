// Rutas falsas con la forma del CONTRATO 3 (igual a la tabla routes de Supabase).
// Las coordenadas son aproximadas, solo sirven para desarrollar.
// En el geojson las coordenadas van como [lng, lat].

// Ayudante pequeño para armar un tramo (LineString)
const tramo = (sombra, coordenadas) => ({
  type: 'Feature',
  properties: { sombra }, // 'alta' = con sombra, 'baja' = sin sombra
  geometry: { type: 'LineString', coordinates: coordenadas },
});

// Ayudante pequeño para armar un punto (agua, bano, medico)
const punto = (tipo, nombre, coordenada) => ({
  type: 'Feature',
  properties: { tipo, nombre },
  geometry: { type: 'Point', coordinates: coordenada },
});

export const rutasMock = [
  {
    id: 'ruta-1',
    nombre: 'Parque Fundidora',
    descripcion: 'Circuito amplio con árboles y fuentes. Ideal para correr con calor.',
    distancia_km: 5.0,
    desnivel_m: 45,
    superficie: 'Asfalto y tartán',
    sombra_pct: 82,
    fuentes_agua: 2,
    iluminacion_pct: 90,
    puntos_medicos: 1,
    solo_am: false,
    aviso_horario: null,
    lat_inicio: 25.6786,
    lng_inicio: -100.2845,
    geojson: {
      type: 'FeatureCollection',
      features: [
        tramo('alta', [[-100.2845, 25.6786], [-100.2820, 25.6795], [-100.2795, 25.6803]]),
        tramo('baja', [[-100.2795, 25.6803], [-100.2770, 25.6812], [-100.2750, 25.6820]]),
        tramo('alta', [[-100.2750, 25.6820], [-100.2790, 25.6830], [-100.2845, 25.6786]]),
        punto('agua', 'Fuente principal', [-100.2820, 25.6795]),
        punto('agua', 'Fuente lago', [-100.2770, 25.6812]),
        punto('bano', 'Baños centrales', [-100.2800, 25.6800]),
        punto('medico', 'Módulo médico', [-100.2845, 25.6786]),
      ],
    },
    imagen_url: null, // TarjetaRuta debe mostrar un fondo de respaldo si viene null
    publica: true,
    sombra_nivel: 'mucha_sombra',
    fuentes_funcionales: true,
    notas: null,
    creada_por: null,
  },
  {
    id: 'ruta-2',
    nombre: 'Calzada San Pedro',
    descripcion: 'Ruta corta y plana, con poca sombra. Mejor en la mañana temprano.',
    distancia_km: 3.0,
    desnivel_m: 12,
    superficie: 'Concreto',
    sombra_pct: 25,
    fuentes_agua: 1,
    iluminacion_pct: 60,
    puntos_medicos: 0,
    solo_am: true, // el motor le resta puntos después de las 11:00
    aviso_horario: 'Sol directo después de las 11:00 AM',
    lat_inicio: 25.6570,
    lng_inicio: -100.3680,
    geojson: {
      type: 'FeatureCollection',
      features: [
        tramo('baja', [[-100.3680, 25.6570], [-100.3650, 25.6580], [-100.3620, 25.6590]]),
        tramo('alta', [[-100.3620, 25.6590], [-100.3600, 25.6595]]),
        tramo('baja', [[-100.3600, 25.6595], [-100.3640, 25.6580], [-100.3680, 25.6570]]),
        punto('agua', 'Bebedero plaza', [-100.3650, 25.6580]),
        punto('bano', 'Baños públicos', [-100.3620, 25.6590]),
      ],
    },
    imagen_url: null,
    publica: true,
    sombra_nivel: 'sol_total',
    fuentes_funcionales: true,
    notas: 'Se llena de gente los fines de semana.',
    creada_por: null,
  },
  {
    id: 'ruta-3',
    nombre: 'Parque Río La Silla',
    descripcion: 'Recorrido largo junto al río, con tramos de sombra y buena iluminación.',
    distancia_km: 10.0,
    desnivel_m: 80,
    superficie: 'Pavimento y terracería',
    sombra_pct: 55,
    fuentes_agua: 4,
    iluminacion_pct: 85,
    puntos_medicos: 2,
    solo_am: false,
    aviso_horario: null,
    lat_inicio: 25.6350,
    lng_inicio: -100.2550,
    geojson: {
      type: 'FeatureCollection',
      features: [
        tramo('alta', [[-100.2550, 25.6350], [-100.2500, 25.6370], [-100.2450, 25.6390]]),
        tramo('baja', [[-100.2450, 25.6390], [-100.2400, 25.6410], [-100.2350, 25.6420]]),
        tramo('alta', [[-100.2350, 25.6420], [-100.2450, 25.6380], [-100.2550, 25.6350]]),
        punto('agua', 'Fuente entrada', [-100.2550, 25.6350]),
        punto('agua', 'Fuente km 3', [-100.2500, 25.6370]),
        punto('agua', 'Fuente km 6', [-100.2400, 25.6410]),
        punto('bano', 'Baños km 5', [-100.2430, 25.6395]),
        punto('medico', 'Puesto médico', [-100.2550, 25.6350]),
      ],
    },
    imagen_url: null,
    publica: true,
    sombra_nivel: 'mixta',
    fuentes_funcionales: true,
    notas: null,
    creada_por: null,
  },
];
