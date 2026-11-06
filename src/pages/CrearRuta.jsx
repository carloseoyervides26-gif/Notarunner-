import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCarrera } from "../context/CarreraProvider";
import { useContexto } from "../context/ContextoProvider";
import { rutaCarreraFalsa } from "../mocks/rutaCarrera";
import { guardarCarreraSeguro, publicarRutaSeguro } from "../services/guardadoP4";

const OPCIONES_SOMBRA = [
  { valor: "sol_total", texto: "Sol 100% (pocos árboles)", pct: 20 },
  { valor: "mixta", texto: "50/50 (sombra/sol)", pct: 50 },
  { valor: "mucha_sombra", texto: "Mucha sombra", pct: 85 },
  { valor: "noche", texto: "Corrí de noche", pct: 50 },
];

function formatoRitmo(seg) {
  if (!seg || !isFinite(seg)) return "--'--\"";
  return `${Math.floor(seg / 60)}'${String(Math.round(seg % 60)).padStart(2, "0")}"`;
}

function formatoTiempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  return [h, m, seg % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

// Trayecto simplificado: una de cada 10 coordenadas
function geojsonDeTrayecto(trayecto, sombraNivel) {
  const pts = trayecto.filter((_, i) => i % 10 === 0);
  const ultimo = trayecto[trayecto.length - 1];
  if (ultimo && pts[pts.length - 1] !== ultimo) pts.push(ultimo);
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { sombra: sombraNivel === "sol_total" ? "baja" : "alta" },
        geometry: { type: "LineString", coordinates: pts.map((p) => [p.lng, p.lat]) },
      },
    ],
  };
}

export default function CrearRuta() {
  const c = useCarrera();
  const { gpsSimulado, setGpsSimulado, sensacionTermica } = useContexto();
  const navigate = useNavigate();

  const [vista, setVista] = useState("resumen"); // resumen | formulario | listo
  const [nombre, setNombre] = useState("");
  const [sombra, setSombra] = useState("");
  const [fuentes, setFuentes] = useState(""); // "si" | "no"
  const [notas, setNotas] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  // Siempre guarda la carrera una sola vez al terminar
  const guardada = useRef(false);
  useEffect(() => {
    if (c.estado !== "terminada") {
      guardada.current = false;
      return;
    }
    if (guardada.current) return;
    guardada.current = true;
    guardarCarreraSeguro({
      route_id: null, // carrera libre
      inicio: new Date(Date.now() - c.tiempoSeg * 1000).toISOString(),
      fin: new Date().toISOString(),
      duracion_seg: c.tiempoSeg,
      distancia_km: Number(c.distanciaKm.toFixed(3)),
      ritmo_min_km: c.ritmoPromedio ? Number((c.ritmoPromedio / 60).toFixed(2)) : null,
      trayecto: c.trayecto,
      sensacion_termica: sensacionTermica,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.estado]);

  function salir() {
    c.reiniciar();
    setVista("resumen");
    navigate("/");
  }

  async function publicar() {
    const e = {};
    if (!nombre.trim()) e.nombre = "Escribe un nombre para tu ruta.";
    else if (!/^[\p{L}\p{N} ]+$/u.test(nombre.trim())) e.nombre = "Usa solo letras y números.";
    if (!sombra) e.sombra = "Elige cuánta sombra tenía el recorrido.";
    if (!fuentes) e.fuentes = "Indica si las fuentes de agua funcionaban.";
    setErrores(e);
    if (Object.keys(e).length) return;

    setEnviando(true);
    setErrorEnvio("");
    try {
      await publicarRutaSeguro({
        nombre: nombre.trim(),
        sombra_nivel: sombra,
        sombra_pct: OPCIONES_SOMBRA.find((o) => o.valor === sombra).pct,
        fuentes_funcionales: fuentes === "si",
        notas: notas.trim(),
        distancia_km: Number(c.distanciaKm.toFixed(2)),
        geojson: geojsonDeTrayecto(c.trayecto, sombra),
      });
      setVista("listo");
    } catch {
      setErrorEnvio("No se pudo publicar la ruta. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  // Estado inicial
  if (c.estado === "inactiva") {
    return (
      <div className="p-4 space-y-4 text-white">
        <h2 className="text-2xl font-titulos">Carrera libre</h2>
        <p className="text-suave">Corre sin una ruta predefinida. Al terminar puedes compartir tu recorrido.</p>
        <button className="w-full bg-tarjeta py-3 rounded-xl" onClick={() => setGpsSimulado(!gpsSimulado)}>
          GPS simulado: {gpsSimulado ? "SÍ" : "NO"} (tocar para cambiar)
        </button>
        <button
          className="w-full bg-menta text-fondo font-bold py-4 rounded-xl"
          onClick={() => c.iniciar(rutaCarreraFalsa.geojson)}
        >
          Iniciar
        </button>
      </div>
    );
  }

  // Carrera terminada
  if (c.estado === "terminada") {
    if (vista === "listo") {
      return (
        <div className="p-4 space-y-4 text-white text-center">
          <h2 className="text-2xl font-titulos text-menta">¡Ruta publicada!</h2>
          <p className="text-suave">Gracias por compartir tu recorrido con la comunidad.</p>
          <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={salir}>
            Volver a Explorar
          </button>
        </div>
      );
    }

    if (vista === "formulario") {
      return (
        <div className="p-4 space-y-4 text-white">
          <h2 className="text-2xl font-titulos">Publicar nueva ruta</h2>

          <div>
            <label className="block text-sm mb-1">Ponle un nombre a tu ruta*</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-tarjeta rounded-xl p-3 text-white"
              placeholder="Ej. Vuelta al parque"
            />
            {errores.nombre && <p className="text-peligro text-sm mt-1">{errores.nombre}</p>}
          </div>

          <div>
            <p className="text-sm mb-1">¿Cuánta sombra tiene este recorrido?*</p>
            <div className="space-y-2">
              {OPCIONES_SOMBRA.map((o) => (
                <button
                  key={o.valor}
                  onClick={() => setSombra(o.valor)}
                  className={`w-full text-left p-3 rounded-xl border ${
                    sombra === o.valor ? "border-menta bg-menta/10" : "border-suave/30 bg-tarjeta"
                  }`}
                >
                  {o.texto}
                </button>
              ))}
            </div>
            {errores.sombra && <p className="text-peligro text-sm mt-1">{errores.sombra}</p>}
          </div>

          <div>
            <p className="text-sm mb-1">¿Encontraste fuentes de agua funcionales?*</p>
            <div className="grid grid-cols-2 gap-3">
              {[["si", "Sí"], ["no", "No"]].map(([v, t]) => (
                <button
                  key={v}
                  onClick={() => setFuentes(v)}
                  className={`p-3 rounded-xl border ${
                    fuentes === v ? "border-menta bg-menta/10" : "border-suave/30 bg-tarjeta"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {errores.fuentes && <p className="text-peligro text-sm mt-1">{errores.fuentes}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full bg-tarjeta rounded-xl p-3 text-white"
              placeholder="Opcional"
            />
          </div>

          {errorEnvio && <p className="bg-peligro/20 text-peligro rounded-xl p-3">{errorEnvio}</p>}

          <button
            disabled={enviando}
            className="w-full bg-menta text-fondo font-bold py-4 rounded-xl disabled:opacity-50"
            onClick={publicar}
          >
            {enviando ? "Publicando..." : "Publicar"}
          </button>
          <button className="w-full bg-tarjeta py-3 rounded-xl" onClick={() => setVista("resumen")}>
            Atrás
          </button>
        </div>
      );
    }

    // Resumen + pregunta de compartir
    return (
      <div className="p-4 space-y-4 text-white">
        <h2 className="text-2xl font-titulos">¡Carrera finalizada!</h2>
        <div className="bg-tarjeta rounded-xl p-4 space-y-2 font-datos">
          <p>Tiempo: {formatoTiempo(c.tiempoSeg)}</p>
          <p>Distancia: {c.distanciaKm.toFixed(2)} km</p>
          <p>Ritmo promedio: {formatoRitmo(c.ritmoPromedio)} /km</p>
        </div>
        <p className="font-bold">¿Te gustaría compartir esta ruta con la comunidad?</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-menta text-fondo font-bold py-3 rounded-xl" onClick={() => setVista("formulario")}>
            SÍ
          </button>
          <button className="bg-tarjeta py-3 rounded-xl" onClick={salir}>
            No
          </button>
        </div>
      </div>
    );
  }

  // Corriendo o en pausa
  return (
    <div className="p-4 space-y-4 text-white">
      {c.estado === "pausada" && <p className="text-center text-lima font-bold">En pausa</p>}
      {c.error && <p className="bg-peligro/20 text-peligro rounded-xl p-3">{c.error}</p>}
      {c.avisoPantalla && <p className="bg-lima/20 text-lima rounded-xl p-3 text-sm">{c.avisoPantalla}</p>}

      <div className="bg-tarjeta rounded-xl p-6 text-center">
        <p className="text-suave text-xs">CRONÓMETRO</p>
        <p className="text-5xl font-datos">{formatoTiempo(c.tiempoSeg)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-tarjeta rounded-xl p-3">
          <p className="text-suave text-xs">RITMO PROM. (/KM)</p>
          <p className="text-3xl font-datos text-lima">{formatoRitmo(c.ritmoPromedio)}</p>
        </div>
        <div className="bg-tarjeta rounded-xl p-3">
          <p className="text-suave text-xs">DISTANCIA (KM)</p>
          <p className="text-3xl font-datos">{c.distanciaKm.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {c.estado === "corriendo" ? (
          <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={c.pausar}>
            Pausar
          </button>
        ) : (
          <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={c.reanudar}>
            Reanudar
          </button>
        )}
        <button className="w-full bg-peligro text-white font-bold py-3 rounded-xl" onClick={c.finalizar}>
          Finalizar ›
        </button>
        {gpsSimulado && (
          <button className="w-full bg-tarjeta py-2 rounded-xl text-sm" onClick={() => c.setVelocidad(5)}>
            Acelerar ×5 (solo simulación)
          </button>
        )}
      </div>
    </div>
  );
}