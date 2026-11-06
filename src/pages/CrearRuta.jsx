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

// 925 seg -> 00:15:25
function formatoTiempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  return [h, m, seg % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

// 1725 seg -> 28:45
function formatoMinSeg(seg) {
  return `${String(Math.floor(seg / 60)).padStart(2, "0")}:${String(seg % 60).padStart(2, "0")}`;
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

// Círculo de selección (como en el Figma)
function Radio({ activo }) {
  return (
    <span
      className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        activo ? "border-menta" : "border-suave/50"
      }`}
    >
      {activo && <span className="w-2.5 h-2.5 rounded-full bg-menta" />}
    </span>
  );
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
      <div className="p-4 flex flex-col min-h-[70vh] text-white">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <p className="font-datos text-5xl text-suave">00:00:00</p>
          <p className="text-suave text-sm max-w-xs">
            Corre sin una ruta predefinida. Al terminar puedes compartir tu recorrido.
          </p>
        </div>
        <button className="text-xs text-suave py-2" onClick={() => setGpsSimulado(!gpsSimulado)}>
          GPS simulado: {gpsSimulado ? "SÍ" : "NO"} (tocar para cambiar)
        </button>
        <button
          className="w-full bg-menta text-fondo font-bold py-4 rounded-full"
          onClick={() => c.iniciar(rutaCarreraFalsa.geojson)}
        >
          ▶ Iniciar
        </button>
      </div>
    );
  }

  // Carrera terminada
  if (c.estado === "terminada") {
    if (vista === "listo") {
      return (
        <div className="p-4 min-h-[70vh] flex items-center justify-center text-white">
          <div className="bg-tarjeta rounded-3xl p-6 w-full max-w-sm text-center space-y-4">
            <h2 className="text-xl font-titulos font-bold text-menta">¡Ruta publicada!</h2>
            <p className="text-suave text-sm">Gracias por compartir tu recorrido con la comunidad.</p>
            <button className="w-full bg-menta text-fondo font-bold py-3 rounded-full" onClick={salir}>
              Volver a Explorar
            </button>
          </div>
        </div>
      );
    }

    if (vista === "formulario") {
      return (
        <div className="p-4 space-y-5 text-white">
          <button
            className="bg-tarjeta text-xs rounded-full px-3 py-1.5"
            onClick={() => setVista("resumen")}
          >
            ‹ Publicar nueva ruta
          </button>

          <div>
            <p className="text-sm font-bold mb-2">Ponle un nombre a tu ruta*</p>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-tarjeta rounded-xl p-3 text-sm text-white placeholder:text-suave outline-none"
              placeholder="Caracteres y números"
            />
            {errores.nombre && <p className="text-peligro text-xs mt-1">{errores.nombre}</p>}
          </div>

          <div>
            <p className="text-sm font-bold mb-2">¿Cuánta sombra tiene este recorrido?*</p>
            <div className="space-y-2">
              {OPCIONES_SOMBRA.map((o) => (
                <button
                  key={o.valor}
                  onClick={() => setSombra(o.valor)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <Radio activo={sombra === o.valor} />
                  <span
                    className={`flex-1 rounded-xl p-3 text-sm border ${
                      sombra === o.valor ? "border-menta bg-menta/10" : "border-transparent bg-tarjeta"
                    }`}
                  >
                    {o.texto}
                  </span>
                </button>
              ))}
            </div>
            {errores.sombra && <p className="text-peligro text-xs mt-1">{errores.sombra}</p>}
          </div>

          <div>
            <p className="text-sm font-bold mb-2">¿Encontraste fuentes de agua funcionales?*</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["si", "Sí"],
                ["no", "No"],
              ].map(([v, t]) => (
                <button
                  key={v}
                  onClick={() => setFuentes(v)}
                  className={`p-3 rounded-xl text-sm border ${
                    fuentes === v ? "border-menta bg-menta/10" : "border-transparent bg-tarjeta"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {errores.fuentes && <p className="text-peligro text-xs mt-1">{errores.fuentes}</p>}
          </div>

          <div>
            <p className="text-sm font-bold mb-2">Notas</p>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full bg-tarjeta rounded-xl p-3 text-sm text-white placeholder:text-suave outline-none"
              placeholder="Caracteres y números"
            />
          </div>

          {errorEnvio && <p className="bg-peligro/20 text-peligro rounded-xl p-3 text-sm">{errorEnvio}</p>}

          <button
            disabled={enviando}
            className="w-full bg-menta text-fondo font-bold py-4 rounded-full disabled:opacity-50"
            onClick={publicar}
          >
            {enviando ? "Publicando..." : "Publicar"}
          </button>
        </div>
      );
    }

    // Resumen + pregunta de compartir
    return (
      <div className="p-4 min-h-[70vh] flex items-center justify-center text-white">
        <div className="bg-tarjeta rounded-3xl p-6 w-full max-w-sm text-center space-y-4">
          <h2 className="text-xl font-titulos font-bold">¡Carrera finalizada!</h2>
          <div className="font-datos text-lima text-sm space-y-1">
            <p>Tiempo {formatoMinSeg(c.tiempoSeg)} min</p>
            <p>Distancia {c.distanciaKm.toFixed(2)} km</p>
            <p>Ritmo promedio {formatoRitmo(c.ritmoPromedio)} /km</p>
          </div>
          <p className="font-bold text-sm pt-2">¿Te gustaría compartir esta ruta con la comunidad?</p>
          <div className="flex justify-center gap-3">
            <button
              className="bg-menta text-fondo font-bold px-8 py-2.5 rounded-full"
              onClick={() => setVista("formulario")}
            >
              Sí
            </button>
            <button className="bg-fondo font-bold px-8 py-2.5 rounded-full" onClick={salir}>
              No
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Corriendo o en pausa
  return (
    <div className="p-4 flex flex-col min-h-[75vh] text-white">
      <div className="text-center space-y-2">
        {c.estado === "pausada" && (
          <p className="inline-block bg-lima/15 text-lima text-xs font-bold px-3 py-1 rounded-full">En pausa</p>
        )}
        <p className="font-datos text-5xl tracking-wide">{formatoTiempo(c.tiempoSeg)}</p>
      </div>

      {c.error && <p className="bg-peligro/20 text-peligro rounded-xl p-3 text-sm mt-3">{c.error}</p>}
      {c.avisoPantalla && <p className="bg-lima/15 text-lima rounded-xl p-3 text-xs mt-3">{c.avisoPantalla}</p>}

      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-6">
        <div className="text-center">
          <p className="font-datos text-7xl">{formatoRitmo(c.ritmoPromedio)}</p>
          <p className="font-datos text-xs text-lima mt-1">Ritmo prom. (/Km)</p>
        </div>
        <div className="text-center">
          <p className="font-datos text-7xl">{c.distanciaKm.toFixed(2)}</p>
          <p className="font-datos text-xs text-lima mt-1">Distancia (Km)</p>
        </div>
      </div>

      {gpsSimulado && (
        <button className="text-xs text-suave py-2" onClick={() => c.setVelocidad(5)}>
          Acelerar ×5 (solo simulación)
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        {c.estado === "corriendo" ? (
          <button className="bg-menta text-fondo font-bold py-4 rounded-full" onClick={c.pausar}>
            Pausar
          </button>
        ) : (
          <button className="bg-menta text-fondo font-bold py-4 rounded-full" onClick={c.reanudar}>
            Reanudar
          </button>
        )}
        <button className="bg-tarjeta font-bold py-4 rounded-full" onClick={c.finalizar}>
          Finalizar ›
        </button>
      </div>
    </div>
  );
}