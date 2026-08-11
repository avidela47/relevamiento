import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Poste } from "@/models/Poste";
import { Luminaria } from "@/models/Luminaria";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const poste = await Poste.findById(id).populate("modeloArmadoId");
  if (!poste) {
    return NextResponse.json({ error: "Poste no encontrado" }, { status: 404 });
  }
  return NextResponse.json(poste);
}

// Corrige medición (x, y, altura, etc.). No cambia el modelo de armado ni
// regenera luminarias: para eso hay que borrar el poste y crearlo de nuevo.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const { x, y, anguloRad, distanciaCentro, altura, obstruido } = body;

  const poste = await Poste.findByIdAndUpdate(
    id,
    { x, y, anguloRad, distanciaCentro, altura, obstruido },
    { new: true, runValidators: true }
  ).populate("modeloArmadoId");

  if (!poste) {
    return NextResponse.json({ error: "Poste no encontrado" }, { status: 404 });
  }
  return NextResponse.json(poste);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const poste = await Poste.findById(id);
  if (!poste) {
    return NextResponse.json({ error: "Poste no encontrado" }, { status: 404 });
  }

  const { deletedCount } = await Luminaria.deleteMany({ posteId: id });
  await Poste.findByIdAndDelete(id);

  return NextResponse.json({ eliminado: true, luminariasEliminadas: deletedCount });
}
