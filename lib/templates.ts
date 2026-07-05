import { getSupabaseAdmin } from "./supabase";

export const TEMPLATE_BUCKET = "templates";
export const THUMB_BUCKET = "template-thumbnails";

export interface Template {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  category: string | null;
  tags: string[];
  price_cents: number;
  thumbnail_url: string | null;
  demo_ready: boolean;
  demo_deploy_url: string | null;
  status: "draft" | "published";
  created_at: string;
}

export interface TemplateFormat {
  id: string;
  template_id: string;
  kind: string;
  label: string;
  price_cents: number;
  license: string | null;
  storage_key: string | null;
  size_bytes: number | null;
  created_at: string;
}

const T_COLS =
  "id, slug, title, tagline, description, category, tags, price_cents, thumbnail_url, demo_ready, demo_deploy_url, status, created_at";

/** USD price from cents, e.g. 9900 → "$99". */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return `$${Number.isInteger(dollars) ? dollars.toString() : dollars.toFixed(2)}`;
}

export async function listPublishedTemplates(): Promise<Template[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("templates")
    .select(T_COLS)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Template[];
}

export async function getTemplateBySlug(
  slug: string
): Promise<{ template: Template; formats: TemplateFormat[] } | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("templates").select(T_COLS).eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  const template = data as Template;
  const { data: formats } = await admin
    .from("template_formats")
    .select("*")
    .eq("template_id", template.id)
    .order("price_cents", { ascending: true });
  return { template, formats: (formats ?? []) as TemplateFormat[] };
}

/** Look up a single format + its parent template (used by checkout / download). */
export async function getFormatById(
  id: string
): Promise<{ format: TemplateFormat; template: Template } | null> {
  const admin = getSupabaseAdmin();
  const { data: f } = await admin.from("template_formats").select("*").eq("id", id).maybeSingle();
  if (!f) return null;
  const format = f as TemplateFormat;
  const { data: t } = await admin.from("templates").select(T_COLS).eq("id", format.template_id).maybeSingle();
  if (!t) return null;
  return { format, template: t as Template };
}
