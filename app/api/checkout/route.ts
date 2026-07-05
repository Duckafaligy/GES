import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getFormatById } from "@/lib/templates";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// Create a Stripe Checkout Session for a single template format.
export async function POST(req: NextRequest) {
  try {
    const { formatId } = await req.json();
    if (typeof formatId !== "string" || !formatId) {
      return NextResponse.json({ error: "Missing format." }, { status: 400 });
    }

    const found = await getFormatById(formatId);
    if (!found) return NextResponse.json({ error: "Format not found." }, { status: 404 });
    const { format, template } = found;
    if (!format.storage_key) {
      return NextResponse.json({ error: "This format has no file uploaded yet." }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: format.price_cents,
            product_data: { name: `${template.title} — ${format.label}` },
          },
        },
      ],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/templates/${template.slug}`,
      metadata: { format_id: format.id, template_id: template.id, slug: template.slug },
    });

    // Record a pending order (the webhook flips it to paid + captures the email).
    try {
      await getSupabaseAdmin().from("orders").insert({
        template_id: template.id,
        format_id: format.id,
        amount_cents: format.price_cents,
        status: "pending",
        stripe_session_id: session.id,
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
