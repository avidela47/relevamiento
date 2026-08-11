import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Cancha } from "@/models/Cancha";
import { Poste } from "@/models/Poste";
import { Luminaria } from "@/models/Luminaria";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const cancha = await Cancha.findById(id);
  if (!cancha) {
    return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });
  }
  return NextResponse.json(cancha);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const { cliente, nombre, anchoX, largoY, notas } = body;

  const cancha = await Cancha.findByIdAndUpdate(
    id,
    { cliente, nombre, anchoX, largoY, notas },
    { new: true, runValidators: true }
  );

  if (!cancha) {
    return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });
  }
  return NextResponse.json(cancha);
}

// Borra la cancha y en cascada todos sus postes y las luminarias de esos postes.
// Sin esto quedan postes/luminarias huérfanos apuntando a un canchaId inexistente.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  const cancha = await Cancha.findById(id);
  if (!cancha) {
    return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });
  }

  const postes = await Poste.find({ canchaId: id }).select("_id");
  const posteIds = postes.map((p) => p._id);

  await Luminaria.deleteMany({ posteId: { $in: posteIds } });
  await Poste.deleteMany({ canchaId: id });
  await Cancha.findByIdAndDelete(id);

  return NextResponse.json({
    eliminado: true,
    postesEliminados: posteIds.length,
  });
}
