import { NextRequest, NextResponse } from "next/server";
import { crearPosteConLuminarias } from "@/lib/posteService";
import { connectDB } from "@/lib/mongodb";
import { Poste } from "@/models/Poste";

export async function GET(req: NextRequest) {
  await connectDB();
  const canchaId = req.nextUrl.searchParams.get("canchaId");
  const filtro = canchaId ? { canchaId } : {};
  const postes = await Poste.find(filtro).populate("modeloArmadoId");
  return NextResponse.json(postes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { canchaId, x, y, anguloRad, distanciaCentro, altura, modeloArmadoId, obstruido } = body;

  if (
    !canchaId ||
    x === undefined ||
    y === undefined ||
    distanciaCentro === undefined ||
    altura === undefined ||
    !modeloArmadoId
  ) {
    return NextResponse.json(
      {
        error:
          "Faltan campos obligatorios: canchaId, x, y, distanciaCentro, altura, modeloArmadoId",
      },
      { status: 400 }
    );
  }

  try {
    const poste = await crearPosteConLuminarias({
      canchaId,
      x,
      y,
      anguloRad: anguloRad ?? 0,
      distanciaCentro,
      altura,
      modeloArmadoId,
      obstruido: !!obstruido,
    });
    return NextResponse.json(poste, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear el poste";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
