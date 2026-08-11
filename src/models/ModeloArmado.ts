import mongoose, { Schema, models, model } from "mongoose";

// Catálogo de modelos de armados LED, ej: "SYD948-100-1200-3"
// SY = marca (Synergia), D = tipo (deportivo) / P = común,
// 948 = 9 módulos de 48 lentes, 100 = ángulo del lente (grados),
// 1200 = potencia (watts), 3 = temperatura de color (3000K)
export interface IModeloArmado {
  codigo: string;
  marca: string;
  tipo: string;
  cantidadModulos: number;
  lentesPorModulo: number;
  anguloLente: number;
  potenciaW: number;
  temperaturaColorK: number;
}

const ModeloArmadoSchema = new Schema<IModeloArmado>(
  {
    codigo: { type: String, required: true, unique: true, trim: true },
    marca: { type: String, required: true, trim: true },
    tipo: { type: String, required: true, trim: true },
    cantidadModulos: { type: Number, required: true, min: 1 },
    lentesPorModulo: { type: Number, required: true, min: 1 },
    anguloLente: { type: Number, required: true },
    potenciaW: { type: Number, required: true },
    temperaturaColorK: { type: Number, required: true },
  },
  { timestamps: true }
);

// Evita re-registrar el modelo en hot-reload de desarrollo
export const ModeloArmado =
  models.ModeloArmado || model<IModeloArmado>("ModeloArmado", ModeloArmadoSchema);
