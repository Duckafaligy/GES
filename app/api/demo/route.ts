import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug } from "@/lib/templates";
import { signToken, PREVIEW_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Email-gated demo: capture the lead, then reveal the template's live demo.
export async function POST(req: NextRequest) {
  try {
    const { email, slug } = await req.json();
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (typeof slug !== "string" || !slug) {
      return NextResponse.json({ error: "Missing template." }, { status: 400 });
    }

    const found = await getTemplateBySlug(slug);
    if (!found) return NextResponse.json({ error: "Template not found." }, { status: 404 });

    // Capture the lead (best effort — don't block the demo on it).
    try {
      await getSupabaseAdmin().from("demo_leads").insert({ email: email.trim(), template_id: found.template.id });
    } catch { /* ignore */ }

    const t = found.template;
    if (t.demo_deploy_url) return NextResponse.json({ url: t.demo_deploy_url });
    if (t.demo_ready) {
      const token = signToken("demo", t.slug, PREVIEW_TTL_MS);
      return NextResponse.json({ url: `/template-demo/${token}` });
    }
    return NextResponse.json({ message: "Live demo coming soon — we'll email you when it's ready." });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
