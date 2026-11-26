import { supabase } from './supabase';
import { site } from '@/data/site';

export interface BookingInput {
  offerSlug: string;
  startsAt: Date;
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function isBookableDay(day: Date) {
  const today = startOfDay(new Date());
  const diff = Math.round((startOfDay(day).getTime() - today.getTime()) / 86400000);
  return (
    diff >= site.booking.minDaysAhead &&
    diff <= site.booking.maxDaysAhead &&
    (site.booking.weekdays as readonly number[]).includes(day.getDay())
  );
}

export function slotsForDay(day: Date): Date[] {
  return site.booking.slotsUtc.map((t) => {
    const [h, m] = t.split(':').map(Number);
    return new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), h, m));
  });
}

export async function fetchTakenSlots(from: Date, to: Date): Promise<Set<number>> {
  const { data, error } = await supabase.rpc('lc_get_taken_slots', {
    range_from: from.toISOString(),
    range_to: to.toISOString(),
  });
  if (error) throw error;
  const rows = Array.isArray(data) ? (data as { starts_at: string }[]) : [];
  return new Set(rows.map((r) => new Date(r.starts_at).getTime()));
}

/**
 * Créneaux libres d'une séance, d'après les disponibilités saisies par Leslie dans l'admin
 * (fonction serveur lc_get_available_slots). Renvoie null si la base n'a pas encore cette fonction :
 * on retombe alors sur l'ancien calendrier fixe (voir fallbackSlots).
 */
export async function fetchAvailableSlots(offerSlug: string, from: Date, to: Date): Promise<Date[] | null> {
  const { data, error } = await supabase.rpc('lc_get_available_slots', {
    p_offer_slug: offerSlug,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) {
    if (error.code === 'PGRST202' || /could not find the function/i.test(error.message)) return null;
    throw error;
  }
  const rows = Array.isArray(data) ? (data as (string | { lc_get_available_slots: string })[]) : [];
  return rows.map((r) => new Date(typeof r === 'string' ? r : r.lc_get_available_slots));
}

/** Ancien calendrier fixe (site.booking), utilisé seulement si les disponibilités ne sont pas encore actives. */
export async function fallbackSlots(from: Date, to: Date): Promise<Date[]> {
  const taken = await fetchTakenSlots(from, to);
  const out: Date[] = [];
  for (let d = startOfDay(from); d <= to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    if (!isBookableDay(d)) continue;
    for (const s of slotsForDay(d)) if (!taken.has(s.getTime()) && s > new Date()) out.push(s);
  }
  return out;
}

export type BookingResult = { ok: true } | { ok: false; reason: 'taken' | 'error' };

/** Fuseau horaire du navigateur (les e-mails affichent l'heure locale de la cliente). */
const browserTz = () => {
  try {
    return (Intl.DateTimeFormat().resolvedOptions().timeZone ?? '').slice(0, 64);
  } catch {
    return '';
  }
};

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const row = {
    offer_slug: input.offerSlug,
    starts_at: input.startsAt.toISOString(),
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    message: input.message.trim(),
  };
  const tz = browserTz();
  let { error } = await supabase.from('lc_booking_requests').insert(tz ? { ...row, timezone: tz } : row);
  // Base pas encore à jour (colonne « timezone » absente) : on réessaie sans le fuseau.
  if (error && tz && (error.code === 'PGRST204' || error.code === '42703' || /timezone/i.test(error.message))) {
    ({ error } = await supabase.from('lc_booking_requests').insert(row));
  }
  if (!error) return { ok: true };
  return { ok: false, reason: error.code === '23505' ? 'taken' : 'error' };
}
