// Server-only helpers for deploying a client's project to Vercel via the REST API.
// The token is read from env and never leaves the server.

const API = "https://api.vercel.com";

function token(): string {
  const t = process.env.VERCEL_TOKEN;
  if (!t) throw new Error("VERCEL_TOKEN is not configured in .env.local");
  return t;
}

function query(extra: Record<string, string> = {}): string {
  const p = new URLSearchParams(extra);
  const team = process.env.VERCEL_TEAM_ID;
  if (team) p.set("teamId", team);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export interface DeployFile {
  file: string; // POSIX relative path, e.g. "src/App.tsx"
  sha: string; // sha1 hex of the file contents
  size: number; // byte length
}

/** Upload one file's bytes to Vercel, addressed by its sha1 digest. */
export async function vercelUploadFile(bytes: Buffer, sha: string): Promise<void> {
  const res = await fetch(`${API}/v2/files${query()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/octet-stream",
      "x-vercel-digest": sha,
    },
    body: new Uint8Array(bytes),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Vercel file upload failed (${res.status}): ${t.slice(0, 300)}`);
  }
}

/** Create a deployment from already-uploaded files; Vercel installs + builds it. */
export async function vercelCreateDeployment(
  name: string,
  files: DeployFile[]
): Promise<{ id: string; url: string }> {
  const res = await fetch(`${API}/v13/deployments${query({ skipAutoDetectionConfirmation: "1" })}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      files,
      projectSettings: { framework: null }, // null → Vercel auto-detects from package.json
      target: "production",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Vercel deploy create failed (${res.status})`);
  }
  return { id: data.id as string, url: data.url as string };
}

/** Poll a deployment's build status. readyState ∈ QUEUED|BUILDING|READY|ERROR|CANCELED. */
export async function vercelGetDeployment(id: string): Promise<{ readyState: string; url: string }> {
  const res = await fetch(`${API}/v13/deployments/${encodeURIComponent(id)}${query()}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Vercel status check failed (${res.status})`);
  }
  return {
    readyState: (data.readyState ?? data.status ?? "QUEUED") as string,
    url: data.url as string,
  };
}

/** Vercel project names must be lowercase [a-z0-9._-], <= 100 chars. */
export function vercelProjectName(slug: string): string {
  return `ges-preview-${slug}`.toLowerCase().replace(/[^a-z0-9._-]/g, "-").slice(0, 100);
}
