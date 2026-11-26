import { supabase } from '@/lib/supabase';

const TOKEN_KEY = 'lc-admin-token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const setToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* stockage indisponible */
  }
};

export const SESSION_EXPIRED = 'lc-admin-session-expired';

/** Appel d'une fonction admin (le jeton de session est ajouté automatiquement). */
export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, { p_token: getToken(), ...args });
  if (error) {
    if (error.code === '28000') {
      setToken(null);
      window.dispatchEvent(new Event(SESSION_EXPIRED));
    }
    throw new Error(error.message || 'Erreur inattendue');
  }
  return data as T;
}

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('lc_admin_login', { p_email: email, p_password: password });
  if (error) return { ok: false, error: 'Connexion impossible. Vérifiez votre réseau puis réessayez.' };
  const r = data as { ok: boolean; token?: string; error?: string };
  if (!r.ok || !r.token) return { ok: false, error: r.error ?? 'Identifiants incorrects.' };
  setToken(r.token);
  return { ok: true };
}

export async function logout() {
  const t = getToken();
  setToken(null);
  if (t) await supabase.rpc('lc_admin_logout', { p_token: t });
}

export const calendarFeedUrl = (token: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lc-calendar?token=${token}`;

/* ───────── Types renvoyés par les fonctions admin ───────── */
export interface DailyPoint {
  day: string;
  visitors: number;
  page_views: number;
  offer_clicks: number;
  bookings: number;
  questions: number;
  revenue_cents: number;
}
export interface Overview {
  visitors: number;
  visits: number;
  page_views: number;
  offer_views: number;
  offer_clicks: number;
  buy_clicks: number;
  bookings: number;
  questions: number;
  revenue_cents: number;
  sales: number;
  daily: DailyPoint[];
  top_offers: { slug: string; name: string; views: number; clicks: number }[];
  top_pages: { path: string; views: number }[];
  sources: { source: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
}
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'done';
export interface Booking {
  id: string;
  offer_slug: string;
  offer_name: string;
  minutes: number;
  starts_at: string;
  full_name: string;
  email: string;
  phone: string;
  message: string;
  status: BookingStatus;
  admin_note: string;
  created_at: string;
  /** Champs ajoutés avec les e-mails automatiques (absents tant que la base n'est pas à jour). */
  meet_url?: string;
  timezone?: string;
  paid_cents?: number;
  emails?: BookingEmail[];
}
export type EmailKind =
  | 'booking_request' | 'booking_new' | 'booking_paid' | 'booking_confirmed' | 'booking_reminder'
  | 'booking_moved' | 'booking_cancelled' | 'guide_link' | 'sale_new' | 'preview';
export type EmailStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'skipped';
export interface BookingEmail {
  kind: EmailKind;
  status: EmailStatus;
  created_at: string;
  sent_at: string | null;
  error: string;
}
export interface MailSettings {
  enabled: boolean;
  notify_to: string;
  notify_bookings: boolean;
  notify_sales: boolean;
  reminders: boolean;
  meet_url: string;
  recent: { kind: EmailKind; to_email: string; status: EmailStatus; subject: string; created_at: string; sent_at: string | null; error: string }[];
}
export const EMAIL_LABEL: Record<EmailKind, string> = {
  booking_request: 'Accusé de réception',
  booking_new: 'Alerte nouvelle réservation',
  booking_paid: 'Paiement reçu',
  booking_confirmed: 'Confirmation + lien visio',
  booking_reminder: 'Rappel la veille',
  booking_moved: 'Changement d’horaire',
  booking_cancelled: 'Annulation',
  guide_link: 'Lien du guide',
  sale_new: 'Alerte nouvelle vente',
  preview: 'Aperçu',
};
export type QuestionStatus = 'new' | 'in_progress' | 'answered' | 'archived';
export interface Question {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  message: string;
  page: string;
  status: QuestionStatus;
  admin_note: string;
}
export interface Payment {
  id: string;
  paid_at: string;
  provider: 'stripe' | 'manuel';
  offer_slug: string;
  offer_name: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'paid' | 'refunded' | 'failed';
  customer_name: string;
  customer_email: string;
  note: string;
}
export interface Payments {
  total_cents: number;
  sales: number;
  month_cents: number;
  month_sales: number;
  prev_month_cents: number;
  month_start: string;
  month_end: string;
  by_offer: { slug: string; name: string; sales: number; revenue_cents: number }[];
  monthly: { month: string; revenue_cents: number }[];
  rows: Payment[];
}
export interface Contact {
  email: string;
  name: string | null;
  phone: string | null;
  first_at: string;
  last_at: string;
  bookings: number;
  questions: number;
  payments: number;
  total_cents: number;
}
