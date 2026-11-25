// lc-stripe-webhook — reçoit les événements Stripe et remplit le tableau « Paiements » de l'admin.
// Événements : checkout.session.completed, checkout.session.async_payment_succeeded,
//              checkout.session.async_payment_failed, charge.refunded.
import { db, json, recordSession } from '../_shared/lc.ts';

const enc = new TextEncoder();

/** Vérifie la signature Stripe (en-tête Stripe-Signature, HMAC-SHA256, tolérance 5 min). */
async function verify(payload: string, header: string, secret: string) {
  let t = '';
  const sigs: string[] = [];
  for (const part of header.split(',')) {
    const [k, v] = part.split('=', 2);
    if (k === 't') t = v;
    if (k === 'v1') sigs.push(v);
  }
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`)));
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
  return sigs.some((s) => {
    if (s.length !== hex.length) return false;
    let diff = 0;
    for (let i = 0; i < s.length; i++) diff |= s.charCodeAt(i) ^ hex.charCodeAt(i);
    return diff === 0;
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: true, service: 'lc-stripe-webhook' });
  const secret = Deno.env.get('LC_STRIPE_WEBHOOK_SECRET') ?? '';
  if (!secret) return json({ error: 'secret_manquant' }, 500);

  const payload = await req.text();
  if (!(await verify(payload, req.headers.get('Stripe-Signature') ?? '', secret))) {
    return json({ error: 'signature_invalide' }, 400);
  }

  const event = JSON.parse(payload);
  const obj = event.data?.object ?? {};
  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await recordSession(obj);
        break;
      case 'checkout.session.async_payment_failed':
        await recordSession(obj, 'failed');
        break;
      case 'charge.refunded': {
        const pi = typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent?.id;
        if (!pi || obj.metadata?.source !== 'leslie-site') break;
        if (obj.refunded) {
          await db(`lc_payments?provider_payment_id=eq.${encodeURIComponent(pi)}&provider=eq.stripe`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'refunded' }),
          });
        } else {
          const amount = ((obj.amount_refunded ?? 0) / 100).toLocaleString('fr-FR');
          await db(`lc_payments?provider_payment_id=eq.${encodeURIComponent(pi)}&provider=eq.stripe`, {
            method: 'PATCH',
            body: JSON.stringify({ note: `Remboursement partiel : ${amount} €` }),
          });
        }
        break;
      }
    }
  } catch (e) {
    // Erreur côté base : on répond 500 pour que Stripe renvoie l'événement plus tard.
    console.error(event.type, e);
    return json({ error: 'traitement' }, 500);
  }
  return json({ received: true });
});
