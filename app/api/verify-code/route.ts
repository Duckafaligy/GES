import { NextRequest, NextResponse } from "next/server";
import { findClientByCode } from "@/lib/clients";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code: string = body?.code ?? "";

    if (!code || typeof code !== "string" || code.trim().length < 4) {
      return NextResponse.json({ error: "Please enter a valid access code." }, { status: 400 });
    }

    const client = findClientByCode(code);

    if (!client) {
      return NextResponse.json({ error: "Invalid access code. Please check and try again." }, { status: 401 });
    }

    return NextResponse.json({
      clientId: client.id,
      name: client.name,
      industry: client.industry,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
