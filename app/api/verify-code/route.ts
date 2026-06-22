import { NextRequest, NextResponse } from "next/server";
import { findClientByCode, recordPreviewView } from "@/lib/clients";
import { signToken, PREVIEW_TTL_MS } from "@/lib/session";
import { checkLock, registerFailure, registerSuccess, clientIp } from "@/lib/throttle";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const lock = await checkLock("verify-code", ip);
    if (lock.locked) {
      return NextResponse.json({ error: lock.message }, {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(lock.retryAfterMs / 1000)) },
      });
    }

    const body = await req.json();
    const code: string = body?.code ?? "";
    const business: string = typeof body?.business === "string" ? body.business.trim() : "";

    if (!code || typeof code !== "string" || code.trim().length < 4) {
      return NextResponse.json({ error: "Please enter a valid access code." }, { status: 400 });
    }

    const client = await findClientByCode(code);
    if (!client) {
      const after = await registerFailure("verify-code", ip);
      return NextResponse.json(
        { error: after.locked ? after.message : "Sorry — this code is invalid, inactive, or has expired. Please double-check it, or contact us for a fresh link." },
        { status: after.locked ? 429 : 401,
          ...(after.locked ? { headers: { "Retry-After": String(Math.ceil(after.retryAfterMs / 1000)) } } : {}) }
      );
    }
    // When entered on a specific business preview page, the code must match it.
    if (business && client.slug !== business) {
      const after = await registerFailure("verify-code", ip);
      return NextResponse.json(
        { error: after.locked ? after.message : "That code isn't for this preview." },
        { status: after.locked ? 429 : 401,
          ...(after.locked ? { headers: { "Retry-After": String(Math.ceil(after.retryAfterMs / 1000)) } } : {}) }
      );
    }

    await registerSuccess("verify-code", ip);
    // Sales signal: the prospect actually opened their preview. Best-effort.
    await recordPreviewView(client);

    // Valid code, but the build hasn't been published yet — tell them it's
    // coming instead of handing back a token to an empty preview.
    if (!client.preview_ready) {
      return NextResponse.json({ pending: true, name: client.name, slug: client.slug });
    }

    // No cookie — a short-lived token is held in sessionStorage by the page.
    const token = signToken("preview", client.slug, PREVIEW_TTL_MS);
    return NextResponse.json({ token, name: client.name, slug: client.slug });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
