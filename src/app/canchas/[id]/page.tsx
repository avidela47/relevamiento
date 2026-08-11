"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Cancha = {
  _id: string;
  cliente: string;
  nombre: string;
  largoX: number;
  anchoY: number;
  notas?: string;
};

type Modelo = {
  _id: string;
  codigo: string;
  cantidadModulos: number;
};

type Poste = {
  _id: string;
  x: number;
  y: number;
  altura: number;
  distanciaCentro: number;
  obstruido: boolean;
  modeloArmadoId: Modelo | string;
};

// Convierte metros (origen = centro de cancha) a coordenadas SVG (origen = esquina sup. izq.)
function aSvg(x: number, y: number, largoX: number, anchoY: number, w: number, h: number) {
  const px = (x / largoX + 0.5) * w;
  const py = (0.5 - y / anchoY) * h;
  return { px, py };
}

export default function CanchaDetalle() {
  const params = useParams<{ id: string }>();
  const canchaId = params.id;

  const [cancha, setCancha] = useState<Cancha | null>(null);
  const [postes, setPostes] = useState<Poste[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [metodo, setMetodo] = useState<"polar" | "cartesiano">("polar");
  const [form, setForm] = useState({
    distanciaCentro: "",
    anguloGrados: "",
    x: "",
    y: "",
    altura: "",
    modeloArmadoId: "",
    obstruido: false,
  });

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    try {
      const [rCancha, rPostes, rModelos] = await Promise.all([
        fetch(`/api/canchas/${canchaId}`),
        fetch(`/api/postes?canchaId=${canchaId}`),
        fetch(`/api/modelos`),
      ]);
      if (!rCancha.ok) throw new Error("No se encontró la cancha");
      setCancha(await rCancha.json());
      setPostes(await rPostes.json());
      setModelos(await rModelos.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, [canchaId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos, patrón intencional
    cargarTodo();
  }, [cargarTodo]);

  async function crearPoste(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      let x: number, y: number, anguloRad: number, distanciaCentro: number;

      if (metodo === "polar") {
        const dist = Number(form.distanciaCentro);
        const angRad = (Number(form.anguloGrados) * Math.PI) / 180;
        x = dist * Math.cos(angRad);
        y = dist * Math.sin(angRad);
        anguloRad = angRad;
        distanciaCentro = dist;
      } else {
        x = Number(form.x);
        y = Number(form.y);
        anguloRad = Math.atan2(y, x);
        distanciaCentro = Math.sqrt(x * x + y * y);
      }

      const res = await fetch("/api/postes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canchaId,
          x,
          y,
          anguloRad,
          distanciaCentro,
          altura: Number(form.altura),
          modeloArmadoId: form.modeloArmadoId,
          obstruido: form.obstruido,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo crear el poste");
      }
      setForm({
        distanciaCentro: "",
        anguloGrados: "",
        x: "",
        y: "",
        altura: "",
        modeloArmadoId: form.modeloArmadoId,
        obstruido: false,
      });
      await cargarTodo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGuardando(false);
    }
  }

  async function borrarPoste(id: string) {
    if (!confirm("¿Borrar este poste y sus luminarias?")) return;
    await fetch(`/api/postes/${id}`, { method: "DELETE" });
    await cargarTodo();
  }

  if (cargando) return <p className="text-sm text-zinc-500">Cargando...</p>;
  if (error || !cancha)
    return (
      <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error || "Cancha no encontrada"}
      </p>
    );

  // El lienzo no es solo el tamaño de la cancha: las torres de iluminación suelen
  // estar fuera del rectángulo de juego (en las tribunas). Si hay postes más lejos
  // que el borde de la cancha, agrandamos el área dibujada para que entren, con un
  // margen extra de aire alrededor del punto más lejano.
  const MARGEN_METROS = 5;
  const maxAbsX = Math.max(cancha.largoX / 2, ...postes.map((p) => Math.abs(p.x))) + MARGEN_METROS;
  const maxAbsY = Math.max(cancha.anchoY / 2, ...postes.map((p) => Math.abs(p.y))) + MARGEN_METROS;
  const extentX = maxAbsX * 2;
  const extentY = maxAbsY * 2;

  const W = 400;
  const H = (extentY / extentX) * W;
  const escala = W / extentX; // px por metro (misma escala en X e Y, no distorsiona)

  // Esquinas de la cancha real (no del lienzo) para dibujar el rectángulo verde de juego.
  const canchaRect = (() => {
    const pa = aSvg(-cancha.largoX / 2, -cancha.anchoY / 2, extentX, extentY, W, H);
    const pb = aSvg(cancha.largoX / 2, cancha.anchoY / 2, extentX, extentY, W, H);
    return {
      x: Math.min(pa.px, pb.px),
      y: Math.min(pa.py, pb.py),
      width: Math.abs(pb.px - pa.px),
      height: Math.abs(pb.py - pa.py),
    };
  })();

  // Medidas reglamentarias FIFA, en metros, aplicadas simétricamente en ambos arcos.
  const RADIO_CIRCULO_CENTRAL = 9.15;
  const AREA_GRANDE_PROF = 16.5;
  const AREA_GRANDE_ANCHO = 40.32;
  const AREA_CHICA_PROF = 5.5;
  const AREA_CHICA_ANCHO = 18.32;
  const DIST_PENAL = 11;
  const ANCHO_ARCO = 7.32;

  // Convierte dos esquinas en metros (origen = centro cancha) a un rect en px.
  function rectDesdeMetros(xa: number, ya: number, xb: number, yb: number) {
    const pa = aSvg(xa, ya, extentX, extentY, W, H);
    const pb = aSvg(xb, yb, extentX, extentY, W, H);
    return {
      x: Math.min(pa.px, pb.px),
      y: Math.min(pa.py, pb.py),
      width: Math.abs(pb.px - pa.px),
      height: Math.abs(pb.py - pa.py),
    };
  }

  // signo +1 = arco del lado derecho (x positivo), -1 = arco del lado izquierdo
  function marcasDeArco(signo: 1 | -1) {
    const lineaGol = signo * (cancha!.largoX / 2);
    const bordeAreaGrande = lineaGol - signo * AREA_GRANDE_PROF;
    const bordeAreaChica = lineaGol - signo * AREA_CHICA_PROF;
    const puntoPenal = lineaGol - signo * DIST_PENAL;

    const areaGrande = rectDesdeMetros(
      lineaGol,
      -AREA_GRANDE_ANCHO / 2,
      bordeAreaGrande,
      AREA_GRANDE_ANCHO / 2
    );
    const areaChica = rectDesdeMetros(
      lineaGol,
      -AREA_CHICA_ANCHO / 2,
      bordeAreaChica,
      AREA_CHICA_ANCHO / 2
    );
    const arco = rectDesdeMetros(lineaGol, -ANCHO_ARCO / 2, lineaGol - signo * 1.2, ANCHO_ARCO / 2);
    const spotPx = aSvg(puntoPenal, 0, extentX, extentY, W, H);
    const bordeAreaPx = aSvg(bordeAreaGrande, 0, extentX, extentY, W, H).px;

    // Recorte del círculo del punto penal para que solo se vea el arco que
    // queda fuera del área grande (la "D" reglamentaria).
    const clipId = `arco-${signo === 1 ? "der" : "izq"}`;
    const clipX = signo === 1 ? 0 : bordeAreaPx;
    const clipW = signo === 1 ? bordeAreaPx : W - bordeAreaPx;

    return { areaGrande, areaChica, arco, spotPx, clipId, clipX, clipW };
  }

  const arcoDer = marcasDeArco(1);
  const arcoIzq = marcasDeArco(-1);

  // Arcos de córner: radio 1m, uno en cada esquina de la cancha.
  const RADIO_ESQUINA = 1;
  function esquina(sx: 1 | -1, sy: 1 | -1) {
    const cornerPx = aSvg(sx * (cancha!.largoX / 2), sy * (cancha!.anchoY / 2), extentX, extentY, W, H);
    const rPx = RADIO_ESQUINA * escala;
    const clipId = `esquina-${sx === 1 ? "d" : "i"}${sy === 1 ? "s" : "n"}`;
    return {
      cx: cornerPx.px,
      cy: cornerPx.py,
      r: rPx,
      clipId,
      clipX: Math.min(cornerPx.px, cornerPx.px - sx * rPx),
      clipY: Math.min(cornerPx.py, cornerPx.py + sy * rPx),
    };
  }
  const esquinas = [esquina(1, 1), esquina(1, -1), esquina(-1, 1), esquina(-1, -1)];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Canchas
        </Link>
        <h1 className="mt-1 text-xl font-semibold">{cancha.nombre}</h1>
        <p className="text-sm text-zinc-500">
          {cancha.cliente} — {cancha.largoX} x {cancha.anchoY} m
        </p>
      </div>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Plano ({postes.length} postes)</h2>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto w-full max-w-xl rounded border border-zinc-200 bg-zinc-50"
        >
          <defs>
            <clipPath id={arcoDer.clipId}>
              <rect x={arcoDer.clipX} y={0} width={arcoDer.clipW} height={H} />
            </clipPath>
            <clipPath id={arcoIzq.clipId}>
              <rect x={arcoIzq.clipX} y={0} width={arcoIzq.clipW} height={H} />
            </clipPath>
            {esquinas.map((e) => (
              <clipPath id={e.clipId} key={e.clipId}>
                <rect x={e.clipX} y={e.clipY} width={e.r} height={e.r} />
              </clipPath>
            ))}
          </defs>

          {/* Rectángulo de juego, en su tamaño real dentro del lienzo (que puede ser más grande si hay postes fuera de la cancha) */}
          <rect {...canchaRect} fill="#f0fdf4" stroke="#86efac" strokeWidth={2} />

          {/* Línea media */}
          <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="#4b5563" strokeWidth={1.25} />

          {/* Círculo central */}
          <circle
            cx={W / 2}
            cy={H / 2}
            r={RADIO_CIRCULO_CENTRAL * escala}
            fill="none"
            stroke="#4b5563"
            strokeWidth={1.25}
          />
          <circle cx={W / 2} cy={H / 2} r={2.5} fill="#4b5563" />

          {/* Áreas y arcos de ambos lados */}
          {[arcoDer, arcoIzq].map((a, i) => (
            <g key={i}>
              <rect
                {...a.areaGrande}
                fill="none"
                stroke="#4b5563"
                strokeWidth={1.25}
              />
              <rect
                {...a.areaChica}
                fill="none"
                stroke="#4b5563"
                strokeWidth={1.25}
              />
              <circle cx={a.spotPx.px} cy={a.spotPx.py} r={2} fill="#4b5563" />
              <circle
                cx={a.spotPx.px}
                cy={a.spotPx.py}
                r={RADIO_CIRCULO_CENTRAL * escala}
                fill="none"
                stroke="#4b5563"
                strokeWidth={1.25}
                clipPath={`url(#${a.clipId})`}
              />
            </g>
          ))}

          {/* Arcos de córner */}
          {esquinas.map((e) => (
            <circle
              key={e.clipId}
              cx={e.cx}
              cy={e.cy}
              r={e.r}
              fill="none"
              stroke="#4b5563"
              strokeWidth={1.25}
              clipPath={`url(#${e.clipId})`}
            />
          ))}

          {postes.map((p) => {
            const { px, py } = aSvg(p.x, p.y, extentX, extentY, W, H);
            return (
              <g key={p._id}>
                <circle
                  cx={px}
                  cy={py}
                  r={6}
                  fill={p.obstruido ? "#f59e0b" : "#2563eb"}
                  stroke="white"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>
        
      </section>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Postes</h2>
        {postes.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no hay postes cargados.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {postes.map((p) => (
              <li key={p._id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/postes/${p._id}`} className="hover:underline">
                  x={p.x.toFixed(2)} y={p.y.toFixed(2)} — altura {p.altura}m —{" "}
                  {typeof p.modeloArmadoId === "object" ? p.modeloArmadoId.codigo : ""}
                  {p.obstruido && <span className="ml-2 text-amber-600">(obstruido)</span>}
                </Link>
                <button
                  onClick={() => borrarPoste(p._id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Nuevo poste</h2>

        {modelos.length === 0 ? (
          <p className="text-sm text-amber-700">
            Todavía no hay modelos cargados. Andá a{" "}
            <Link href="/modelos" className="underline">
              Modelos
            </Link>{" "}
            y cargá al menos uno — las luminarias del poste se generan a partir de ahí.
          </p>
        ) : (
          <form onSubmit={crearPoste} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="col-span-1 flex flex-wrap gap-3 text-sm sm:col-span-2">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={metodo === "polar"}
                  onChange={() => setMetodo("polar")}
                />
                Distancia + ángulo (láser)
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={metodo === "cartesiano"}
                  onChange={() => setMetodo("cartesiano")}
                />
                X / Y directo
              </label>
            </div>

            {metodo === "polar" ? (
              <>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Distancia al centro (m)"
                  value={form.distanciaCentro}
                  onChange={(e) => setForm((f) => ({ ...f, distanciaCentro: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  required
                  type="number"
                  step="0.1"
                  placeholder="Ángulo (grados, 0=derecha, 90=arriba)"
                  value={form.anguloGrados}
                  onChange={(e) => setForm((f) => ({ ...f, anguloGrados: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm"
                />
              </>
            ) : (
              <>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="X (m, + = derecha)"
                  value={form.x}
                  onChange={(e) => setForm((f) => ({ ...f, x: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Y (m, + = arriba)"
                  value={form.y}
                  onChange={(e) => setForm((f) => ({ ...f, y: e.target.value }))}
                  className="rounded border border-zinc-300 px-3 py-2 text-sm"
                />
              </>
            )}

            <input
              required
              type="number"
              step="0.1"
              placeholder="Altura de montaje (m)"
              value={form.altura}
              onChange={(e) => setForm((f) => ({ ...f, altura: e.target.value }))}
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />

            <select
              required
              value={form.modeloArmadoId}
              onChange={(e) => setForm((f) => ({ ...f, modeloArmadoId: e.target.value }))}
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">Modelo de armado...</option>
              {modelos.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.codigo} ({m.cantidadModulos} módulos)
                </option>
              ))}
            </select>

            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.obstruido}
                onChange={(e) => setForm((f) => ({ ...f, obstruido: e.target.checked }))}
              />
              Tuve que apuntar el láser en diagonal por un obstáculo
            </label>

            <button
              type="submit"
              disabled={guardando}
              className="col-span-2 rounded bg-(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-(--accent-hover)] disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Agregar poste"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
