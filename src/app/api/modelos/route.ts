import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ModeloArmado } from "@/models/ModeloArmado";

export async function GET() {
  await connectDB();
  const modelos = await ModeloArmado.find().sort({ codigo: 1 });
  return NextResponse.json(modelos);
}

// Recibe un array de modelos exportados del ERP y hace upsert por código,
// así reimportar el mismo JSON no duplica registros.
export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();

  if (!Array.isArray(body)) {
    return NextResponse.json(
      { error: "El body debe ser un array de modelos" },
      { status: 400 }
    );
  }

  const resultados = await Promise.all(
    body.map((modelo) =>
      ModeloArmado.findOneAndUpdate({ codigo: modelo.codigo }, modelo, {
        upsert: true,
        new: true,
        runValidators: true,
      })
    )
  );

  return NextResponse.json({ importados: resultados.length, modelos: resultados });
}
