import { supabase } from './supabase';

type TrackProps = Record<string, string | number | boolean | undefined>;

/** Événements enregistrés dans la base (mesure d'audience du tableau de bord admin). */
const STORED = new Set([
  'page_view', 'view_offer', 'offer_click', 'buy_click', 'signup_click', 'audit_book_click',
  'booking_link_click', 'booking_offer_select', 'booking_submit', 'question_submit',
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

/** Source de la visite (mémorisée pour la session) : utm_source, sinon site référent. */
function visitSource() {
  return safe(() => {
    const cached = sessionStorage.getItem('lc-src');
    if (cached !== null) return JSON.parse(cached) as { utm: string; ref: string };
    const utm = (new URLSearchParams(window.location.search).get('utm_source') ?? '').slice(0, 80);
    let ref = '';
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (host && host !== window.location.hostname.replace(/^www\./, '')) ref = host.slice(0, 200);
    }
    const src = { utm, ref };
    sessionStorage.setItem('lc-src', JSON.stringify(src));
    return src;
  }, { utm: '', ref: '' });
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
  const src = visitSource();
  void supabase
    .from('lc_events')
    .insert({
      event: name,
      visitor_id: storedId('localStorage', 'lc-vid'),
      session_id: storedId('sessionStorage', 'lc-sid'),
      path: String(props.path ?? window.location.pathname).slice(0, 300),
      offer_slug: offer.slice(0, 80),
      label: label.slice(0, 120),
      referrer: src.ref,
      utm_source: src.utm,
      device: device(),
    })
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
