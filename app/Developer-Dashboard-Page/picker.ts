import JSZip from "jszip";

export interface PickedFile {
  file: File;
  rel: string;
}

export function stripRoot(p: string): string {
  const i = p.indexOf("/");
  return i >= 0 ? p.slice(i + 1) : p;
}

/** Source/tooling junk that should never be uploaded or zipped. */
export function isDevJunk(rel: string): boolean {
  const bad = new Set([
    "node_modules", ".git", ".next", ".vercel", ".cache", "dist", "build", "out",
    "coverage", ".turbo", ".svelte-kit", "__MACOSX", "dist-ssr",
  ]);
  const segs = rel.split("/");
  if (segs.some((s) => bad.has(s))) return true;
  const f = segs[segs.length - 1];
  if (!f || f === ".DS_Store" || f === "Thumbs.db" || f === ".env" || f.startsWith(".env.")) return true;
  return false;
}

function readAll(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const read = () =>
      reader.readEntries((b) => {
        if (!b.length) resolve(all);
        else { all.push(...b); read(); }
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
  const children = await readAll((entry as FileSystemDirectoryEntry).createReader());
  const out: PickedFile[] = [];
  for (const c of children) out.push(...(await entryToFiles(c, prefix + entry.name + "/")));
  return out;
}

/** Files from a drag-drop (strips the dropped root folder name). */
export async function filesFromDrop(items: DataTransferItemList): Promise<PickedFile[]> {
  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const e = items[i].webkitGetAsEntry?.();
    if (e) entries.push(e);
  }
  const out: PickedFile[] = [];
  for (const e of entries) {
    if (e.isDirectory) {
      const ch = await readAll((e as FileSystemDirectoryEntry).createReader());
      for (const c of ch) out.push(...(await entryToFiles(c, "")));
    } else {
      out.push(...(await entryToFiles(e, "")));
    }
  }
  return out;
}

/** Files from a <input webkitdirectory> selection. */
export function filesFromInput(list: FileList | null): PickedFile[] {
  return Array.from(list ?? []).map((f) => ({
    file: f,
    rel: stripRoot((f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name),
  }));
}

/** Zip a folder's files (skipping dev junk) into one Blob. */
export async function zipFiles(files: PickedFile[]): Promise<Blob> {
  const zip = new JSZip();
  let added = 0;
  for (const { file, rel } of files) {
    if (!rel || isDevJunk(rel)) continue;
    zip.file(rel, file);
    added++;
  }
  if (added === 0) throw new Error("Nothing to zip (everything was filtered as junk).");
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
