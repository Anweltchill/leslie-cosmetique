/**
 * Paiement en ligne (Stripe Checkout) via la fonction serveur `lc-checkout`.
 * Les prix sont fixés côté serveur : le navigateur n'envoie que l'offre choisie.
 */
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lc-checkout`;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const LAST_KEY = 'lc-last-checkout';

/** Offres payables en ligne par carte. */
export const ONLINE_PAYMENT = new Set([
  'guide-recettes-capillaires',
  'guide-formulation',
  'coaching-formulation',
  'consultation-lancement-marque',
  'audit-orientation',
]);
export const paysOnline = (slug: string) => ONLINE_PAYMENT.has(slug);

export interface CheckoutInput {
  offer_slug: string;
  email?: string;
  name?: string;
  /** Coaching réservé sur le calendrier : date du rendez-vous (relie le paiement à la réservation). */
  booking_starts_at?: string;
  /** Page où revenir si le paiement est abandonné. */
  cancel_path?: string;
}

const headers = { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` };

/** Crée la session de paiement et redirige vers la page sécurisée Stripe. */
export async function startCheckout(input: CheckoutInput): Promise<void> {
  const res = await fetch(FN_URL, { method: 'POST', headers, body: JSON.stringify(input) });
  const data = (await res.json().catch(() => ({}))) as { url?: string };
  if (!res.ok || !data.url) throw new Error('checkout');
  try {
    sessionStorage.setItem(LAST_KEY, JSON.stringify(input));
  } catch {
    /* stockage indisponible : la relance du paiement ne sera simplement pas proposée */
  }
  window.location.assign(data.url);
}

/** Dernier paiement lancé depuis ce navigateur (pour le relancer après une annulation). */
export function lastCheckout(): CheckoutInput | null {
  try {
    const raw = sessionStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as CheckoutInput) : null;
  } catch {
    return null;
  }
}

export interface CheckoutStatus {
  status: 'paid' | 'processing' | 'open' | 'expired';
  offer_slug: string;
  offer_name: string;
  kind: 'guide' | 'coaching' | null;
  amount_cents: number;
  email: string;
  name: string;
  booking_starts_at: string | null;
  download_url: string | null;
}

export async function fetchCheckoutStatus(sessionId: string): Promise<CheckoutStatus> {
  const res = await fetch(`${FN_URL}?session_id=${encodeURIComponent(sessionId)}`, { headers });
  if (!res.ok) throw new Error('status');
  return (await res.json()) as CheckoutStatus;
}
