import { readFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

export interface ClientPreview {
  tagline: string;
  description: string;
  theme: string;
  accentColor: string;
  bgColor: string;
  heroImage: string;
  pages: string[];
  features: string[];
  pricing: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  hash: string;
  preview: ClientPreview;
}

function loadClients(): Client[] {
  const path = join(process.cwd(), "data", "clients.json");
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw).clients as Client[];
}

export function findClientByCode(code: string): Client | null {
  const hash = createHash("sha256").update(code.trim()).digest("hex");
  const clients = loadClients();
  return clients.find((c) => c.hash === hash) ?? null;
}

export function findClientById(id: string): Client | null {
  const clients = loadClients();
  return clients.find((c) => c.id === id) ?? null;
}
