import { supabase } from './supabase';

type TrackProps = Record<string, string | number | boolean | undefined>;

/** Événements enregistrés dans la base (mesure d'audience du tableau de bord admin). */
const STORED = new Set([
  'page_view', 'view_offer', 'offer_click', 'buy_click', 'signup_click', 'audit_book_click',
  'booking_link_click', 'booking_offer_select', 'booking_submit', 'question_submit',
  // tunnel de conversion
  'link_visit', 'booking_slot_select', 'pay_choice_open', 'pay_method_card', 'pay_method_mobile',
]);

/** Clics sur une carte ou un lien d'offre (trackName des liens) → « offer_click ». */
const OFFER_LINK = /^(offer_card|family|formations_page_card|coachings_page_card|coachings_page_img)_(.+)$/;

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

const newId = () => safe(() => crypto.randomUUID(), `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function storedId(storage: 'localStorage' | 'sessionStorage', key: string) {
  return safe(() => {
    const s = window[storage];
    let v = s.getItem(key);
    if (!v) {
      v = newId();
      s.setItem(key, v);
    }
    return v;
  }, newId());
}

function trackingAllowed() {
  if (typeof window === 'undefined') return false;
  const { hostname, pathname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
  if (pathname.startsWith('/admin')) return false;
  if (navigator.webdriver) return false; // robots et tests automatisés
  if (navigator.doNotTrack === '1') return false;
  return true;
}

/* ───────────── Attribution : d'où vient la visite ? ─────────────
   Ordre de priorité : lien de suivi (/l/code), paramètres utm_*, site référent, navigateur intégré
   (Instagram, TikTok, Facebook). Une visite « directe » reste attribuée à la dernière source connue
   pendant 30 jours (ex. : quelqu'un découvre le site sur TikTok puis revient en tapant l'adresse). */

export interface Attribution {
  /** instagram, tiktok, facebook, google, whatsapp, email… ou « direct » */
  source: string;
  /** Code du lien de suivi (ex. « insta »), ou utm_campaign */
  campaign: string;
  /** Site référent brut */
  ref: string;
}

const ATTR_SESSION = 'lc-attr';
const ATTR_LAST = 'lc-attr-last';
const ATTR_DAYS = 30;

/** Ramène une valeur (utm_source, domaine référent…) à un nom de source lisible. */
export function normalizeSource(raw: string): string {
  const v = raw.trim().toLowerCase().replace(/^www\./, '');
  if (!v) return '';
  if (/instagram|^ig$|^insta$/.test(v)) return 'instagram';
  if (/tiktok|^tt$/.test(v)) return 'tiktok';
  if (/facebook|^fb$|(^|\.)fb\.(com|me)$|messenger/.test(v)) return 'facebook';
  if (/whatsapp|^wa$|(^|\.)wa\.me$/.test(v)) return 'whatsapp';
  if (/youtube|youtu\.be/.test(v)) return 'youtube';
  if (/snapchat/.test(v)) return 'snapchat';
  if (/pinterest|pin\.it/.test(v)) return 'pinterest';
  if (/(^|\.)google\.|^google$/.test(v)) return 'google';
  if (/(^|\.)bing\.|^bing$/.test(v)) return 'bing';
  if (/^(e-?mail|newsletter)$|(^|\.)mail\./.test(v)) return 'email';
  if (/(^|\.)t\.co$|twitter|^x\.com$/.test(v)) return 'x';
  return v.slice(0, 60);
}

/** Navigateur intégré d'une application (ouverture d'un lien depuis Instagram, TikTok…). */
function inAppSource() {
  const ua = navigator.userAgent || '';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/BytedanceWebview|musical_ly|TikTok/i.test(ua)) return 'tiktok';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook';
  if (/Snapchat/i.test(ua)) return 'snapchat';
  return '';
}

function referrerHost() {
  return safe(() => {
    if (!document.referrer) return '';
    const host = new URL(document.referrer).hostname.replace(/^www\./, '');
    return host && host !== window.location.hostname.replace(/^www\./, '') ? host.slice(0, 200) : '';
  }, '');
}

const clean = (v: string | null, max: number) => (v ?? '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '-').slice(0, max);

/** Mémorise la source de la visite (appelé par les liens de suivi /l/code). */
export function setAttribution(source: string, campaign: string) {
  const attr: Attribution = { source: normalizeSource(source) || 'direct', campaign: clean(campaign, 60), ref: referrerHost() };
  safe(() => {
    sessionStorage.setItem(ATTR_SESSION, JSON.stringify(attr));
    if (attr.source !== 'direct') localStorage.setItem(ATTR_LAST, JSON.stringify({ ...attr, ts: Date.now() }));
  }, undefined);
  return attr;
}

export function getAttribution(): Attribution {
  return safe(() => {
    const cached = sessionStorage.getItem(ATTR_SESSION);
    if (cached) return JSON.parse(cached) as Attribution;
    const params = new URLSearchParams(window.location.search);
    const ref = referrerHost();
    const utm = params.get('utm_source') ?? '';
    const source = normalizeSource(utm) || normalizeSource(ref) || inAppSource();
    const campaign = clean(params.get('utm_campaign'), 60);
    if (source) return setAttribution(source, campaign);
    // Visite directe : dernière source connue (moins de 30 jours), sinon « direct ».
    const last = localStorage.getItem(ATTR_LAST);
    if (last) {
      const l = JSON.parse(last) as Attribution & { ts: number };
      if (Date.now() - l.ts < ATTR_DAYS * 86400000) {
        const attr = { source: l.source, campaign: l.campaign, ref: '' };
        sessionStorage.setItem(ATTR_SESSION, JSON.stringify(attr));
        return attr;
      }
    }
    const attr = { source: 'direct', campaign, ref: '' };
    sessionStorage.setItem(ATTR_SESSION, JSON.stringify(attr));
    return attr;
  }, { source: 'direct', campaign: '', ref: '' });
}

/** Identifiants anonymes du visiteur et de la visite (transmis au paiement pour l'attribution des ventes). */
export function visitIds() {
  return { visitor_id: storedId('localStorage', 'lc-vid'), session_id: storedId('sessionStorage', 'lc-sid') };
}

const device = () => (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop');

function store(event: string, props: TrackProps = {}) {
  let name = event;
  let offer = String(props.offer ?? props.slug ?? '');
  let label = String(props.name ?? props.where ?? '');
  if (event === 'nav_click') {
    const m = OFFER_LINK.exec(String(props.name ?? ''));
    if (!m) return;
    name = 'offer_click';
    offer = m[2];
    label = m[1];
  }
  if (!STORED.has(name) || !trackingAllowed()) return;
  const path = String(props.path ?? window.location.pathname);
  // Page intermédiaire d'un lien de suivi : la vraie page vue est enregistrée juste après la redirection.
  if (name === 'page_view' && path.startsWith('/l/')) return;
  const attr = getAttribution();
  const row: Record<string, string> = {
    event: name,
    ...visitIds(),
    path: path.slice(0, 300),
    offer_slug: offer.slice(0, 80),
    label: label.slice(0, 120),
    referrer: attr.ref,
    utm_source: attr.source,
    device: device(),
  };
  if (attr.campaign) row.campaign = attr.campaign;
  void supabase
    .from('lc_events')
    .insert(row)
    .then(() => undefined, () => undefined);
}

/**
 * Point d'entrée unique pour le suivi d'événements :
 * dataLayer (outils externes éventuels) + base Supabase pour le tableau de bord admin.
 */
export function track(event: string, props?: TrackProps) {
  (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event, ...props });
  store(event, props);
}

export function initScrollDepthTracking() {
  if (typeof window === 'undefined') return () => {};
  const marks = [25, 50, 75, 100];
  const fired = new Set<number>();
  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const pct = Math.round((window.scrollY / max) * 100);
    for (const m of marks) {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        track('scroll_depth', { percent: m, path: window.location.pathname });
      }
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}
