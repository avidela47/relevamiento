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

  const { cliente, nombre, anchoX, largoY, notas } = body;

  if (!cliente || !nombre || !anchoX || !largoY) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios: cliente, nombre, anchoX, largoY" },
      { status: 400 }
    );
  }

  const cancha = await Cancha.create({
    cliente,
    nombre,
    anchoX,
    largoY,
    notas,
    fechaRelevamiento: new Date(),
  });

  return NextResponse.json(cancha, { status: 201 });
}
