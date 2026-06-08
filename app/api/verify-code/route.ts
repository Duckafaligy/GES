import { NextRequest, NextResponse } from "next/server";
import { findClientByCode } from "@/lib/clients";
import { signToken, PREVIEW_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code: string = body?.code ?? "";
    const business: string = typeof body?.business === "string" ? body.business.trim() : "";

    if (!code || typeof code !== "string" || code.trim().length < 4) {
      return NextResponse.json({ error: "Please enter a valid access code." }, { status: 400 });
    }

    const client = await findClientByCode(code);
    if (!client) {
      return NextResponse.json(
        { error: "Invalid access code. Please check and try again." },
        { status: 401 }
      );
    }
    // When entered on a specific business preview page, the code must match it.
    if (business && client.slug !== business) {
      return NextResponse.json({ error: "That code isn't for this preview." }, { status: 401 });
    }

    // No cookie — a short-lived token is held in sessionStorage by the page.
    const token = signToken("preview", client.slug, PREVIEW_TTL_MS);
    return NextResponse.json({ token, name: client.name, slug: client.slug });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
