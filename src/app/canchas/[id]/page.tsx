"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Cancha = {
  _id: string;
  cliente: string;
  nombre: string;
  anchoX: number;
  largoY: number;
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
function aSvg(x: number, y: number, anchoX: number, largoY: number, w: number, h: number) {
  const px = (x / anchoX + 0.5) * w;
  const py = (0.5 - y / largoY) * h;
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

  const W = 400;
  const H = (cancha.largoY / cancha.anchoX) * W;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Canchas
        </Link>
        <h1 className="mt-1 text-xl font-semibold">{cancha.nombre}</h1>
        <p className="text-sm text-zinc-500">
          {cancha.cliente} — {cancha.anchoX} x {cancha.largoY} m
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
          className="w-full max-w-md rounded border border-zinc-200 bg-green-50"
        >
          <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke="#86efac" strokeWidth={2} />
          <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="#d4d4d8" strokeDasharray="4" />
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#d4d4d8" strokeDasharray="4" />
          <circle cx={W / 2} cy={H / 2} r={3} fill="#18181b" />
          {postes.map((p) => {
            const { px, py } = aSvg(p.x, p.y, cancha.anchoX, cancha.largoY, W, H);
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
        <p className="mt-2 text-xs text-zinc-500">
          Punto negro = centro de la cancha. Naranja = poste marcado como obstruido.
        </p>
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
          <form onSubmit={crearPoste} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex gap-4 text-sm">
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
              className="col-span-2 rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Agregar poste"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
