import mongoose, { Schema, models, model, Types } from "mongoose";

export type EstadoLuminaria = "activa" | "service" | "baja";

export interface ILuminaria {
  posteId: Types.ObjectId;
  indice: number; // posición dentro del poste, 1..cantidadModulos del modelo
  estado: EstadoLuminaria;
  fechaService?: Date;
}

const LuminariaSchema = new Schema<ILuminaria>(
  {
    posteId: { type: Schema.Types.ObjectId, ref: "Poste", required: true },
    indice: { type: Number, required: true, min: 1 },
    estado: {
      type: String,
      enum: ["activa", "service", "baja"],
      default: "activa",
    },
    fechaService: { type: Date },
  },
  { timestamps: true }
);

LuminariaSchema.index({ posteId: 1 });

export const Luminaria = models.Luminaria || model<ILuminaria>("Luminaria", LuminariaSchema);
