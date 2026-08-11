"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Cancha = {
  _id: string;
  cliente: string;
  nombre: string;
  anchoX: number;
  largoY: number;
  fechaRelevamiento: string;
  notas?: string;
};

export default function Home() {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cliente, setCliente] = useState("");
  const [nombre, setNombre] = useState("");
  const [anchoX, setAnchoX] = useState("");
  const [largoY, setLargoY] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargarCanchas() {
    setCargando(true);
    try {
      const res = await fetch("/api/canchas");
      if (!res.ok) throw new Error("No se pudieron cargar las canchas");
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
          anchoX: Number(anchoX),
          largoY: Number(largoY),
          notas: notas || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo crear la cancha");
      }
      setCliente("");
      setNombre("");
      setAnchoX("");
      setLargoY("");
      setNotas("");
      await cargarCanchas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-xl font-semibold mb-4">Canchas relevadas</h1>
        {error && (
          <p className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {cargando ? (
          <p className="text-sm text-zinc-500">Cargando...</p>
        ) : canchas.length === 0 ? (
          <p className="text-sm text-zinc-500">Todavía no hay canchas cargadas.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
            {canchas.map((c) => (
              <li key={c._id}>
                <Link
                  href={`/canchas/${c._id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-sm text-zinc-500">{c.cliente}</p>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {c.anchoX} x {c.largoY} m
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Nueva cancha</h2>
        <form onSubmit={crearCancha} className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Nombre de la cancha"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            step="0.01"
            placeholder="Ancho X (m)"
            value={anchoX}
            onChange={(e) => setAnchoX(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            step="0.01"
            placeholder="Largo Y (m)"
            value={largoY}
            onChange={(e) => setLargoY(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Notas (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="col-span-2 rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={guardando}
            className="col-span-2 rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Crear cancha"}
          </button>
        </form>
      </section>
    </div>
  );
}
