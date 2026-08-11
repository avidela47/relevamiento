"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Cancha = {
  _id: string;
  cliente: string;
  nombre: string;
  tipo: "futbol" | "tenis" | "padel" | "otra";
  largoX: number;
  anchoY: number;
  escudoUrl?: string;
  fechaRelevamiento: string;
  notas?: string;
};

const ETIQUETA_TIPO: Record<Cancha["tipo"], string> = {
  futbol: "Fútbol",
  tenis: "Tenis",
  padel: "Pádel",
  otra: "Otra",
};

export default function Home() {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState<string | null>(null);

  const [cliente, setCliente] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<Cancha["tipo"]>("futbol");
  const [largoX, setLargoX] = useState("");
  const [anchoY, setAnchoY] = useState("");
  const [escudoUrl, setEscudoUrl] = useState("");
  const [subiendoEscudo, setSubiendoEscudo] = useState(false);

  function elegirEscudo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) {
      setError("El escudo es muy pesado (máx. 1MB). Usá una imagen más chica.");
      return;
    }
    setSubiendoEscudo(true);
    const reader = new FileReader();
    reader.onload = () => {
      setEscudoUrl(reader.result as string);
      setSubiendoEscudo(false);
    };
    reader.onerror = () => {
      setError("No se pudo leer la imagen.");
      setSubiendoEscudo(false);
    };
    reader.readAsDataURL(file);
  }
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargarCanchas() {
    setCargando(true);
    try {
      const res = await fetch("/api/canchas");
      if (!res.ok) throw new Error("No se pudieron cargar los estadios");
      setCanchas(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos, patrón intencional
    cargarCanchas();
  }, []);

  async function crearCancha(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/canchas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          nombre,
          tipo,
          largoX: Number(largoX),
          anchoY: Number(anchoY),
          escudoUrl: escudoUrl || undefined,
          notas: notas || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo crear el estadio");
      }
      setCliente("");
      setNombre("");
      setTipo("futbol");
      setLargoX("");
      setAnchoY("");
      setEscudoUrl("");
      setNotas("");
      setMostrarForm(false);
      await cargarCanchas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGuardando(false);
    }
  }

  async function borrarCancha(id: string) {
    await fetch(`/api/canchas/${id}`, { method: "DELETE" });
    setConfirmarBorrado(null);
    await cargarCanchas();
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold uppercase">Estadios relevados</h1>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="rounded bg-(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--accent-hover)]"
          >
            {mostrarForm ? "Cancelar" : "+ Nuevo estadio"}
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {mostrarForm && (
          <form
            onSubmit={crearCancha}
            className="mb-4 grid grid-cols-1 gap-3 rounded border border-zinc-200 bg-white p-4 sm:grid-cols-2"
          >
            <input
              required
              placeholder="Cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Nombre del estadio"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Cancha["tipo"])}
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="futbol">Fútbol (con marcas reglamentarias)</option>
              <option value="tenis">Tenis</option>
              <option value="padel">Pádel</option>
              <option value="otra">Otra</option>
            </select>
            <div className="flex items-center gap-3 rounded border border-zinc-300 px-3 py-2 text-sm">
              {escudoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={escudoUrl} alt="" className="h-8 w-8 rounded object-contain" />
              ) : (
                <div className="h-8 w-8 rounded bg-zinc-100" />
              )}
              <label className="flex-1 cursor-pointer text-zinc-600">
                {subiendoEscudo ? "Cargando..." : "Escudo del club (opcional)"}
                <input type="file" accept="image/*" onChange={elegirEscudo} className="hidden" />
              </label>
            </div>
            <input
              required
              type="number"
              step="0.01"
              placeholder="Largo X (m)"
              value={largoX}
              onChange={(e) => setLargoX(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="number"
              step="0.01"
              placeholder="Ancho Y (m)"
              value={anchoY}
              onChange={(e) => setAnchoY(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="Notas (opcional)"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <button
              type="submit"
              disabled={guardando}
              className="rounded bg-(--accent)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-(--accent-hover)] disabled:opacity-50 sm:col-span-2"
            >
              {guardando ? "Guardando..." : "Crear estadio"}
            </button>
          </form>
        )}

        {cargando ? (
          <p className="text-sm text-zinc-500">Cargando...</p>
        ) : canchas.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no hay estadios cargados.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
            {canchas.map((c) => (
              <li key={c._id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50">
                {c.escudoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.escudoUrl} alt="" className="h-8 w-8 rounded object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded bg-zinc-100" />
                )}
                <Link href={`/canchas/${c._id}`} className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-sm text-zinc-500">
                      {c.cliente} · {ETIQUETA_TIPO[c.tipo] ?? "Fútbol"}
                    </p>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {c.largoX} x {c.anchoY} m
                  </p>
                </Link>

                {confirmarBorrado === c._id ? (
                  <div className="flex items-center gap-2 rounded bg-red-50 px-2 py-1 text-xs">
                    <span className="text-red-700">¿Borrar &quot;{c.nombre}&quot;?</span>
                    <button
                      onClick={() => borrarCancha(c._id)}
                      className="rounded bg-red-600 px-2 py-1 font-medium text-white hover:bg-red-700"
                    >
                      Sí, borrar
                    </button>
                    <button
                      onClick={() => setConfirmarBorrado(null)}
                      className="rounded px-2 py-1 text-zinc-600 hover:bg-zinc-100"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmarBorrado(c._id)}
                    className="rounded bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20"
                  >
                    Borrar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
