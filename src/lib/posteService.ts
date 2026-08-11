import mongoose from "mongoose";
import { connectDB } from "./mongodb";
import { Poste, IPoste } from "@/models/Poste";
import { Luminaria } from "@/models/Luminaria";
import { ModeloArmado } from "@/models/ModeloArmado";

export type NuevoPosteInput = Omit<IPoste, "canchaId" | "modeloArmadoId"> & {
  canchaId: string;
  modeloArmadoId: string;
};

// Crea el Poste y, en la misma transacción, una Luminaria por cada módulo
// que trae el modelo de armado elegido (ej: SYD948-... => 9 luminarias).
// El operario nunca carga luminarias a mano: la cantidad sale del catálogo.
export async function crearPosteConLuminarias(input: NuevoPosteInput) {
  await connectDB();

  const modelo = await ModeloArmado.findById(input.modeloArmadoId);
  if (!modelo) {
    throw new Error(`No existe el modelo de armado ${input.modeloArmadoId}`);
  }

  const session = await mongoose.startSession();
  try {
    let posteCreado;
    await session.withTransaction(async () => {
      const [poste] = await Poste.create([input], { session });
      posteCreado = poste;

      const luminarias = Array.from({ length: modelo.cantidadModulos }, (_, i) => ({
        posteId: poste._id,
        indice: i + 1,
        estado: "activa" as const,
      }));

      await Luminaria.insertMany(luminarias, { session });
    });
    return posteCreado;
  } finally {
    await session.endSession();
  }
}
