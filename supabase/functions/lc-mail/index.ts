// lc-mail — envoie les e-mails automatiques de Leslie Cosmétique (file lc_emails → Resend).
// Appelée par la base (pg_net) juste après chaque inscription dans la file, et toutes les 10 minutes (pg_cron).
// Ne prend aucun paramètre : elle ne fait que vider la file, ce qui rend un appel extérieur sans effet.
// Secret utilisé : RESEND_API_KEY (déjà présent dans le projet Supabase).
import { CATALOG, db, json, signedGuideUrl } from '../_shared/lc.ts';
import { render, sample, type Booking, type Ctx, type Kind, type Payment } from './templates.ts';

const FROM = Deno.env.get('LC_MAIL_FROM') ?? 'Leslie Cosmétique <leslie@phoenixpro.fr>';
const DEFAULT_REPLY_TO = 'lesliedjomanghi@gmail.com';
const MAX_ATTEMPTS = 4;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Row {
  id: string;
  kind: Kind | 'preview';
  booking_id: string | null;
  payment_id: string | null;
  to_email: string;
  data: Record<string, unknown>;
  attempts: number;
}

/** Base64 d'un texte UTF-8 (pièce jointe .ics). */
const b64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

async function settings() {
  const rows: { key: string; value: string }[] = (await db('lc_settings?key=in.(mail_notify_to,mail_meet_url)&select=key,value')) ?? [];
  const get = (k: string) => rows.find((r) => r.key === k)?.value ?? '';
  return { notifyTo: get('mail_notify_to') || DEFAULT_REPLY_TO, meetUrl: get('mail_meet_url') };
}

async function patch(id: string, body: Record<string, unknown>) {
  await db(`lc_emails?id=eq.${id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(body) });
}

/** Prépare le contenu d'un e-mail de la file. Renvoie null si l'e-mail n'a plus lieu d'être. */
async function build(row: Row, cfg: { notifyTo: string; meetUrl: string }): Promise<{ ctx: Ctx; replyTo: string } | { skip: string }> {
  if (row.kind === 'preview') {
    const as = String(row.data?.as ?? '') as Kind;
    const ctx = sample(as, cfg.meetUrl);
    return { ctx, replyTo: cfg.notifyTo };
  }

  let booking: Booking | null = null;
  let payment: Payment | null = null;
  if (row.booking_id) {
    booking = (await db(`lc_booking_requests?id=eq.${row.booking_id}&select=*`))?.[0] ?? null;
    if (!booking) return { skip: 'réservation supprimée' };
  }
  if (row.payment_id) {
    payment = (await db(`lc_payments?id=eq.${row.payment_id}&select=*`))?.[0] ?? null;
    if (!payment) return { skip: 'paiement supprimé' };
  }

  let paidCents = 0;
  if (booking) {
    const paid: { amount_cents: number }[] = (await db(`lc_payments?booking_id=eq.${booking.id}&status=eq.paid&select=amount_cents`)) ?? [];
    paidCents = paid.reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  }
  const slug = booking?.offer_slug ?? payment?.offer_slug ?? '';
  const ctx: Ctx = {
    kind: row.kind,
    booking,
    payment,
    paidCents,
    priceCents: CATALOG[slug]?.amount ?? 0,
    oldStartsAt: typeof row.data?.old_starts_at === 'string' ? row.data.old_starts_at : undefined,
    message: typeof row.data?.message === 'string' ? row.data.message : '',
  };

  // E-mails devenus inutiles entre l'inscription et l'envoi
  const now = Date.now();
  if (booking) {
    const start = new Date(booking.starts_at).getTime();
    if (row.kind === 'booking_reminder' && (booking.status !== 'confirmed' || start < now)) return { skip: 'rendez-vous annulé, passé ou non confirmé' };
    if (row.kind === 'booking_confirmed' && booking.status !== 'confirmed') return { skip: 'rendez-vous plus confirmé' };
    if ((row.kind === 'booking_request' || row.kind === 'booking_moved') && booking.status === 'cancelled') return { skip: 'rendez-vous annulé' };
  }
  if (row.kind === 'guide_link') {
    const item = CATALOG[payment!.offer_slug];
    if (!item?.file) return { skip: 'offre sans fichier' };
    const url = await signedGuideUrl(item.file, item.fileName ?? item.file);
    if (!url) throw new Error('lien de téléchargement indisponible');
    ctx.downloadUrl = url;
  }

  // Leslie répond directement à la cliente depuis ses notifications ; les clientes répondent à Leslie.
  const replyTo = row.kind === 'booking_new' ? booking!.email : row.kind === 'sale_new' && payment?.customer_email ? payment.customer_email : cfg.notifyTo;
  return { ctx, replyTo };
}

async function sendOne(row: Row, key: string, cfg: { notifyTo: string; meetUrl: string }) {
  const prepared = await build(row, cfg);
  if ('skip' in prepared) {
    await patch(row.id, { status: 'skipped', error: prepared.skip });
    return 'skipped';
  }
  const mail = render(prepared.ctx);
  const subject = row.kind === 'preview' ? `[Aperçu] ${mail.subject}` : mail.subject;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `lc-mail-${row.id}` },
    body: JSON.stringify({
      from: FROM,
      to: [row.to_email],
      reply_to: prepared.replyTo,
      subject,
      html: mail.html,
      text: mail.text,
      tags: [
        { name: 'app', value: 'leslie' },
        { name: 'kind', value: row.kind },
      ],
      ...(mail.ics ? { attachments: [{ filename: 'rendez-vous.ics', content: b64(mail.ics) }] } : {}),
    }),
  });
  const out = await res.json().catch(() => ({}));
  if (res.ok || res.status === 409) {
    // 409 : cette clé d'envoi a déjà été acceptée par Resend (envoi précédent interrompu avant d'être noté)
    await patch(row.id, { status: 'sent', sent_at: new Date().toISOString(), provider_id: out?.id ?? null, subject, error: '' });
    return 'sent';
  }
  if (res.status === 429) {
    await patch(row.id, { status: 'queued', attempts: Math.max(0, row.attempts - 1), send_after: new Date(Date.now() + 60_000).toISOString(), error: 'limite d’envoi Resend, nouvel essai dans 1 min' });
    return 'retry';
  }
  throw new Error(`Resend ${res.status} : ${String(out?.message ?? out?.name ?? 'erreur').slice(0, 300)}`);
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return json({ ok: true, service: 'lc-mail' });
  const key = Deno.env.get('RESEND_API_KEY') ?? '';
  if (!key) return json({ error: 'RESEND_API_KEY manquante' }, 503);

  const stats = { sent: 0, skipped: 0, retry: 0, failed: 0 };
  const started = Date.now();
  let cfg: { notifyTo: string; meetUrl: string } | null = null;
  try {
    while (Date.now() - started < 50_000) {
      const rows: Row[] = (await db('rpc/lc__mail_claim', { method: 'POST', body: JSON.stringify({ p_limit: 10 }) })) ?? [];
      if (!rows.length) break;
      cfg ??= await settings();
      for (const row of rows) {
        try {
          const r = await sendOne(row, key, cfg);
          stats[r === 'sent' ? 'sent' : r === 'skipped' ? 'skipped' : 'retry']++;
        } catch (e) {
          const final = row.attempts >= MAX_ATTEMPTS;
          stats[final ? 'failed' : 'retry']++;
          console.error('lc-mail', row.kind, row.id, e);
          await patch(row.id, {
            status: final ? 'failed' : 'queued',
            send_after: new Date(Date.now() + row.attempts * 10 * 60_000).toISOString(),
            error: String((e as Error).message ?? e).slice(0, 500),
          }).catch((err) => console.error('lc-mail patch', err));
        }
        await sleep(600); // Resend : 2 envois par seconde au plus
      }
    }
  } catch (e) {
    console.error('lc-mail', e);
    return json({ error: String((e as Error).message ?? e).slice(0, 300), ...stats }, 500);
  }
  return json(stats);
});
