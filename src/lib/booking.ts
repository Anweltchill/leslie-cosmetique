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

export type BookingResult = { ok: true } | { ok: false; reason: 'taken' | 'error' };

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const { error } = await supabase.from('lc_booking_requests').insert({
    offer_slug: input.offerSlug,
    starts_at: input.startsAt.toISOString(),
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    message: input.message.trim(),
  });
  if (!error) return { ok: true };
  return { ok: false, reason: error.code === '23505' ? 'taken' : 'error' };
}
