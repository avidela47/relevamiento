import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Luminaria, EstadoLuminaria } from "@/models/Luminaria";

const ESTADOS_VALIDOS: EstadoLuminaria[] = ["activa", "service", "baja"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const { estado } = body;

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json(
      { error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}` },
      { status: 400 }
    );
  }

  const update: { estado: EstadoLuminaria; fechaService?: Date } = { estado };
  if (estado === "service") {
    update.fechaService = new Date();
  }

  const luminaria = await Luminaria.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });

  if (!luminaria) {
    return NextResponse.json({ error: "Luminaria no encontrada" }, { status: 404 });
  }
  return NextResponse.json(luminaria);
}
