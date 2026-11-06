// Distancia entre dos puntos en km (Haversine hecha a mano)
export function haversineKm(a, b) {
  const R = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Junta todos los LineString del geojson en una lista de {lat, lng}
export function extraerPolilinea(geojson) {
  const pts = [];
  (geojson?.features || []).forEach((f) => {
    if (f.geometry?.type === "LineString") {
      f.geometry.coordinates.forEach(([lng, lat]) => pts.push({ lat, lng }));
    }
  });
  return pts;
}

// GPS real: llama onPunto({lat,lng,precision,t}) y onError(mensaje)
export function crearGpsReal() {
  let id = null;
  return {
    iniciar(onPunto, onError) {
      if (!navigator.geolocation) {
        onError("Tu navegador no soporta GPS.");
        return;
      }
      id = navigator.geolocation.watchPosition(
        (p) =>
          onPunto({
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            precision: p.coords.accuracy,
            t: Date.now(),
          }),
        (e) =>
          onError(
            e.code === 1
              ? "Permiso de GPS negado. Actívalo en los ajustes del navegador (Ubicación > Permitir)."
              : "No se pudo obtener tu ubicación."
          ),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    },
    detener() {
      if (id !== null) navigator.geolocation.clearWatch(id);
      id = null;
    },
  };
}

// GPS simulado: camina la polilínea a 10 km/h (x multiplicador)
export function crearGpsSimulado(polilinea) {
  let timer = null;
  let metros = 0; // avance acumulado (se conserva al pausar)
  let mult = 1;

  function puntoEn(m) {
    let resto = m;
    for (let i = 1; i < polilinea.length; i++) {
      const seg = haversineKm(polilinea[i - 1], polilinea[i]) * 1000;
      if (resto <= seg) {
        const f = seg === 0 ? 0 : resto / seg;
        return {
          lat: polilinea[i - 1].lat + (polilinea[i].lat - polilinea[i - 1].lat) * f,
          lng: polilinea[i - 1].lng + (polilinea[i].lng - polilinea[i - 1].lng) * f,
        };
      }
      resto -= seg;
    }
    return polilinea[polilinea.length - 1]; // fin de la ruta
  }

  return {
    iniciar(onPunto) {
      if (polilinea.length < 2) return;
      timer = setInterval(() => {
        metros += (10 / 3.6) * mult; // 10 km/h = 2.78 m/s
        onPunto({ ...puntoEn(metros), precision: 5, t: Date.now(), simulado: true });
      }, 1000);
    },
    detener() {
      clearInterval(timer);
      timer = null;
    },
    setMultiplicador(x) {
      mult = x;
    },
  };
}// Lectura de la ubicación del usuario (GPS)
