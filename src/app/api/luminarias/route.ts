import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Luminaria } from "@/models/Luminaria";

export async function GET(req: NextRequest) {
  await connectDB();
  const posteId = req.nextUrl.searchParams.get("posteId");
  const filtro = posteId ? { posteId } : {};
  const luminarias = await Luminaria.find(filtro).sort({ indice: 1 });
  return NextResponse.json(luminarias);
}
