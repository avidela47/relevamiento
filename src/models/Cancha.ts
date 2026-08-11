import { Schema, models, model } from "mongoose";

export type TipoCancha = "futbol" | "tenis" | "padel" | "otra";

export interface ICancha {
  cliente: string;
  nombre: string;
  tipo: TipoCancha;
  largoX: number; // metros, medida real de la cancha (eje X)
  anchoY: number; // metros, medida real de la cancha (eje Y)
  escudoUrl?: string;
  fechaRelevamiento: Date;
  notas?: string;
}

const CanchaSchema = new Schema<ICancha>(
  {
    cliente: { type: String, required: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      enum: ["futbol", "tenis", "padel", "otra"],
      required: true,
      default: "futbol",
    },
    largoX: { type: Number, required: true, min: 0 },
    anchoY: { type: Number, required: true, min: 0 },
    escudoUrl: { type: String, trim: true },
    fechaRelevamiento: { type: Date, required: true, default: Date.now },
    notas: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Cancha = models.Cancha || model<ICancha>("Cancha", CanchaSchema);
