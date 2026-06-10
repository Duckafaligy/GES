"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, AlertTriangle, ChevronDown, ChevronUp, Eye } from "lucide-react";

interface DevClient {
  id: string;
  slug: string;
  name: string;
  status: "active" | "disabled";
  preview_ready: boolean;
  expires_at: string | null;
  created_at: string;
  // v2 — optional so the dashboard still renders pre-migration.
  access_code?: string | null;
  view_count?: number;
  first_viewed_at?: string | null;
  last_viewed_at?: string | null;
}

interface ViewAnalytics {
  view_count: number;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  views: string[]; // newest-first ISO timestamps
}

/** Absolute, human date+time for the analytics timeline. */
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

interface PickedFile {
  file: File;
  rel: string;
}

const TOKEN_KEY = "ges_dev_token";

/* ── misc helpers ── */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then) return "";
  const s = Math.floor((Date.now() - then) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30); if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

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
  const [dob, setDob] = useState("");
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
        body: JSON.stringify({ password, dob }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Incorrect password or date of birth."); setLoading(false); return; }
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

        <label className="eyebrow text-[var(--muted)] mb-2 block">Date of Birth</label>
        <input
          type="date"
          value={dob}
          onChange={(e) => { setDob(e.target.value); setError(""); }}
          className="w-full bg-transparent border-2 border-[var(--line)] px-3 py-3 mono text-sm mb-4 focus:outline-none focus:border-[var(--acid)] [color-scheme:dark]"
        />

        {error && <div className="mono text-xs text-red-400 mb-4">{error}</div>}
        <button type="submit" disabled={loading || !password || !dob} className="btn-brut w-full justify-center disabled:opacity-50">
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
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
    setLoadError(null);
    try {
      const res = await api("/api/dev/clients");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Couldn't load clients (HTTP ${res.status}).`);
      setClients(data.clients ?? []);
    } catch (e) { setLoadError((e as Error).message); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { refresh(); }, [refresh]);

  const ok = (msg: string) => { setBanner({ kind: "ok", msg }); refresh(); };
  const err = (msg: string) => setBanner({ kind: "err", msg });
  const showCode = (label: string, code: string) => setReveal({ label, code });

  const live = clients.filter((c) => c.preview_ready).length;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
      )
    : clients;

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
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t-2 border-l-2 border-[var(--line)] mb-9">
          <Stat n={clients.length} label="Clients" />
          <Stat n={live} label="Live previews" />
          <Stat n={clients.filter((c) => (c.view_count ?? 0) > 0).length} label="Viewed by client" />
          <Stat n={clients.reduce((sum, c) => sum + (c.view_count ?? 0), 0)} label="Total views" />
        </div>

        <AddClient api={api} onDone={ok} onErr={err} onReveal={showCode} />
        <UploadPreview clients={clients} api={api} onDone={ok} onErr={err} />

        <section className="mt-10">
          <div className="flex items-center gap-4 mb-4 border-b-2 border-[var(--line)] pb-3">
            <span className="eyebrow">Clients</span>
            {clients.length > 0 && <span className="mono text-[10px] text-[var(--muted)]">{filtered.length}/{clients.length}</span>}
            <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
            <button onClick={refresh} className="eyebrow text-[var(--muted)] hover:text-white">Refresh</button>
          </div>

          {clients.length > 3 && (
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or slug…"
                className="w-full bg-transparent border-2 border-[var(--line)] pl-9 pr-3 py-2.5 mono text-xs focus:outline-none focus:border-[var(--acid)]"
              />
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="hard bg-[#0a0a0a] p-5 flex items-center gap-4">
                  <div className="flex-1 space-y-2.5">
                    <div className="skeleton h-3.5 w-40" />
                    <div className="skeleton h-2.5 w-56" />
                  </div>
                  <div className="skeleton h-7 w-44" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="hard-sm bg-[#0a0a0a] p-6">
              <div className="flex items-center gap-2 text-red-400 mono text-xs font-bold mb-2">
                <AlertTriangle size={14} /> Couldn&apos;t reach the backend
              </div>
              <p className="mono text-[11px] text-[var(--muted)] leading-relaxed mb-1">{loadError}</p>
              <p className="mono text-[11px] text-[var(--muted)] leading-relaxed">
                If this just deployed, make sure <span className="text-white">SUPABASE_URL</span> and{" "}
                <span className="text-white">SUPABASE_SERVICE_ROLE_KEY</span> are set in your environment.
              </p>
              <button onClick={refresh} className="btn-brut mt-4 text-[11px] py-2 px-3">Try again</button>
            </div>
          ) : clients.length === 0 ? (
            <div className="hard-sm bg-[#0a0a0a] p-8 text-center">
              <div className="mono text-sm font-bold mb-1">No clients yet</div>
              <div className="mono text-[11px] text-[var(--muted)]">Add your first client above to mint an access code and a preview URL.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mono text-xs text-[var(--muted)] py-4">No clients match &ldquo;{query}&rdquo;.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c) => (
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
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  // Live preview of the slug the server will use (mirrors its slugify).
  const slugPreview = (slug || name)
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api("/api/dev/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (!res.ok) { onErr(data.error ?? "Failed to add client."); return; }
      setName(""); setSlug("");
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
        <Field label="Custom slug (optional)" value={slug} onChange={setSlug} placeholder="blooms-florist" mono />
        <div className="sm:col-span-2 flex items-center gap-4 flex-wrap">
          <button type="submit" disabled={busy || !name} className="btn-brut disabled:opacity-50">
            {busy ? "Adding…" : "Add Client"}
          </button>
          <span className="mono text-[11px] text-[var(--muted)]">
            Preview URL: <span className="text-[var(--acid)]">/preview/{slugPreview || "…"}</span> · a 64-char code is generated automatically.
          </span>
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

    // Clean replace: a new build should REPLACE the old one, not merge with it
    // (otherwise orphaned files from the previous build linger in storage).
    const target = clients.find((c) => c.slug === slug);
    if (target?.preview_ready &&
        !confirm(`"${slug}" already has an uploaded build. Replace it?\n\nThe old files are removed first, so nothing stale is left behind.`)) {
      return;
    }

    setProgress({ done: 0, total: picked.length });
    try {
      // Wipe the client's existing files before uploading the new build.
      const clr = await api("/api/dev/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!clr.ok) { const d = await clr.json().catch(() => ({})); throw new Error(`Couldn't clear old files: ${d.error ?? clr.status}`); }

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
      onDone(`Uploaded ${picked.length} files to "${slug}" — preview is now live (old build replaced).`);
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
        Must contain an index.html. <span className="text-white">Re-uploading replaces</span> the client&apos;s previous build — old files are cleared first, so nothing stale is left behind.
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
  const [open, setOpen] = useState(false);
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

  const views = c.view_count ?? 0;

  return (
    <div className={`hard bg-[#0a0a0a] p-5 flex flex-col gap-4 ${busy ? "opacity-50" : ""}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-extrabold uppercase tracking-tight">{c.name}</span>
          <Pill on={c.preview_ready} onText="Live" offText="Not finished" />
          {views > 0
            ? <span className="mono text-[10px] uppercase tracking-[0.14em] bg-[var(--acid)] text-[#0a0a0a] px-2 py-0.5 font-bold">Viewed</span>
            : <span className="mono text-[10px] uppercase tracking-[0.14em] border-2 border-[var(--line)] text-[var(--muted)] px-2 py-0.5">Not viewed</span>}
          {c.status === "disabled" && <span className="mono text-[10px] uppercase tracking-[0.14em] border-2 border-red-500/60 text-red-400 px-2 py-0.5">Disabled</span>}
        </div>
        <div className="mono text-[11px] text-[var(--muted)] mt-1.5 flex items-center gap-2 flex-wrap">
          <button onClick={copy} className="ul-link text-[var(--acid)]">{url}</button>
          {copied && <span className="text-[var(--acid)]">copied ✓</span>}
          {c.created_at && (
            <>
              <span className="opacity-40">·</span>
              <span className="opacity-70">added {timeAgo(c.created_at)}</span>
            </>
          )}
          {views > 0 && c.last_viewed_at && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1 text-[var(--acid)]">
                <Eye size={11} /> viewed {timeAgo(c.last_viewed_at)} · {views}×
              </span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 text-[11px] mono [&>button]:text-center">
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
        <button
          onClick={() => setOpen((v) => !v)}
          className="border-2 border-[var(--line)] px-2.5 py-1.5 hover:bg-white/10 inline-flex items-center justify-center gap-1"
        >
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Analytics
        </button>
      </div>
      </div>

      {open && (
        <>
          <AccessCodeRow code={c.access_code} />
          <ClientAnalytics slug={c.slug} api={api} />
        </>
      )}
    </div>
  );
}

/* ── recoverable access code (stored plaintext, revealed on demand) ── */
function AccessCodeRow({ code }: { code?: string | null }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!code) {
    return (
      <div className="border-t-2 border-[var(--line)]/40 pt-4">
        <span className="eyebrow text-[var(--muted)] mb-2 block">Access Code</span>
        <p className="mono text-[11px] text-[var(--muted)] leading-relaxed">
          Not stored for this client. Codes are saved from now on — use{" "}
          <span className="text-white">New code</span> to mint a fresh one that&apos;s recoverable here.
        </p>
      </div>
    );
  }

  function copy() {
    navigator.clipboard?.writeText(code!).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="border-t-2 border-[var(--line)]/40 pt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow text-[var(--muted)]">Access Code</span>
        <div className="flex gap-3 mono text-[11px]">
          <button onClick={() => setShow((v) => !v)} className="text-[var(--muted)] hover:text-white">
            {show ? "Hide" : "Show"}
          </button>
          <button onClick={copy} className="text-[var(--acid)]">{copied ? "Copied ✓" : "Copy"}</button>
        </div>
      </div>
      <div className="border-2 border-[var(--line)] bg-black p-2.5 mono text-[11px] break-all select-all text-white">
        {show ? code : "•".repeat(Math.min(code.length, 48))}
      </div>
    </div>
  );
}

/* ── per-client viewer analytics (read-only) ── */
function ClientAnalytics({
  slug, api,
}: {
  slug: string;
  api: (p: string, o?: RequestInit) => Promise<Response>;
}) {
  const [data, setData] = useState<ViewAnalytics | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const res = await api(`/api/dev/views?slug=${encodeURIComponent(slug)}`);
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Couldn't load analytics (HTTP ${res.status}).`);
      setData(d);
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }, [api, slug]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="border-t-2 border-[var(--line)]/40 pt-4">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow text-[var(--muted)]">Viewer Analytics</span>
        <button onClick={load} className="eyebrow text-[var(--muted)] hover:text-white">Refresh</button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-3 w-40" />
        </div>
      ) : err ? (
        <div className="mono text-[11px] text-red-400">{err}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 border-t-2 border-l-2 border-[var(--line)]/60 mb-4">
            <AnalyticStat n={String(data.view_count)} label="Total opens" />
            <AnalyticStat n={data.first_viewed_at ? fmtDateTime(data.first_viewed_at) : "—"} label="First open" small />
            <AnalyticStat n={data.last_viewed_at ? fmtDateTime(data.last_viewed_at) : "—"} label="Last open" small />
          </div>
          {data.views.length === 0 ? (
            <div className="mono text-[11px] text-[var(--muted)]">
              No opens yet — the client hasn&apos;t entered their access code.
              {data.view_count > 0 && " (Run the v2 analytics migration to log the per-open timeline.)"}
            </div>
          ) : (
            <div>
              <div className="eyebrow text-[var(--muted)] mb-2">Open timeline ({data.views.length})</div>
              <div className="max-h-40 overflow-y-auto border-2 border-[var(--line)]/40 divide-y divide-[var(--line)]/20">
                {data.views.map((t, i) => (
                  <div key={`${t}-${i}`} className="flex items-center gap-2 px-3 py-1.5 mono text-[11px]">
                    <Eye size={11} className="text-[var(--acid)] flex-shrink-0" />
                    <span className="text-white">{fmtDateTime(t)}</span>
                    <span className="text-[var(--muted)] ml-auto">{timeAgo(t)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function AnalyticStat({ n, label, small }: { n: string; label: string; small?: boolean }) {
  return (
    <div className="border-b-2 border-r-2 border-[var(--line)]/60 p-3">
      <div className={`${small ? "text-sm font-bold" : "display text-2xl"} leading-none text-[var(--acid)]`}>{n}</div>
      <div className="eyebrow text-[var(--muted)] mt-1.5">{label}</div>
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
