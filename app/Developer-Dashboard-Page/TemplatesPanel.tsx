"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PickedFile, filesFromDrop, filesFromInput, isDevJunk, zipFiles } from "./picker";

type Api = (p: string, o?: RequestInit) => Promise<Response>;

interface TemplateRow {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  price_cents: number;
  thumbnail_url: string | null;
  demo_ready: boolean;
  demo_deploy_url: string | null;
  status: "draft" | "published";
  created_at: string;
}
interface FormatRow {
  id: string;
  kind: string;
  label: string;
  price_cents: number;
  license: string | null;
  size_bytes: number | null;
}

const toDollars = (c: number) => (c / 100).toFixed(2).replace(/\.00$/, "");
const toCents = (s: string) => Math.max(0, Math.round(parseFloat(s || "0") * 100));
const fmtSize = (b: number | null) => (b ? `${(b / 1024 / 1024).toFixed(2)} MB` : "");
const btn = "border-2 border-[var(--line)] px-2.5 py-1.5 hover:bg-white/10 mono text-[11px]";

export default function TemplatesPanel({ api, onOk, onErr }: { api: Api; onOk: (m: string) => void; onErr: (m: string) => void }) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TemplateRow | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api("/api/dev/templates");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to load templates.");
      setTemplates(d.templates ?? []);
    } catch (e) { onErr((e as Error).message); }
    finally { setLoading(false); }
  }, [api, onErr]);
  useEffect(() => { refresh(); }, [refresh]);

  const ok = (m: string) => { onOk(m); refresh(); };
  const editingLive = editing ? templates.find((t) => t.id === editing.id) ?? editing : null;

  return (
    <div>
      <AddTemplate api={api} onDone={ok} onErr={onErr} />

      <section className="mt-10">
        <div className="flex items-center gap-4 mb-4 border-b-2 border-[var(--line)] pb-3">
          <span className="eyebrow">Templates</span>
          <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
          <button onClick={refresh} className="eyebrow text-[var(--muted)] hover:text-white">Refresh</button>
        </div>

        {loading ? (
          <div className="mono text-xs text-[var(--muted)]">Loading…</div>
        ) : templates.length === 0 ? (
          <div className="mono text-xs text-[var(--muted)]">No templates yet — add one above.</div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <TemplateRowCard key={t.id} t={t} api={api} onEdit={() => setEditing(t)} onOk={ok} onErr={onErr} />
            ))}
          </div>
        )}
      </section>

      {editingLive && (
        <TemplateEditor t={editingLive} api={api} onClose={() => setEditing(null)} onOk={ok} onErr={onErr} />
      )}
    </div>
  );
}

/* ── add template ── */
function AddTemplate({ api, onDone, onErr }: { api: Api; onDone: (m: string) => void; onErr: (m: string) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api("/api/dev/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, price_cents: toCents(price) }),
      });
      const d = await res.json();
      if (!res.ok) { onErr(d.error ?? "Failed to add template."); return; }
      setTitle(""); setCategory(""); setPrice("");
      onDone(`Added "${d.template.title}" (draft). Open it to add a demo, thumbnail and formats.`);
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <section className="hard bg-[#0a0a0a] p-6">
      <div className="eyebrow text-[var(--muted)] mb-4">Add Template</div>
      <form onSubmit={submit} className="grid sm:grid-cols-3 gap-3">
        <LabeledInput label="Title *" value={title} onChange={setTitle} placeholder="Aurora" />
        <LabeledInput label="Category" value={category} onChange={setCategory} placeholder="E-Commerce" />
        <LabeledInput label="Price (USD)" value={price} onChange={setPrice} placeholder="99" mono />
        <div className="sm:col-span-3">
          <button type="submit" disabled={busy || !title} className="btn-brut disabled:opacity-50">
            {busy ? "Adding…" : "Add Template"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ── template row ── */
function TemplateRowCard({ t, api, onEdit, onOk, onErr }: { t: TemplateRow; api: Api; onEdit: () => void; onOk: (m: string) => void; onErr: (m: string) => void }) {
  const [busy, setBusy] = useState(false);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await api("/api/dev/templates", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: t.slug, ...payload }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { onErr(d.error ?? "Update failed."); return; }
      onOk("Updated.");
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!confirm(`Delete "${t.title}" and all its files? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await api("/api/dev/templates", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: t.slug }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { onErr(d.error ?? "Delete failed."); return; }
      onOk("Deleted.");
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className={`hard bg-[#0a0a0a] p-5 flex flex-col md:flex-row gap-5 ${busy ? "opacity-50" : ""}`}>
      <div className="w-44 flex-shrink-0">
        <div className="border-2 border-[var(--line)] bg-[var(--bone)] overflow-hidden" style={{ width: 176, height: 110 }}>
          {t.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.thumbnail_url} alt={t.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center mono text-[10px] text-[var(--muted)] uppercase tracking-[0.14em]">No thumbnail</div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-extrabold uppercase tracking-tight">{t.title}</span>
          <span className={`mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 ${t.status === "published" ? "bg-[var(--acid)] text-[#0a0a0a] font-bold" : "border-2 border-[var(--line)] text-[var(--muted)]"}`}>{t.status}</span>
          {(t.demo_ready || t.demo_deploy_url) && <span className="mono text-[9px] uppercase tracking-[0.14em] border border-[var(--line)]/50 text-[var(--muted)] px-1.5 py-0.5">demo</span>}
        </div>
        <div className="mono text-[11px] text-[var(--muted)] mt-1.5 flex items-center gap-2 flex-wrap">
          <span>{t.category || "—"}</span>
          <span className="opacity-40">·</span>
          <span>${toDollars(t.price_cents)}</span>
          <span className="opacity-40">·</span>
          <a href={`/templates/${t.slug}`} target="_blank" rel="noreferrer" className="ul-link text-[var(--acid)]">/templates/{t.slug} ↗</a>
        </div>
        <div className="flex gap-2 flex-wrap mt-3.5">
          <button onClick={onEdit} className="border-2 border-[var(--acid)] text-[var(--acid)] px-2.5 py-1.5 hover:bg-[var(--acid)] hover:text-black transition-colors mono text-[11px]">Edit / upload</button>
          <button onClick={() => patch({ status: t.status === "published" ? "draft" : "published" })} className={btn}>{t.status === "published" ? "Unpublish" : "Publish"}</button>
          <button onClick={remove} className="border-2 border-red-500/50 text-red-400 px-2.5 py-1.5 hover:bg-red-500/10 mono text-[11px]">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── editor modal ── */
function TemplateEditor({ t, api, onClose, onOk, onErr }: { t: TemplateRow; api: Api; onClose: () => void; onOk: (m: string) => void; onErr: (m: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 grid place-items-start justify-center px-5 py-8 overflow-y-auto" onClick={onClose}>
      <div className="hard bg-[#0a0a0a] w-full max-w-2xl p-7 my-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow text-[var(--acid)] mb-1">Edit template · /templates/{t.slug}</div>
            <h2 className="display text-2xl">{t.title}</h2>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-white text-xl leading-none">✕</button>
        </div>

        <Details t={t} api={api} onOk={onOk} onErr={onErr} />
        <ThumbnailUpload t={t} api={api} onOk={onOk} onErr={onErr} />
        <DemoSetup t={t} api={api} onOk={onOk} onErr={onErr} />
        <FormatsManager t={t} api={api} onOk={onOk} onErr={onErr} />
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="border-2 border-[var(--line)] p-5 mb-4">
      <div className="eyebrow text-[var(--muted)] mb-1">{title}</div>
      {hint && <p className="mono text-[10px] text-[var(--muted)] leading-relaxed mb-3">{hint}</p>}
      {children}
    </div>
  );
}

function Details({ t, api, onOk, onErr }: { t: TemplateRow; api: Api; onOk: (m: string) => void; onErr: (m: string) => void }) {
  const [title, setTitle] = useState(t.title);
  const [category, setCategory] = useState(t.category ?? "");
  const [price, setPrice] = useState(toDollars(t.price_cents));
  const [tagline, setTagline] = useState(t.tagline ?? "");
  const [description, setDescription] = useState(t.description ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await api("/api/dev/templates", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: t.slug, title, category, price_cents: toCents(price), tagline, description }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { onErr(d.error ?? "Save failed."); return; }
      onOk("Details saved.");
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Section title="Details">
      <div className="grid sm:grid-cols-3 gap-3">
        <LabeledInput label="Title" value={title} onChange={setTitle} />
        <LabeledInput label="Category" value={category} onChange={setCategory} />
        <LabeledInput label="Price (USD)" value={price} onChange={setPrice} mono />
      </div>
      <div className="mt-3"><LabeledInput label="Tagline" value={tagline} onChange={setTagline} /></div>
      <label className="block mt-3">
        <span className="eyebrow text-[var(--muted)] mb-2 block">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className="w-full bg-transparent border-2 border-[var(--line)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--acid)]" />
      </label>
      <button onClick={save} disabled={busy} className="btn-brut mt-4 disabled:opacity-50">{busy ? "Saving…" : "Save details"}</button>
    </Section>
  );
}

function ThumbnailUpload({ t, api, onOk, onErr }: { t: TemplateRow; api: Api; onOk: (m: string) => void; onErr: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("slug", t.slug);
      fd.append("file", file);
      const res = await api("/api/dev/templates/thumbnail", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { onErr(d.error ?? "Upload failed."); return; }
      onOk("Thumbnail updated.");
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Section title="Thumbnail" hint="Shown on the storefront card. A 16:10 image works best.">
      <div className="flex items-center gap-4">
        {t.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.thumbnail_url} alt="" className="border-2 border-[var(--line)] object-cover" style={{ width: 128, height: 80 }} />
        ) : (
          <div className="border-2 border-[var(--line)] grid place-items-center mono text-[10px] text-[var(--muted)]" style={{ width: 128, height: 80 }}>none</div>
        )}
        <input ref={input} type="file" accept="image/*" onChange={onPick} className="hidden" />
        <button onClick={() => input.current?.click()} disabled={busy} className={btn}>{busy ? "Uploading…" : "Choose image"}</button>
      </div>
    </Section>
  );
}

function DemoSetup({ t, api, onOk, onErr }: { t: TemplateRow; api: Api; onOk: (m: string) => void; onErr: (m: string) => void }) {
  const [url, setUrl] = useState(t.demo_deploy_url ?? "");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  useEffect(() => { const el = folderInput.current; if (el) { el.setAttribute("webkitdirectory", ""); el.setAttribute("directory", ""); } }, []);

  async function saveUrl() {
    setBusy(true);
    try {
      const res = await api("/api/dev/templates", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: t.slug, demo_deploy_url: url }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { onErr(d.error ?? "Save failed."); return; }
      onOk("Demo URL saved.");
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function uploadDemo(files: PickedFile[]) {
    const kept = files.filter((f) => f.rel && !isDevJunk(f.rel));
    if (!kept.some((k) => k.rel === "index.html")) { onErr("Demo build needs an index.html at its root (use the built output)."); return; }
    setProgress({ done: 0, total: kept.length });
    try {
      for (let i = 0; i < kept.length; i++) {
        const fd = new FormData();
        fd.append("slug", t.slug);
        fd.append("path", kept[i].rel);
        fd.append("file", kept[i].file);
        const res = await api("/api/dev/templates/demo-file", { method: "POST", body: fd });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(`Failed on ${kept[i].rel}: ${e.error ?? res.status}`); }
        setProgress({ done: i + 1, total: kept.length });
      }
      await api("/api/dev/templates", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: t.slug, demo_ready: true }) });
      onOk(`Demo build uploaded (${kept.length} files) — live demo is on.`);
    } catch (e) { onErr((e as Error).message); }
    finally { setProgress(null); }
  }

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <Section title="Live demo" hint="Either upload a built demo (folder with index.html) or point at a Vercel URL.">
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-demo.vercel.app"
          className="flex-1 bg-transparent border-2 border-[var(--line)] px-3 py-2.5 text-sm mono focus:outline-none focus:border-[var(--acid)]" />
        <button onClick={saveUrl} disabled={busy} className={btn}>Save URL</button>
      </div>
      <input ref={folderInput} type="file" multiple onChange={(e) => uploadDemo(filesFromInput(e.target.files))} className="hidden" />
      <div
        onClick={() => folderInput.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => { e.preventDefault(); uploadDemo(await filesFromDrop(e.dataTransfer.items)); }}
        className="border-2 border-dashed border-[var(--line)]/50 hover:border-[var(--line)] cursor-pointer text-center py-6 px-4"
      >
        <div className="mono text-xs font-bold">Drop built demo folder (or click)</div>
        <div className="eyebrow text-[var(--muted)] mt-2">{t.demo_ready ? "demo uploaded ✓ — replace by uploading again" : "needs index.html at root"}</div>
      </div>
      {progress && (
        <div className="h-3 border-2 border-[var(--line)] mt-3"><div className="h-full bg-[var(--acid)] transition-all" style={{ width: `${pct}%` }} /></div>
      )}
    </Section>
  );
}

const FORMAT_KINDS = ["raw", "shopify", "html", "next", "wordpress", "webflow", "other"];

function FormatsManager({ t, api, onOk, onErr }: { t: TemplateRow; api: Api; onOk: (m: string) => void; onErr: (m: string) => void }) {
  const [formats, setFormats] = useState<FormatRow[]>([]);
  const [kind, setKind] = useState("raw");
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [license, setLicense] = useState("");
  const [artifact, setArtifact] = useState<{ blob: Blob; name: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const folderInput = useRef<HTMLInputElement>(null);
  const zipInput = useRef<HTMLInputElement>(null);
  useEffect(() => { const el = folderInput.current; if (el) { el.setAttribute("webkitdirectory", ""); el.setAttribute("directory", ""); } }, []);

  const loadFormats = useCallback(async () => {
    try {
      const res = await api(`/api/dev/templates/format?slug=${encodeURIComponent(t.slug)}`);
      const d = await res.json();
      if (res.ok) setFormats(d.formats ?? []);
    } catch { /* ignore */ }
  }, [api, t.slug]);
  useEffect(() => { loadFormats(); }, [loadFormats]);

  async function pickFolder(files: FileList | null) {
    try {
      const blob = await zipFiles(filesFromInput(files));
      setArtifact({ blob, name: `${kind}.zip`, size: blob.size });
    } catch (e) { onErr((e as Error).message); }
  }
  function pickZip(file: File | undefined) {
    if (file) setArtifact({ blob: file, name: file.name, size: file.size });
  }

  async function addFormat() {
    if (!label) { onErr("Give the format a label."); return; }
    if (!artifact) { onErr("Attach the artifact — a folder (zipped automatically) or a .zip."); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("slug", t.slug);
      fd.append("kind", kind);
      fd.append("label", label);
      fd.append("price_cents", String(toCents(price)));
      fd.append("license", license);
      fd.append("file", artifact.blob, artifact.name);
      const res = await api("/api/dev/templates/format", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { onErr(d.error ?? "Failed to save format."); return; }
      setLabel(""); setPrice(""); setLicense(""); setArtifact(null);
      onOk(`Format "${kind}" saved.`);
      loadFormats();
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function delFormat(id: string) {
    setBusy(true);
    try {
      const res = await api("/api/dev/templates/format", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); onErr(d.error ?? "Delete failed."); return; }
      loadFormats();
    } catch (e) { onErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Section title="Formats (what buyers download)" hint="Add one per delivery type — raw codebase, Shopify (.zip/.liquid/.json), plain HTML, etc. Attach a folder (zipped for you) or a ready .zip.">
      {formats.length > 0 && (
        <div className="space-y-2 mb-4">
          {formats.map((f) => (
            <div key={f.id} className="border-2 border-[var(--line)] p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-extrabold uppercase text-xs tracking-tight">{f.label} <span className="text-[var(--muted)]">· {f.kind}</span></div>
                <div className="mono text-[10px] text-[var(--muted)]">${toDollars(f.price_cents)} {f.size_bytes ? `· ${fmtSize(f.size_bytes)}` : ""} {f.license ? `· ${f.license}` : ""}</div>
              </div>
              <button onClick={() => delFormat(f.id)} disabled={busy} className="border-2 border-red-500/50 text-red-400 px-2 py-1 hover:bg-red-500/10 mono text-[10px]">Delete</button>
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="eyebrow text-[var(--muted)] mb-2 block">Format</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full bg-[#0a0a0a] border-2 border-[var(--line)] px-3 py-2.5 text-sm mono focus:outline-none focus:border-[var(--acid)]">
            {FORMAT_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <LabeledInput label="Price (USD)" value={price} onChange={setPrice} mono />
      </div>
      <div className="mt-3"><LabeledInput label="Label" value={label} onChange={setLabel} placeholder="Raw codebase (Next.js + Tailwind)" /></div>
      <div className="mt-3"><LabeledInput label="License (short)" value={license} onChange={setLicense} placeholder="Single project, modify freely" /></div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <input ref={folderInput} type="file" multiple onChange={(e) => pickFolder(e.target.files)} className="hidden" />
        <input ref={zipInput} type="file" accept=".zip,application/zip" onChange={(e) => pickZip(e.target.files?.[0])} className="hidden" />
        <button onClick={() => folderInput.current?.click()} className={btn}>Choose folder</button>
        <button onClick={() => zipInput.current?.click()} className={btn}>Choose .zip</button>
        {artifact && <span className="mono text-[11px] text-[var(--acid)]">{artifact.name} · {fmtSize(artifact.size)} ready</span>}
      </div>

      <button onClick={addFormat} disabled={busy || !label || !artifact} className="btn-brut mt-4 disabled:opacity-50">
        {busy ? "Saving…" : "Save format"}
      </button>
    </Section>
  );
}

function LabeledInput({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="eyebrow text-[var(--muted)] mb-2 block">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full bg-transparent border-2 border-[var(--line)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--acid)] ${mono ? "mono" : ""}`} />
    </label>
  );
}
