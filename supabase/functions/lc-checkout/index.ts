// lc-checkout — paiement Stripe Checkout des offres de Leslie Cosmétique.
//   POST                      { offer_slug, email?, name?, booking_starts_at?, cancel_path? } → { url }
//   POST                      { booking_id } (lien « Payer par carte » des e-mails) → { url }
//   GET  ?session_id=cs_...   état du paiement (+ lien de téléchargement du guide une fois payé)
//   GET  ?check=1             diagnostic de configuration (aucune donnée sensible)
import { CATALOG, SITE, corsHeaders, db, json, logEvent, originOk, recordSession, signedGuideUrl, stripe, stripeKey } from '../_shared/lc.ts';

const EMAIL = /^[^@\s]{1,100}@[^@\s]{1,100}\.[^@\s]{2,}$/;
const token = (v: unknown, max: number) => String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, max);

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const cors = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);

  try {
    if (req.method === 'GET' && url.searchParams.get('check')) {
      const key = stripeKey();
      const out: Record<string, unknown> = {
        stripe_key: key ? (key.startsWith('sk_live') || key.startsWith('rk_live') ? 'live' : 'test') : false,
        webhook_secret: (() => {
          const v = (Deno.env.get('LC_STRIPE_WEBHOOK_SECRET') ?? '').trim();
          return v ? (v.startsWith('whsec_') ? true : 'format_inattendu') : false;
        })(),
        // Indice sur le type de valeur collée (jamais la valeur elle-même).
        webhook_secret_hint: (() => {
          const v = Deno.env.get('LC_STRIPE_WEBHOOK_SECRET') ?? '';
          const t = v.trim();
          const kinds: [RegExp, string][] = [
            [/^whsec_/, 'secret de signature (bon format)'],
            [/^we_/, 'identifiant du webhook (we_…), pas le secret'],
            [/^sk_(live|test)_/, 'clé secrète API (sk_…), pas le secret du webhook'],
            [/^rk_/, 'clé restreinte (rk_…), pas le secret du webhook'],
            [/^pk_/, 'clé publique (pk_…), pas le secret du webhook'],
            [/^https?:/, 'adresse du webhook, pas le secret'],
            [/^["'«]/, 'valeur entourée de guillemets'],
          ];
          const kind = kinds.find(([r]) => r.test(t))?.[1] ?? 'autre format';
          return { type: kind, longueur: v.length, espaces_autour: v !== t };
        })(),
      };
      if (key) {
        try {
          const acct = await stripe('account');
          out.account = {
            name: acct.settings?.dashboard?.display_name ?? acct.business_profile?.name ?? '',
            charges_enabled: acct.charges_enabled,
            details_submitted: acct.details_submitted,
            country: acct.country,
          };
        } catch (e) {
          out.account_error = String((e as Error).message).slice(0, 160);
        }
      }
      return json(out, 200, cors);
    }

    if (req.method === 'GET') {
      const sessionId = url.searchParams.get('session_id') ?? '';
      if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return json({ error: 'session_invalide' }, 400, cors);
      const s = await stripe(`checkout/sessions/${sessionId}`);
      if (s?.metadata?.source !== 'leslie-site') return json({ error: 'introuvable' }, 404, cors);
      const slug = s.metadata.offer_slug as string;
      const item = CATALOG[slug];
      const paid = s.payment_status === 'paid' || s.payment_status === 'no_payment_required';
      if (s.status === 'complete') {
        try {
          await recordSession(s);
        } catch (e) {
          console.error('recordSession', e);
        }
      }
      const download = paid && item?.file ? await signedGuideUrl(item.file, item.fileName ?? item.file) : null;
      return json(
        {
          status: paid ? 'paid' : s.status === 'complete' ? 'processing' : s.status === 'expired' ? 'expired' : 'open',
          offer_slug: slug,
          offer_name: item?.name ?? '',
          kind: item?.kind ?? null,
          amount_cents: s.amount_total,
          email: s.customer_details?.email ?? s.customer_email ?? '',
          name: s.customer_details?.name ?? '',
          booking_starts_at: s.metadata.booking_starts_at ?? null,
          download_url: download,
        },
        200,
        cors,
      );
    }

    if (req.method !== 'POST') return json({ error: 'methode' }, 405, cors);
    if (!stripeKey()) return json({ error: 'stripe_non_configure' }, 503, cors);

    const body = await req.json().catch(() => ({}));

    // Séance déjà réservée : l'offre, la date et l'e-mail sont lus dans la réservation (jamais dans le navigateur).
    let bookingId = '';
    if (body.booking_id) {
      bookingId = String(body.booking_id);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId)) return json({ error: 'reservation_introuvable' }, 404, cors);
      const b = (await db(`lc_booking_requests?id=eq.${bookingId}&select=offer_slug,starts_at,email,full_name,status`))?.[0];
      if (!b || !['pending', 'confirmed'].includes(b.status)) return json({ error: 'reservation_introuvable' }, 404, cors);
      if (new Date(b.starts_at).getTime() < Date.now()) return json({ error: 'reservation_passee' }, 410, cors);
      const paid = await db(`lc_payments?booking_id=eq.${bookingId}&status=eq.paid&select=id&limit=1`);
      if (paid?.length) return json({ error: 'deja_regle' }, 409, cors);
      Object.assign(body, { offer_slug: b.offer_slug, email: b.email, name: b.full_name, booking_starts_at: b.starts_at, cancel_path: '/' });
    }

    const slug = String(body.offer_slug ?? '');
    const item = CATALOG[slug];
    if (!item) return json({ error: 'offre_inconnue' }, 400, cors);

    const email = String(body.email ?? '').trim().slice(0, 200);
    const startsAt = body.booking_starts_at ? new Date(String(body.booking_starts_at)) : null;
    if (startsAt && Number.isNaN(startsAt.getTime())) return json({ error: 'date_invalide' }, 400, cors);
    const base = originOk(origin) ? origin! : SITE;
    const cancelPath = /^\/[a-z0-9/_-]{0,80}$/i.test(String(body.cancel_path ?? '')) ? String(body.cancel_path) : `/offres/${slug}`;

    const p = new URLSearchParams();
    p.set('mode', 'payment');
    p.set('locale', 'fr');
    p.set('line_items[0][quantity]', '1');
    p.set('line_items[0][price_data][currency]', 'eur');
    p.set('line_items[0][price_data][unit_amount]', String(item.amount));
    p.set('line_items[0][price_data][product_data][name]', item.name);
    if (startsAt) {
      const when = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(startsAt);
      p.set('line_items[0][price_data][product_data][description]', `Rendez-vous du ${when} (heure de Paris)`);
    }
    p.set('success_url', `${base}/merci?session_id={CHECKOUT_SESSION_ID}`);
    p.set('cancel_url', `${base}/merci?annule=1&offre=${encodeURIComponent(slug)}&retour=${encodeURIComponent(cancelPath)}`);
    if (EMAIL.test(email)) p.set('customer_email', email);
    p.set('metadata[source]', 'leslie-site');
    p.set('metadata[offer_slug]', slug);
    p.set('payment_intent_data[metadata][source]', 'leslie-site');
    p.set('payment_intent_data[metadata][offer_slug]', slug);
    p.set('payment_intent_data[description]', item.name);
    if (startsAt && item.kind === 'coaching') {
      p.set('metadata[booking_starts_at]', startsAt.toISOString());
      if (EMAIL.test(email)) p.set('metadata[booking_email]', email);
      if (bookingId) p.set('metadata[booking_id]', bookingId);
    }
    // Attribution (source de la visite, lien de suivi) pour les statistiques de l'admin
    const attr = {
      source: token(body.source, 60) || 'direct',
      campaign: token(body.campaign, 60),
      visitor_id: token(body.visitor_id, 64),
      session_id: token(body.session_id, 64),
      device: ['mobile', 'tablet', 'desktop'].includes(String(body.device)) ? String(body.device) : '',
    };
    // (« source » est déjà le repère des paiements du site : l'origine de la visite va dans « traffic_source »)
    p.set('metadata[traffic_source]', attr.source);
    for (const k of ['campaign', 'visitor_id', 'device'] as const) if (attr[k]) p.set(`metadata[${k}]`, attr[k]);

    const session = await stripe('checkout/sessions', p);
    if (attr.visitor_id.length >= 8 && attr.session_id.length >= 8) {
      const row: Record<string, string> = {
        event: 'checkout_start',
        visitor_id: attr.visitor_id,
        session_id: attr.session_id,
        path: '/paiement',
        offer_slug: slug,
        utm_source: attr.source,
        device: attr.device,
      };
      if (attr.campaign) row.campaign = attr.campaign;
      await logEvent(row);
    }
    return json({ url: session.url }, 200, cors);
  } catch (e) {
    console.error(e);
    return json({ error: 'erreur_paiement' }, 502, cors);
  }
});
