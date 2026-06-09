"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface DevClient {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  status: "active" | "disabled";
  preview_ready: boolean;
  expires_at: string | null;
  created_at: string;
}

interface PickedFile {
  file: File;
  rel: string;
}

const TOKEN_KEY = "ges_dev_token";

/* ── folder helpers ── */
function stripRoot(p: string): string {
  const i = p.indexOf("/");
  return i >= 0 ? p.slice(i + 1) : p;
}
function isJunk(rel: string): boolean {
  const bad = new Set(["node_modules", ".git", ".next", ".cache", ".vercel", "__MACOSX", "dist-ssr"]);
  const segs = rel.split("/");
  if (segs.some((s) => bad.has(s))) return true;
  const file = segs[segs.length - 1];
  if (!file || file === ".DS_Store" || file === "Thumbs.db" || file === ".env" || file.startsWith(".env.")) return true;
  return false;
}
function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const read = () =>
      reader.readEntries((batch) => {
        if (!batch.length) resolve(all);
        else { all.push(...batch); read(); }
      }, reject);
    read();
  });
}
async function entryToFiles(entry: FileSystemEntry, prefix: string): Promise<PickedFile[]> {
  if (entry.isFile) {
    const fe = entry as FileSystemFileEntry;
    const file = await new Promise<File>((res, rej) => fe.file(res, rej));
    return [{ file, rel: prefix + entry.name }];
  }
  const children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader());
  const out: PickedFile[] = [];
  for (const c of children) out.push(...(await entryToFiles(c, prefix + entry.name + "/")));
  return out;
}
async function filesFromDrop(items: DataTransferItemList): Promise<PickedFile[]> {
  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const e = items[i].webkitGetAsEntry?.();
    if (e) entries.push(e);
  }
  const out: PickedFile[] = [];
  for (const e of entries) {
    if (e.isDirectory) {
      const children = await readAllEntries((e as FileSystemDirectoryEntry).createReader());
      for (const c of children) out.push(...(await entryToFiles(c, "")));
    } else {
      out.push(...(await entryToFiles(e, "")));
    }
  }
  return out;
}

/* ── root ── */
export default function DeveloperDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    setToken(sessionStorage.getItem(TOKEN_KEY));
    setBooted(true);
  }, []);

  const onAuthed = (t: string) => { sessionStorage.setItem(TOKEN_KEY, t); setToken(t); };
  const logout = () => { sessionStorage.removeItem(TOKEN_KEY); setToken(null); };

  if (!booted) return <div className="min-h-screen bg-[#0a0a0a]" />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white sec-dark grid-lines">
      {token ? <Dashboard token={token} onUnauth={logout} /> : <PasswordGate onAuthed={onAuthed} />}
    </div>
  );
}

/* ── password gate ── */
function PasswordGate({ onAuthed }: { onAuthed: (t: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dev/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Incorrect password."); setLoading(false); return; }
      onAuthed(data.token);
    } catch { setError("Network error."); setLoading(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <form onSubmit={submit} className="hard bg-[#0a0a0a] w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 bg-[var(--acid)] text-[#0a0a0a] grid place-items-center font-black text-lg border-2 border-[var(--line)]">G</div>
          <div className="eyebrow text-[var(--muted)] leading-tight">GES<br />Internal</div>
        </div>
        <h1 className="display text-3xl mb-6">Developer<br />Dashboard</h1>
        <label className="eyebrow text-[var(--muted)] mb-2 block">Developer Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          autoFocus
          className="w-full bg-transparent border-2 border-[var(--line)] px-3 py-3 mono text-sm mb-4 focus:outline-none focus:border-[var(--acid)]"
          placeholder="••••••••"
        />
        {error && <div className="mono text-xs text-red-400 mb-4">{error}</div>}
        <button type="submit" disabled={loading || !password} className="btn-brut w-full justify-center disabled:opacity-50">
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

/* ── dashboard ── */
function Dashboard({ token, onUnauth }: { token: string; onUnauth: () => void }) {
  const [clients, setClients] = useState<DevClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [reveal, setReveal] = useState<{ label: string; code: string } | null>(null);

  const api = useCallback(
    async (path: string, opts: RequestInit = {}) => {
      const res = await fetch(path, { ...opts, headers: { ...(opts.headers ?? {}), Authorization: `Bearer ${token}` } });
      if (res.status === 401) { onUnauth(); throw new Error("Session expired — please log in again."); }
      return res;
    },
    [token, onUnauth]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/api/dev/clients");
      const data = await res.json();
      setClients(data.clients ?? []);
    } catch (e) { setBanner({ kind: "err", msg: (e as Error).message }); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { refresh(); }, [refresh]);

  const ok = (msg: string) => { setBanner({ kind: "ok", msg }); refresh(); };
  const err = (msg: string) => setBanner({ kind: "err", msg });
  const showCode = (label: string, code: string) => setReveal({ label, code });

  const live = clients.filter((c) => c.preview_ready).length;

  return (
    <div>
      {reveal && <CodeReveal label={reveal.label} code={reveal.code} onClose={() => setReveal(null)} />}
      {/* top bar */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a] border-b-2 border-[var(--line)]">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--acid)] text-[#0a0a0a] grid place-items-center font-black border-2 border-[var(--line)]">G</div>
            <div>
              <div className="eyebrow text-[var(--muted)]">GES Internal</div>
              <div className="font-extrabold uppercase tracking-tight text-sm leading-none mt-0.5">Developer Dashboard</div>
            </div>
          </div>
          <button onClick={onUnauth} className="btn-ghost text-[11px] py-2 px-3">Log out</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8">
        {banner && (
          <div className={`hard-sm mb-6 px-4 py-3 mono text-xs flex items-start justify-between gap-4 ${banner.kind === "ok" ? "text-[var(--acid)]" : "text-red-400"}`}>
            <span>{banner.msg}</span>
            <button onClick={() => setBanner(null)} className="text-[var(--muted)] hover:text-white">✕</button>
          </div>
        )}

        {/* stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 border-t-2 border-l-2 border-[var(--line)] mb-9">
          <Stat n={clients.length} label="Clients" />
          <Stat n={live} label="Live previews" />
          <Stat n={clients.length - live} label="Awaiting build" />
        </div>

        <AddClient api={api} onDone={ok} onErr={err} onReveal={showCode} />
        <UploadPreview clients={clients} api={api} onDone={ok} onErr={err} />

        <section className="mt-10">
          <div className="flex items-center gap-4 mb-4 border-b-2 border-[var(--line)] pb-3">
            <span className="eyebrow">Clients</span>
            <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
            <button onClick={refresh} className="eyebrow text-[var(--muted)] hover:text-white">Refresh</button>
          </div>
          {loading ? (
            <div className="mono text-xs text-[var(--muted)]">Loading…</div>
          ) : clients.length === 0 ? (
            <div className="mono text-xs text-[var(--muted)]">No clients yet — add one above.</div>
          ) : (
            <div className="space-y-3">
              {clients.map((c) => (
                <ClientCard key={c.id} c={c} api={api} onChange={refresh} onErr={err} onReveal={showCode} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="border-b-2 border-r-2 border-[var(--line)] p-4">
      <div className="display text-3xl leading-none text-[var(--acid)]">{n}</div>
      <div className="eyebrow text-[var(--muted)] mt-2">{label}</div>
    </div>
  );
}

/* ── add client ── */
function AddClient({
  api, onDone, onErr, onReveal,
}: {
  api: (p: string, o?: RequestInit) => Promise<Response>;
  onDone: (m: string) => void;
  onErr: (m: string) => void;
  onReveal: (label: string, code: string) => void;
}) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api("/api/dev/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, industry }),
      });
      const data = await res.json();
      if (!res.ok) { onErr(data.error ?? "Failed to add client."); return; }
      setName(""); setIndustry("");
      if (data.code) onReveal(data.client.name, data.code);
      onDone(`Added "${data.client.name}" → preview URL /preview/${data.client.slug}.`);
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <section className="hard bg-[#0a0a0a] p-6 mb-6">
      <div className="eyebrow text-[var(--muted)] mb-4">Add Client</div>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
        <Field label="Business name *" value={name} onChange={setName} placeholder="Blooms & Co." />
        <Field label="Industry" value={industry} onChange={setIndustry} placeholder="Florist" />
        <div className="sm:col-span-2 flex items-center gap-4 flex-wrap">
          <button type="submit" disabled={busy || !name} className="btn-brut disabled:opacity-50">
            {busy ? "Adding…" : "Add Client"}
          </button>
          <span className="mono text-[11px] text-[var(--muted)]">A 64-char access code is generated automatically and shown once.</span>
        </div>
      </form>
    </section>
  );
}

/* ── upload preview ── */
function UploadPreview({
  clients, api, onDone, onErr,
}: {
  clients: DevClient[];
  api: (p: string, o?: RequestInit) => Promise<Response>;
  onDone: (m: string) => void;
  onErr: (m: string) => void;
}) {
  const [slug, setSlug] = useState("");
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [oversize, setOversize] = useState<string[]>([]);
  const [hasIndex, setHasIndex] = useState(false);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const folderInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = folderInput.current;
    if (el) { el.setAttribute("webkitdirectory", ""); el.setAttribute("directory", ""); }
  }, []);

  function applyPicked(list: PickedFile[]) {
    const kept: PickedFile[] = [];
    let skip = 0;
    for (const p of list) {
      if (!p.rel || isJunk(p.rel)) { skip++; continue; }
      kept.push(p);
    }
    setPicked(kept);
    setSkipped(skip);
    setOversize(kept.filter((k) => k.file.size > 4 * 1024 * 1024).map((k) => k.rel));
    setHasIndex(kept.some((k) => k.rel === "index.html"));
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    applyPicked(files.map((f) => ({ file: f, rel: stripRoot((f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name) })));
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    try {
      applyPicked(await filesFromDrop(e.dataTransfer.items));
    } catch { onErr("Could not read that drop — try the Choose folder button."); }
  }

  async function upload() {
    if (!slug) { onErr("Pick a client to upload to."); return; }
    if (!hasIndex) { onErr("No index.html at the build root — select the built output folder (dist/ or out/)."); return; }
    setProgress({ done: 0, total: picked.length });
    try {
      for (let i = 0; i < picked.length; i++) {
        const { file, rel } = picked[i];
        const fd = new FormData();
        fd.append("slug", slug);
        fd.append("path", rel);
        fd.append("file", file);
        const res = await api("/api/dev/upload", { method: "POST", body: fd });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(`Failed on ${rel}: ${d.error ?? res.status}`); }
        setProgress({ done: i + 1, total: picked.length });
      }
      await api("/api/dev/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, preview_ready: true }),
      });
      onDone(`Uploaded ${picked.length} files to "${slug}" — preview is now live.`);
      setPicked([]); setSkipped(0); setOversize([]); setHasIndex(false);
    } catch (e) { onErr((e as Error).message); }
    finally { setProgress(null); }
  }

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <section className="hard bg-[#0a0a0a] p-6 mb-6">
      <div className="eyebrow text-[var(--muted)] mb-2">Upload Preview Build</div>
      <p className="mono text-[11px] text-[var(--muted)] leading-relaxed mb-4">
        Build the site locally first (<span className="text-white">npm install</span> → <span className="text-white">npm run build</span>),
        then drop the <strong className="text-white">built output</strong> folder here — plain HTML, or
        <span className="text-[var(--acid)]"> dist/</span> /<span className="text-[var(--acid)]"> out/</span>. Don&apos;t upload the
        source project: <span className="text-white">node_modules</span> / .git / .next are skipped automatically and never need uploading.
        Must contain an index.html.
      </p>

      <label className="block mb-3">
        <span className="eyebrow text-[var(--muted)] mb-2 block">Target client</span>
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full bg-[#0a0a0a] border-2 border-[var(--line)] px-3 py-3 mono text-sm focus:outline-none focus:border-[var(--acid)]"
        >
          <option value="">— choose —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.slug}>{c.name} ({c.slug})</option>
          ))}
        </select>
      </label>

      <input ref={folderInput} type="file" multiple onChange={onPick} className="hidden" />
      <div
        onClick={() => folderInput.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed cursor-pointer grid place-items-center text-center py-10 px-4 transition-colors ${drag ? "border-[var(--acid)] bg-[var(--acid)]/10" : "border-[var(--line)]/50 hover:border-[var(--line)]"}`}
      >
        <div>
          <div className="mono text-sm font-bold">{drag ? "Drop the folder…" : "Drop build folder here"}</div>
          <div className="eyebrow text-[var(--muted)] mt-2">or click to choose</div>
        </div>
      </div>

      {picked.length > 0 && (
        <div className="mt-4 mono text-[11px]">
          <div className="text-white">
            {picked.length} files ready{skipped > 0 && <span className="text-[var(--muted)]"> · {skipped} junk skipped</span>}{" "}
            {hasIndex ? <span className="text-[var(--acid)]">· index.html ✓</span> : <span className="text-red-400">· no index.html ✗</span>}
          </div>
          {oversize.length > 0 && (
            <div className="text-amber-400 mt-1">
              ⚠ {oversize.length} file(s) over 4MB may fail on Vercel (per-file upload limit): {oversize.slice(0, 3).join(", ")}{oversize.length > 3 ? "…" : ""}. Compress large media or host it elsewhere.
            </div>
          )}
          <div className="text-[var(--muted)] mt-1 max-h-24 overflow-y-auto border-2 border-[var(--line)]/40 p-2">
            {picked.slice(0, 50).map((p) => <div key={p.rel}>{p.rel}</div>)}
            {picked.length > 50 && <div>…and {picked.length - 50} more</div>}
          </div>

          {progress && (
            <div className="h-3 border-2 border-[var(--line)] mt-3">
              <div className="h-full bg-[var(--acid)] transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}

          <button onClick={upload} disabled={!!progress || !slug || !hasIndex} className="btn-brut mt-4 disabled:opacity-50">
            {progress ? `Uploading ${progress.done}/${progress.total}…` : `Upload to ${slug || "…"}`}
          </button>
        </div>
      )}
    </section>
  );
}

/* ── client card ── */
function ClientCard({
  c, api, onChange, onErr, onReveal,
}: {
  c: DevClient;
  api: (p: string, o?: RequestInit) => Promise<Response>;
  onChange: () => void;
  onErr: (m: string) => void;
  onReveal: (label: string, code: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `/preview/${c.slug}`;

  // Open the live build in a new tab using a dev-minted preview token —
  // no client access code needed.
  async function view() {
    setBusy(true);
    try {
      const res = await api(`/api/dev/preview-token?slug=${encodeURIComponent(c.slug)}`);
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { onErr(d.error ?? "Could not open preview."); return; }
      window.open(`/raw/${d.token}`, "_blank", "noopener,noreferrer");
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  // Fetch the zipped build (Bearer-gated) and save it locally.
  async function download() {
    setBusy(true);
    try {
      const res = await api(`/api/dev/download?slug=${encodeURIComponent(c.slug)}`);
      if (!res.ok) { const d = await res.json().catch(() => ({})); onErr(d.error ?? "Download failed."); return; }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${c.slug}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function regen() {
    if (!confirm(`Generate a new access code for "${c.name}"? The current code stops working immediately.`)) return;
    setBusy(true);
    try {
      const res = await api("/api/dev/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: c.slug, regenerate: true }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { onErr(d.error ?? "Could not regenerate code."); return; }
      if (d.code) onReveal(c.name, d.code);
      onChange();
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await api("/api/dev/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: c.slug, ...payload }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); onErr(d.error ?? "Update failed."); return; }
      onChange();
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm(`Delete "${c.name}" and its uploaded files? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await api("/api/dev/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: c.slug }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); onErr(d.error ?? "Delete failed."); return; }
      onChange();
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  function copy() {
    navigator.clipboard?.writeText(`${location.origin}${url}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={`hard bg-[#0a0a0a] p-5 flex flex-col md:flex-row md:items-center gap-4 ${busy ? "opacity-50" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-extrabold uppercase tracking-tight">{c.name}</span>
          <Pill on={c.preview_ready} onText="Live" offText="Not finished" />
          {c.status === "disabled" && <span className="mono text-[10px] uppercase tracking-[0.14em] border-2 border-red-500/60 text-red-400 px-2 py-0.5">Disabled</span>}
        </div>
        <div className="mono text-[11px] text-[var(--muted)] mt-1.5 flex items-center gap-2 flex-wrap">
          <span>{c.industry || "—"}</span>
          <span className="opacity-40">·</span>
          <button onClick={copy} className="ul-link text-[var(--acid)]">{url}</button>
          {copied && <span className="text-[var(--acid)]">copied ✓</span>}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap text-[11px] mono">
        <button
          onClick={view}
          disabled={!c.preview_ready}
          title={c.preview_ready ? "Open the build in a new tab" : "Upload a build first"}
          className="border-2 border-[var(--acid)] text-[var(--acid)] px-2.5 py-1.5 hover:bg-[var(--acid)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          View
        </button>
        <button
          onClick={download}
          disabled={!c.preview_ready}
          title={c.preview_ready ? "Download the uploaded build as a .zip" : "Upload a build first"}
          className="border-2 border-[var(--line)] px-2.5 py-1.5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Download
        </button>
        <button onClick={regen} className="border-2 border-[var(--line)] px-2.5 py-1.5 hover:bg-white/10">
          New code
        </button>
        <button onClick={() => patch({ preview_ready: !c.preview_ready })} className="border-2 border-[var(--line)] px-2.5 py-1.5 hover:bg-white/10">
          {c.preview_ready ? "Unpublish" : "Publish"}
        </button>
        <button onClick={() => patch({ status: c.status === "active" ? "disabled" : "active" })} className="border-2 border-[var(--line)] px-2.5 py-1.5 hover:bg-white/10">
          {c.status === "active" ? "Disable" : "Enable"}
        </button>
        <button onClick={remove} className="border-2 border-red-500/50 text-red-400 px-2.5 py-1.5 hover:bg-red-500/10">
          Delete
        </button>
      </div>
    </div>
  );
}

function Pill({ on, onText, offText }: { on: boolean; onText: string; offText: string }) {
  return on ? (
    <span className="mono text-[10px] uppercase tracking-[0.14em] bg-[var(--acid)] text-[#0a0a0a] px-2 py-0.5 font-bold">{onText}</span>
  ) : (
    <span className="mono text-[10px] uppercase tracking-[0.14em] border-2 border-[var(--line)] text-[var(--muted)] px-2 py-0.5">{offText}</span>
  );
}

function Field({
  label, value, onChange, placeholder, mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-[var(--muted)] mb-2 block">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent border-2 border-[var(--line)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--acid)] ${mono ? "mono" : ""}`}
      />
    </label>
  );
}

/* ── one-time access-code reveal ── */
function CodeReveal({ label, code, onClose }: { label: string; code: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center px-5" onClick={onClose}>
      <div className="hard bg-[#0a0a0a] w-full max-w-lg p-7" onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow text-[var(--acid)] mb-2">Access code · {label}</div>
        <h2 className="display text-2xl mb-3">Copy this now</h2>
        <p className="mono text-[11px] text-[var(--muted)] leading-relaxed mb-4">
          Shown <span className="text-white">once</span> — only its hash is stored, so it can&apos;t be shown
          again. Send it to the client to unlock their preview. Lost it? Hit{" "}
          <span className="text-white">New code</span> on the client below.
        </p>
        <div className="border-2 border-[var(--line)] bg-black p-3 mono text-[12px] break-all select-all text-white">
          {code}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={copy} className="btn-brut">{copied ? "Copied ✓" : "Copy code"}</button>
          <button onClick={onClose} className="btn-ghost">Done</button>
        </div>
      </div>
    </div>
  );
}
