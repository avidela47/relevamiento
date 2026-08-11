import { Schema, models, model, Types } from "mongoose";

export interface IPoste {
  canchaId: Types.ObjectId;
  x: number; // metros desde el centro de la cancha (positivo = derecha)
  y: number; // metros desde el centro de la cancha (positivo = arriba)
  anguloRad: number; // ángulo original del tap, guardado para poder recalcular x/y si cambia el método
  distanciaCentro: number; // metros, dato crudo del láser
  altura: number; // metros, altura de montaje (compartida por todas las luminarias del poste)
  modeloArmadoId: Types.ObjectId;
  obstruido: boolean; // true si el operario tuvo que apuntar el láser en diagonal por un obstáculo
}

const PosteSchema = new Schema<IPoste>(
  {
    canchaId: { type: Schema.Types.ObjectId, ref: "Cancha", required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    anguloRad: { type: Number, required: true },
    distanciaCentro: { type: Number, required: true, min: 0 },
    altura: { type: Number, required: true, min: 0 },
    modeloArmadoId: { type: Schema.Types.ObjectId, ref: "ModeloArmado", required: true },
    obstruido: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PosteSchema.index({ canchaId: 1 });

export const Poste = models.Poste || model<IPoste>("Poste", PosteSchema);
