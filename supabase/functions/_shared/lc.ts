// Code commun aux fonctions Stripe de Leslie Cosmétique (lc-checkout, lc-stripe-webhook).
// Les clés sont lues dans les secrets Supabase : LC_STRIPE_SECRET_KEY, LC_STRIPE_WEBHOOK_SECRET.

export type Kind = 'guide' | 'coaching';

/** Catalogue côté serveur : les prix ne viennent jamais du navigateur. Montants en centimes. */
export const CATALOG: Record<string, { name: string; amount: number; kind: Kind; file?: string; fileName?: string }> = {
  'guide-recettes-capillaires': {
    name: 'Le guide de mes 10 meilleures recettes capillaires',
    amount: 3800,
    kind: 'guide',
    file: 'guide-recettes-capillaires.pdf',
    fileName: 'Guide-10-recettes-capillaires-Leslie-Cosmetique.pdf',
  },
  'guide-formulation': {
    name: 'Guide numérique : Apprendre à formuler ses propres produits cosmétiques',
    amount: 4800,
    kind: 'guide',
    file: 'guide-formulation.pdf',
    fileName: 'Guide-formulation-cosmetique-Leslie-Cosmetique.pdf',
  },
  'coaching-formulation': { name: 'Coaching Formulation (1 h en visio)', amount: 6000, kind: 'coaching' },
  'consultation-lancement-marque': { name: 'Consultation Lancement de Marque (1 h en visio)', amount: 7900, kind: 'coaching' },
  'audit-orientation': { name: 'Audit — appel d’orientation (30 min en visio)', amount: 3000, kind: 'coaching' },
};

export const SITE = 'https://leslie.phoenixpro.fr';
const ORIGINS = new Set([SITE, 'https://leslie-cosmetique.netlify.app', 'http://localhost:5173', 'http://localhost:4173']);
export const originOk = (o: string | null) =>
  !!o && (ORIGINS.has(o) || /^https:\/\/[a-z0-9-]+--leslie-cosmetique\.netlify\.app$/.test(o));

export const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': originOk(origin) ? origin! : SITE,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  Vary: 'Origin',
});

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

export const stripeKey = () => Deno.env.get('LC_STRIPE_SECRET_KEY') ?? '';

/** Appel à l'API Stripe (formulaire encodé, sans SDK). */
export async function stripe(path: string, params?: URLSearchParams, method = params ? 'POST' : 'GET') {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20',
    },
    body: params,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${data?.error?.message ?? 'erreur'}`);
  return data;
}

const SB_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

/** Requête PostgREST avec la clé service (contourne RLS, côté serveur uniquement). */
export async function db(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`DB ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

/** Lien de téléchargement temporaire d'un guide (bucket privé lc-guides). */
export async function signedGuideUrl(file: string, fileName: string, expiresIn = 7 * 24 * 3600) {
  const res = await fetch(`${SB_URL}/storage/v1/object/sign/lc-guides/${file}`, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn }),
  });
  if (!res.ok) return null;
  const { signedURL } = await res.json();
  return `${SB_URL}/storage/v1${signedURL}&download=${encodeURIComponent(fileName)}`;
}

const euros = (cents: number) => `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: cents % 100 ? 2 : 0 })} €`;

// deno-lint-ignore no-explicit-any
type Session = any;

/**
 * Enregistre (ou met à jour) une session Stripe Checkout dans lc_payments.
 * Idempotent : appelé par le webhook ET par la page de confirmation, sans doublon.
 */
export async function recordSession(session: Session, forced?: 'failed') {
  if (session?.metadata?.source !== 'leslie-site') return 'ignored';
  const slug: string = session.metadata.offer_slug ?? '';
  const item = CATALOG[slug];
  const status = forced ?? (session.payment_status === 'paid' || session.payment_status === 'no_payment_required' ? 'paid' : 'pending');
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
  const email = String(session.customer_details?.email ?? session.customer_email ?? '').slice(0, 200);

  const existing = await db(`lc_payments?provider_session_id=eq.${encodeURIComponent(session.id)}&select=id,status`);
  if (existing?.length) {
    const cur = existing[0];
    if (cur.status !== status && cur.status !== 'refunded') {
      const patch: Record<string, unknown> = { status };
      if (status === 'paid') patch.paid_at = new Date().toISOString();
      if (pi) patch.provider_payment_id = pi;
      await db(`lc_payments?id=eq.${cur.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    }
    return 'updated';
  }

  // Séance réservée sur le calendrier : on relie le paiement à la réservation.
  let booking: { id: string; admin_note: string } | null = null;
  const startsAt = session.metadata.booking_starts_at;
  if (startsAt && item?.kind === 'coaching') {
    const bEmail = String(session.metadata.booking_email || email);
    const rows = await db(
      `lc_booking_requests?select=id,admin_note&offer_slug=eq.${encodeURIComponent(slug)}` +
        `&starts_at=eq.${encodeURIComponent(new Date(startsAt).toISOString())}` +
        `&email=ilike.${encodeURIComponent(bEmail)}&status=in.(pending,confirmed)&limit=1`,
    );
    booking = rows?.[0] ?? null;
  }

  const inserted = await db('lc_payments?on_conflict=provider_session_id', {
    method: 'POST',
    headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
    body: JSON.stringify({
      provider: 'stripe',
      provider_session_id: session.id,
      provider_payment_id: pi,
      offer_slug: slug,
      offer_name: item?.name ?? slug,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? 'eur',
      status,
      customer_name: String(session.customer_details?.name ?? '').slice(0, 200),
      customer_email: email,
      booking_id: booking?.id ?? null,
      metadata: { mode: session.livemode ? 'live' : 'test', booking_starts_at: startsAt ?? null },
    }),
  });

  if (inserted?.length && booking && status === 'paid') {
    const line = `Séance réglée en ligne par carte (Stripe) : ${euros(session.amount_total ?? 0)}.`;
    const note = booking.admin_note ? `${line}\n${booking.admin_note}` : line;
    await db(`lc_booking_requests?id=eq.${booking.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ admin_note: note.slice(0, 2000), updated_at: new Date().toISOString() }),
    });
  }
  return inserted?.length ? 'recorded' : 'updated';
}
