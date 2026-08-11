import { Schema, models, model } from "mongoose";

export interface ICancha {
  cliente: string;
  nombre: string;
  largoX: number; // metros, medida real de la cancha (eje X = largo)
  anchoY: number; // metros, medida real de la cancha (eje Y = ancho)
  fechaRelevamiento: Date;
  notas?: string;
}

const CanchaSchema = new Schema<ICancha>(
  {
    cliente: { type: String, required: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    largoX: { type: Number, required: true, min: 0 },
    anchoY: { type: Number, required: true, min: 0 },
    fechaRelevamiento: { type: Date, required: true, default: Date.now },
    notas: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Cancha = models.Cancha || model<ICancha>("Cancha", CanchaSchema);
