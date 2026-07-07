import { getSupabaseAdmin } from "./supabase";
import { DEFAULT_SETTINGS, type BookingSettings } from "./booking";

// Reads/writes the single-row booking_settings table. Falls back to defaults
// (the original hard-coded behavior) if the table doesn't exist yet.

export async function getBookingSettings(): Promise<BookingSettings> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("booking_settings")
      .select("weekdays, times, blocked_dates, horizon_days")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return DEFAULT_SETTINGS;
    const d = data as { weekdays: number[]; times: string[]; blocked_dates: string[]; horizon_days: number };
    return {
      weekdays: d.weekdays?.length ? d.weekdays : DEFAULT_SETTINGS.weekdays,
      times: d.times?.length ? d.times : DEFAULT_SETTINGS.times,
      blocked: d.blocked_dates ?? [],
      horizonDays: d.horizon_days ?? DEFAULT_SETTINGS.horizonDays,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveBookingSettings(s: BookingSettings): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("booking_settings")
    .upsert({
      id: 1,
      weekdays: s.weekdays,
      times: s.times,
      blocked_dates: s.blocked,
      horizon_days: s.horizonDays,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
}
