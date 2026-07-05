import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getFormatById, TEMPLATE_BUCKET } from "@/lib/templates";

export const runtime = "nodejs";

// Verifies a Stripe Checkout session is paid, then returns a short-lived signed
// download URL for the purchased format. (Works immediately, even before the webhook.)
export async function GET(req: NextRequest) {
  try {
    const sessionId = new URL(req.url).searchParams.get("session_id") ?? "";
    if (!sessionId) return NextResponse.json({ error: "Missing session." }, { status: 400 });

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed yet." }, { status: 402 });
    }

    const formatId = (session.metadata?.format_id as string) ?? "";
    const found = await getFormatById(formatId);
    if (!found || !found.format.storage_key) {
      return NextResponse.json({ error: "File unavailable." }, { status: 404 });
    }

    const { data, error } = await getSupabaseAdmin()
      .storage.from(TEMPLATE_BUCKET)
      .createSignedUrl(found.format.storage_key, 600);
    if (error || !data) return NextResponse.json({ error: "Could not create a download link." }, { status: 500 });

    return NextResponse.json({ url: data.signedUrl, label: found.format.label, title: found.template.title });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
