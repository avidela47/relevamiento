"use client";

import { useEffect, useState } from "react";

type Modelo = {
  _id: string;
  codigo: string;
  marca: string;
  tipo: string;
  cantidadModulos: number;
  lentesPorModulo: number;
  anguloLente: number;
  potenciaW: number;
  temperaturaColorK: number;
};

export default function ModelosPage() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    codigo: "",
    marca: "",
    tipo: "",
    cantidadModulos: "",
    lentesPorModulo: "",
    anguloLente: "",
    potenciaW: "",
    temperaturaColorK: "",
  });

  function setField(campo: keyof typeof form, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function cargarModelos() {
    setCargando(true);
    try {
      const res = await fetch("/api/modelos");
      if (!res.ok) throw new Error("No se pudieron cargar los modelos");
      setModelos(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos, patrón intencional
    cargarModelos();
  }, []);

  async function crearModelo(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/modelos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            codigo: form.codigo,
            marca: form.marca,
            tipo: form.tipo,
            cantidadModulos: Number(form.cantidadModulos),
            lentesPorModulo: Number(form.lentesPorModulo),
            anguloLente: Number(form.anguloLente),
            potenciaW: Number(form.potenciaW),
            temperaturaColorK: Number(form.temperaturaColorK),
          },
        ]),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo crear el modelo");
      }
      setForm({
        codigo: "",
        marca: "",
        tipo: "",
        cantidadModulos: "",
        lentesPorModulo: "",
        anguloLente: "",
        potenciaW: "",
        temperaturaColorK: "",
      });
      await cargarModelos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-xl font-semibold mb-4">Catálogo de modelos de armado</h1>
        {error && (
          <p className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {cargando ? (
          <p className="text-sm text-zinc-500">Cargando...</p>
        ) : modelos.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Todavía no hay modelos. Cargá al menos uno para poder agregar postes.
          </p>
        ) : (
          <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Marca</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Módulos</th>
                  <th className="px-3 py-2">Lentes/módulo</th>
                  <th className="px-3 py-2">Ángulo</th>
                  <th className="px-3 py-2">Potencia (W)</th>
                  <th className="px-3 py-2">Temp. color (K)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {modelos.map((m) => (
                  <tr key={m._id}>
                    <td className="px-3 py-2 font-medium">{m.codigo}</td>
                    <td className="px-3 py-2">{m.marca}</td>
                    <td className="px-3 py-2">{m.tipo}</td>
                    <td className="px-3 py-2">{m.cantidadModulos}</td>
                    <td className="px-3 py-2">{m.lentesPorModulo}</td>
                    <td className="px-3 py-2">{m.anguloLente}°</td>
                    <td className="px-3 py-2">{m.potenciaW}</td>
                    <td className="px-3 py-2">{m.temperaturaColorK}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Nuevo modelo</h2>
        <form onSubmit={crearModelo} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            required
            placeholder="Código (ej: SYD948-100-1200-3)"
            value={form.codigo}
            onChange={(e) => setField("codigo", e.target.value)}
            className="col-span-2 rounded border border-zinc-300 px-3 py-2 text-sm sm:col-span-4"
          />
          <input
            required
            placeholder="Marca"
            value={form.marca}
            onChange={(e) => setField("marca", e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Tipo (deportivo/común)"
            value={form.tipo}
            onChange={(e) => setField("tipo", e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            placeholder="Cant. módulos"
            value={form.cantidadModulos}
            onChange={(e) => setField("cantidadModulos", e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            placeholder="Lentes por módulo"
            value={form.lentesPorModulo}
            onChange={(e) => setField("lentesPorModulo", e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            placeholder="Ángulo lente (°)"
            value={form.anguloLente}
            onChange={(e) => setField("anguloLente", e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            placeholder="Potencia (W)"
            value={form.potenciaW}
            onChange={(e) => setField("potenciaW", e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="number"
            placeholder="Temp. color (K)"
            value={form.temperaturaColorK}
            onChange={(e) => setField("temperaturaColorK", e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={guardando}
            className="col-span-2 rounded bg-(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-(--accent-hover)] disabled:opacity-50 sm:col-span-4"
          >
            {guardando ? "Guardando..." : "Agregar modelo"}
          </button>
        </form>
      </section>
    </div>
  );
}
