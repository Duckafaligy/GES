import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { vercelCreateDeployment, vercelProjectName, type DeployFile } from "@/lib/vercel";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const slug = String(body?.slug ?? "").trim();
    const files = body?.files as DeployFile[] | undefined;

    if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "No files to deploy." }, { status: 400 });
    }
    if (!files.some((f) => f.file === "package.json") && !files.some((f) => f.file === "index.html")) {
      return NextResponse.json(
        { error: "Project needs a package.json (or index.html) at its root." },
        { status: 400 }
      );
    }

    const { id, url } = await vercelCreateDeployment(vercelProjectName(slug), files);
    return NextResponse.json({ id, url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
