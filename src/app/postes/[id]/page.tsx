"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Modelo = { _id: string; codigo: string; cantidadModulos: number };

type Poste = {
  _id: string;
  canchaId: string;
  x: number;
  y: number;
  altura: number;
  distanciaCentro: number;
  obstruido: boolean;
  modeloArmadoId: Modelo;
};

type EstadoLuminaria = "activa" | "service" | "baja";

type Luminaria = {
  _id: string;
  indice: number;
  estado: EstadoLuminaria;
  fechaService?: string;
};

const COLOR_ESTADO: Record<EstadoLuminaria, string> = {
  activa: "bg-green-100 text-green-800 border-green-300",
  service: "bg-amber-100 text-amber-800 border-amber-300",
  baja: "bg-zinc-200 text-zinc-600 border-zinc-300",
};

export default function PosteDetalle() {
  const params = useParams<{ id: string }>();
  const posteId = params.id;

  const [poste, setPoste] = useState<Poste | null>(null);
  const [luminarias, setLuminarias] = useState<Luminaria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [rPoste, rLum] = await Promise.all([
        fetch(`/api/postes/${posteId}`),
        fetch(`/api/luminarias?posteId=${posteId}`),
      ]);
      if (!rPoste.ok) throw new Error("No se encontró el poste");
      setPoste(await rPoste.json());
      setLuminarias(await rLum.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, [posteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos, patrón intencional
    cargar();
  }, [cargar]);

  async function cambiarEstado(luminariaId: string, estado: EstadoLuminaria) {
    await fetch(`/api/luminarias/${luminariaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    await cargar();
  }

  if (cargando) return <p className="text-sm text-zinc-500">Cargando...</p>;
  if (error || !poste)
    return (
      <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error || "Poste no encontrado"}
      </p>
    );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/canchas/${poste.canchaId}`} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Volver a la cancha
        </Link>
        <h1 className="mt-1 text-xl font-semibold">
          Poste x={poste.x.toFixed(2)} y={poste.y.toFixed(2)}
        </h1>
        <p className="text-sm text-zinc-500">
          Altura {poste.altura} m — {poste.modeloArmadoId?.codigo}
          {poste.obstruido && <span className="ml-2 text-amber-600">(obstruido)</span>}
        </p>
      </div>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Luminarias ({luminarias.length})</h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {luminarias.map((l) => (
            <li
              key={l._id}
              className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${COLOR_ESTADO[l.estado]}`}
            >
              <span>Luminaria #{l.indice}</span>
              <select
                value={l.estado}
                onChange={(e) => cambiarEstado(l._id, e.target.value as EstadoLuminaria)}
                className="rounded border border-white/50 bg-white/70 px-2 py-1 text-xs"
              >
                <option value="activa">Activa</option>
                <option value="service">Service</option>
                <option value="baja">Baja</option>
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
