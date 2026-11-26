// lc-admin-guides — onglet « Guides » de l'admin : liens temporaires pour lire ou télécharger les PDF vendus.
//   POST { token } → { guides: [{ slug, name, price_cents, file, file_name, size, updated_at, view_url, download_url }] }
// Réservé à l'admin : le jeton de session est vérifié en base (lc_admin_me) avant de signer les liens.
import { CATALOG, corsHeaders, db, json, signedGuideUrl } from '../_shared/lc.ts';

const SB_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const LINK_SECONDS = 3600;

/** Lien de lecture dans le navigateur (sans forcer le téléchargement). */
async function viewUrl(file: string) {
  const res = await fetch(`${SB_URL}/storage/v1/object/sign/lc-guides/${file}`, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: LINK_SECONDS }),
  });
  if (!res.ok) return null;
  const { signedURL } = await res.json();
  return `${SB_URL}/storage/v1${signedURL}`;
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'methode' }, 405, cors);
  try {
    const { token } = await req.json().catch(() => ({ token: '' }));
    if (typeof token !== 'string' || token.length < 20 || token.length > 200) return json({ error: 'session' }, 401, cors);
    try {
      await db('rpc/lc_admin_me', { method: 'POST', body: JSON.stringify({ p_token: token }) });
    } catch {
      return json({ error: 'session' }, 401, cors);
    }

    // Taille et date de mise à jour des fichiers déposés
    const listRes = await fetch(`${SB_URL}/storage/v1/object/list/lc-guides`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 100 }),
    });
    const files: { name: string; updated_at?: string; metadata?: { size?: number } }[] = listRes.ok ? await listRes.json() : [];

    const guides = [];
    for (const [slug, item] of Object.entries(CATALOG)) {
      if (!item.file) continue;
      const f = files.find((x) => x.name === item.file);
      guides.push({
        slug,
        name: item.name,
        price_cents: item.amount,
        file: item.file,
        file_name: item.fileName ?? item.file,
        size: f?.metadata?.size ?? null,
        updated_at: f?.updated_at ?? null,
        view_url: f ? await viewUrl(item.file) : null,
        download_url: f ? await signedGuideUrl(item.file, item.fileName ?? item.file, LINK_SECONDS) : null,
      });
    }
    return json({ guides, expires_in: LINK_SECONDS }, 200, cors);
  } catch (e) {
    console.error('lc-admin-guides', e);
    return json({ error: 'erreur' }, 500, cors);
  }
});
