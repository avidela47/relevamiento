import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Cancha } from "@/models/Cancha";

export async function GET() {
  await connectDB();
  const canchas = await Cancha.find().sort({ createdAt: -1 });
  return NextResponse.json(canchas);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();

  const { cliente, nombre, tipo, largoX, anchoY, escudoUrl, notas } = body;

  if (!cliente || !nombre || largoX === undefined || anchoY === undefined) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios: cliente, nombre, largoX, anchoY" },
      { status: 400 }
    );
  }

  const cancha = await Cancha.create({
    cliente,
    nombre,
    tipo: tipo || "futbol",
    largoX,
    anchoY,
    escudoUrl: escudoUrl || undefined,
    notas,
    fechaRelevamiento: new Date(),
  });

  return NextResponse.json(cancha, { status: 201 });
}
