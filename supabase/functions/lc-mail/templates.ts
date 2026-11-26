// Modèles des e-mails automatiques de Leslie Cosmétique (HTML compatible messageries + version texte).
// Aucun accès réseau ici : la fonction lc-mail fournit les données, ce fichier ne fait que la mise en page.

export const SITE = 'https://leslie.phoenixpro.fr';
export const ADMIN = 'https://admin.leslie.phoenixpro.fr';
const WHATSAPP = '33647426307';
const INSTAGRAM = 'https://www.instagram.com/leslivoirienne/';
const TIKTOK = 'https://www.tiktok.com/@leslivoirienne';
const PARIS = 'Europe/Paris';

export type Kind =
  | 'booking_request' | 'booking_new' | 'booking_paid' | 'booking_confirmed' | 'booking_reminder'
  | 'booking_moved' | 'booking_cancelled' | 'guide_link' | 'sale_new';

export interface Booking {
  id: string;
  offer_slug: string;
  starts_at: string;
  full_name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  meet_url: string;
  timezone: string;
  created_at?: string;
}
export interface Payment {
  id: string;
  provider: string;
  offer_slug: string;
  offer_name: string;
  amount_cents: number;
  customer_name: string;
  customer_email: string;
  booking_id: string | null;
  metadata: Record<string, unknown>;
}
export interface Ctx {
  kind: Kind;
  booking?: Booking | null;
  payment?: Payment | null;
  /** Montant déjà réglé pour la séance (centimes). */
  paidCents?: number;
  /** Prix de l'offre (centimes, catalogue serveur). */
  priceCents?: number;
  /** Lien de téléchargement du guide (guide_link). */
  downloadUrl?: string;
  /** Ancien horaire (booking_moved). */
  oldStartsAt?: string;
  /** Mot de Leslie (annulation, déplacement). */
  message?: string;
  now?: Date;
}
export interface Mail {
  subject: string;
  html: string;
  text: string;
  /** Fichier agenda (.ics) à joindre. */
  ics?: string;
}

/* ───────── Offres ───────── */
const OFFERS: Record<string, { name: string; minutes?: number; prep?: string }> = {
  'coaching-formulation': {
    name: 'Coaching Formulation',
    minutes: 60,
    prep: 'Gardez sous la main vos ingrédients, vos formules en cours ou les produits que vous aimeriez reproduire.',
  },
  'consultation-lancement-marque': {
    name: 'Consultation Lancement de Marque',
    minutes: 60,
    prep: 'Préparez quelques mots sur votre projet : vos produits phares, votre cible et l’étape où vous en êtes.',
  },
  'audit-orientation': {
    name: 'Audit d’orientation',
    minutes: 30,
    prep: 'Pensez à ce que vous attendez de l’échange : on fait le point ensemble sur la formule la plus adaptée.',
  },
  'guide-recettes-capillaires': { name: 'Guide de mes 10 meilleures recettes capillaires' },
  'guide-formulation': { name: 'Guide de formulation cosmétique' },
};
export const offerName = (slug: string, fallback = '') => OFFERS[slug]?.name ?? (fallback || slug);
const offerMinutes = (slug: string) => OFFERS[slug]?.minutes ?? 60;

/* ───────── Dates et heures ───────── */
export function safeTz(tz: string | null | undefined) {
  if (!tz) return PARIS;
  try {
    new Intl.DateTimeFormat('fr-FR', { timeZone: tz });
    return tz;
  } catch {
    return PARIS;
  }
}
const dayFmt = (tz: string) => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz });
const dayShortFmt = (tz: string) => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz });
const timeFmt = (tz: string) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: tz });
const ymd = (d: Date, tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);

const city = (tz: string) => (tz === PARIS ? 'Paris' : (tz.split('/').pop() ?? tz).replace(/_/g, ' '));
const de = (name: string) => (/^[aeiouyhâàéèêîïôûAEIOUYHÂÀÉÈÊÎÏÔÛ]/.test(name) ? `d’${name}` : `de ${name}`);

/** « samedi 28 novembre 2026 à 09:00 (heure de Paris) », dans le fuseau de la cliente. */
export function when(iso: string, tzRaw: string, opts: { year?: boolean } = {}) {
  const d = new Date(iso);
  const tz = safeTz(tzRaw);
  const day = (opts.year === false ? dayShortFmt(tz) : dayFmt(tz)).format(d);
  const t = timeFmt(tz).format(d);
  if (tz === PARIS) return { main: `${day} à ${t}`, zone: 'heure de Paris', paris: '' };
  const tp = timeFmt(PARIS).format(d);
  if (tp === t && ymd(d, tz) === ymd(d, PARIS)) return { main: `${day} à ${t}`, zone: `heure ${de(city(tz))}, comme à Paris`, paris: '' };
  const sameDay = ymd(d, tz) === ymd(d, PARIS);
  return {
    main: `${day} à ${t}`,
    zone: `heure ${de(city(tz))}`,
    paris: sameDay ? `${tp} à Paris` : `${dayShortFmt(PARIS).format(d)} à ${tp} à Paris`,
  };
}
const whenLine = (iso: string, tz: string, year = true) => {
  const w = when(iso, tz, { year });
  return `${w.main} (${w.zone})${w.paris ? ` — ${w.paris}` : ''}`;
};
/** Heure de Paris pour Leslie, avec l'heure locale de la cliente si elle est ailleurs. */
const whenParis = (iso: string, tzRaw: string) => {
  const d = new Date(iso);
  const tz = safeTz(tzRaw);
  let s = `${dayFmt(PARIS).format(d)} à ${timeFmt(PARIS).format(d)}`;
  if (tz !== PARIS && timeFmt(tz).format(d) !== timeFmt(PARIS).format(d)) s += ` (${timeFmt(tz).format(d)} pour la cliente, à ${city(tz)})`;
  return s;
};
const duration = (min: number) => (min >= 60 ? `${min / 60} h` : `${min} min`);
export const euros = (cents: number) =>
  `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}\u00a0€`;
const fcfa = (cents: number) => `${Math.round((cents / 100) * 655.957).toLocaleString('fr-FR')}\u00a0FCFA`;

export const firstName = (full: string) => {
  const n = String(full ?? '').trim().split(/\s+/)[0] ?? '';
  if (!n || n.length > 30) return '';
  return n.charAt(0).toLocaleUpperCase('fr-FR') + n.slice(1);
};

/* ───────── Agenda ───────── */
const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsEsc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/** Pliage des lignes .ics à 75 octets (UTF-8), comme le veut la norme. */
const fold = (line: string) => {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
};

function eventInfo(b: Booking) {
  const start = new Date(b.starts_at);
  const end = new Date(start.getTime() + offerMinutes(b.offer_slug) * 60000);
  const title = `${offerName(b.offer_slug)} avec Leslie Cosmétique`;
  const details = [
    `Séance en visio avec Leslie (Leslie Cosmétique).`,
    b.meet_url ? `Lien de la visio : ${b.meet_url}` : 'Le lien de la visio vous est envoyé par e-mail.',
    `Un empêchement ? Prévenez Leslie au moins 48 h avant en répondant à l’e-mail de confirmation.`,
  ].join('\n');
  return { start, end, title, details };
}

export function googleCalendarUrl(b: Booking) {
  const e = eventInfo(b);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${utcStamp(e.start)}/${utcStamp(e.end)}`,
    details: e.details,
    location: b.meet_url || 'Visio',
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function icsFile(b: Booking, now = new Date()) {
  const e = eventInfo(b);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Leslie Cosmetique//Rendez-vous//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${b.id}@leslie.phoenixpro.fr`,
    `SEQUENCE:${Math.floor(now.getTime() / 1000) - 1790000000}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(e.start)}`,
    `DTEND:${utcStamp(e.end)}`,
    `SUMMARY:${icsEsc(e.title)}`,
    `DESCRIPTION:${icsEsc(e.details)}`,
    `LOCATION:${icsEsc(b.meet_url || 'Visio')}`,
    ...(b.meet_url ? [`URL:${b.meet_url}`] : []),
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Rendez-vous avec Leslie dans 1 heure',
    'TRIGGER:-PT1H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/* ───────── Liens ───────── */
const waUrl = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
const payUrl = (b: Booking) => `${SITE}/payer?r=${b.id}&utm_source=email&utm_campaign=paiement-seance`;
const mobileMoneyUrl = (b: Booking, priceCents: number) =>
  waUrl(
    `Bonjour Leslie, j’ai réservé « ${offerName(b.offer_slug)} » (${euros(priceCents)}, soit ${fcfa(priceCents)}) pour le ${whenLine(b.starts_at, b.timezone, false)}, au nom de ${b.full_name}. Je souhaite régler par Mobile Money.`,
  );

/* ───────── Mise en page ───────── */
const C = {
  page: '#F3E7DC',
  card: '#FFFBF6',
  soft: '#FBF5EF',
  ink: '#3A2A22',
  brown: '#6B4A38',
  caramel: '#96633F',
  line: '#E8D2C3',
  sand: '#D9C4AC',
  green: '#3F6B3A',
  greenBg: '#E7EFE3',
  red: '#9B3B2A',
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nl2br = (s: string) => esc(s).replace(/\r?\n/g, '<br>');

const p = (html: string, style = '') =>
  `<p style="margin:0 0 14px 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${C.ink};${style}">${html}</p>`;

function button(label: string, href: string, variant: 'dark' | 'light' = 'dark') {
  const bg = variant === 'dark' ? C.ink : C.card;
  const color = variant === 'dark' ? '#FFFFFF' : C.ink;
  const border = variant === 'dark' ? C.ink : C.sand;
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;"><tr>
<td align="center" bgcolor="${bg}" style="border-radius:999px;background:${bg};border:1px solid ${border};">
<a href="${esc(href)}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:14.5px;font-weight:600;line-height:1.2;color:${color};text-decoration:none;border-radius:999px;">${label}</a>
</td></tr></table>`;
}
const buttons = (...list: string[]) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:6px 0 18px 0;">${list
    .map((b) => `<tr><td align="center" style="padding:5px 0;">${b}</td></tr>`)
    .join('')}</table>`;

/** Encadré récapitulatif : lignes « libellé / valeur ». */
function summary(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 20px 0;background:${C.soft};border:1px solid ${C.line};border-radius:14px;">
${rows
  .map(
    ([k, v], i) => `<tr><td style="padding:${i === 0 ? 16 : 10}px 20px ${i === rows.length - 1 ? 16 : 0}px 20px;">
<div style="font-family:${SANS};font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:${C.caramel};font-weight:600;">${k}</div>
<div style="margin-top:3px;font-family:${SANS};font-size:15px;line-height:1.5;color:${C.ink};">${v}</div></td></tr>`,
  )
  .join('')}
</table>`;
}

const quote = (label: string, text: string) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 18px 0;"><tr>
<td style="border-left:3px solid ${C.sand};padding:4px 0 4px 14px;">
<div style="font-family:${SANS};font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${C.caramel};font-weight:600;">${label}</div>
<div style="margin-top:4px;font-family:${SERIF};font-style:italic;font-size:16px;line-height:1.55;color:${C.brown};">${nl2br(text)}</div>
</td></tr></table>`;

const h2 = (t: string) =>
  `<h2 style="margin:22px 0 8px 0;font-family:${SERIF};font-weight:normal;font-size:20px;line-height:1.3;color:${C.ink};">${t}</h2>`;

const bullets = (items: string[]) =>
  `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:2px 0 16px 0;">${items
    .map(
      (t) => `<tr><td width="20" valign="top" style="padding:8px 0 0 2px;"><div style="width:7px;height:7px;border-radius:7px;background:${C.caramel};font-size:0;line-height:0;">&nbsp;</div></td>
<td style="padding:2px 0 6px 0;font-family:${SANS};font-size:14.5px;line-height:1.6;color:${C.ink};">${t}</td></tr>`,
    )
    .join('')}</table>`;

const badge = (label: string, tone: 'green' | 'gold' | 'red' = 'gold') => {
  const [bg, fg] = tone === 'green' ? [C.greenBg, C.green] : tone === 'red' ? ['#F6E1DB', C.red] : ['#F3E3C4', '#7A4F12'];
  return `<span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${bg};color:${fg};font-family:${SANS};font-size:11px;letter-spacing:1.4px;text-transform:uppercase;font-weight:600;">${label}</span>`;
};

const signature = () => `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 4px 0;"><tr>
<td valign="middle" style="padding-right:14px;"><img src="${SITE}/email/leslie.jpg" width="54" height="54" alt="Leslie" style="display:block;width:54px;height:54px;border-radius:54px;border:0;"></td>
<td valign="middle" style="font-family:${SANS};font-size:13.5px;line-height:1.45;color:${C.brown};">
<div style="font-family:${SERIF};font-style:italic;font-size:19px;color:${C.ink};">Leslie</div>
Leslie Cosmétique · formulation et soins naturels</td></tr></table>`;

interface Layout {
  preheader: string;
  badge?: string;
  title: string;
  body: string;
  /** E-mail destiné à Leslie (pas de signature, pied de page simplifié). */
  internal?: boolean;
}

function layout(l: Layout) {
  const footer = l.internal
    ? `Notification automatique de votre site · <a href="${ADMIN}/admin/parametres" style="color:${C.brown};">régler les e-mails</a>`
    : `Une question ? Répondez simplement à cet e-mail ou écrivez-moi sur <a href="https://wa.me/${WHATSAPP}" style="color:${C.brown};">WhatsApp</a>.<br>
<a href="${SITE}" style="color:${C.brown};">leslie.phoenixpro.fr</a> · <a href="${INSTAGRAM}" style="color:${C.brown};">Instagram</a> · <a href="${TIKTOK}" style="color:${C.brown};">TikTok</a>`;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>${esc(l.title)}</title></head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};font-size:1px;line-height:1px;">${esc(l.preheader)}${'&nbsp;&zwnj;'.repeat(40)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.page}" style="background:${C.page};"><tr><td align="center" style="padding:28px 12px 36px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;">
<tr><td align="center" style="padding:0 0 18px 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
    <td align="center" valign="middle" width="44" height="44" bgcolor="${C.ink}" style="width:44px;height:44px;border-radius:44px;background:${C.ink};font-family:${SERIF};font-size:17px;color:#FBF5EF;">LC</td>
  </tr></table>
  <div style="margin-top:9px;font-family:${SANS};font-size:10.5px;letter-spacing:3.4px;text-transform:uppercase;color:${C.brown};">Leslie Cosmétique</div>
</td></tr>
<tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-radius:20px;padding:34px 30px 30px 30px;">
  ${l.badge ?? ''}
  <h1 style="margin:${l.badge ? '14px' : '0'} 0 16px 0;font-family:${SERIF};font-weight:normal;font-size:27px;line-height:1.25;color:${C.ink};">${l.title}</h1>
  ${l.body}
  ${l.internal ? '' : signature()}
</td></tr>
<tr><td align="center" style="padding:20px 18px 0 18px;font-family:${SANS};font-size:12.5px;line-height:1.7;color:${C.brown};">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

/** Version texte : on retire les balises de la version HTML. */
function toText(html: string) {
  return html
    .replace(/<head>[\s\S]*?<\/head>/i, '')
    .replace(/<div style="display:none[\s\S]*?<\/div>/i, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
      const l = label.replace(/<[^>]+>/g, '').trim();
      return l && !href.startsWith('mailto:') && !href.startsWith('tel:') ? `${l} : ${href.replace(/&amp;/g, '&')}` : l;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h1|h2|tr|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&zwnj;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .split('\n')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s, i, a) => s || (a[i - 1] ?? '') !== '')
    .join('\n')
    .trim();
}

/* ───────── Blocs réutilisés ───────── */
function bookingRows(b: Booking, extra: [string, string][] = []): [string, string][] {
  const w = when(b.starts_at, b.timezone);
  return [
    ['Séance', esc(offerName(b.offer_slug))],
    [
      'Date et heure',
      `<span style="text-transform:none;">${esc(w.main.charAt(0).toUpperCase() + w.main.slice(1))}</span><br><span style="font-size:13px;color:${C.brown};">${esc(w.zone)}${w.paris ? ` · ${esc(w.paris)}` : ''}</span>`,
    ],
    ['Durée', `${duration(offerMinutes(b.offer_slug))} · en visio`],
    ...extra,
  ];
}

function paymentBlock(b: Booking, priceCents: number, lead = 'Pour finaliser votre réservation, réglez votre séance') {
  return (
    h2('Régler votre séance') +
    p(`${lead} : <strong>${euros(priceCents)}</strong> par carte, ou <strong>${fcfa(priceCents)}</strong> par Mobile Money.`) +
    buttons(button(`Payer par carte · ${euros(priceCents)}`, payUrl(b)), button('Payer par Mobile Money', mobileMoneyUrl(b, priceCents), 'light')) +
    p(`Paiement par carte sécurisé par Stripe. Mobile Money (Orange Money, MTN, Wave…) : un message est préparé pour moi sur WhatsApp et je vous explique comment payer.`, `font-size:13px;color:${C.brown};`)
  );
}

function joinBlock(b: Booking) {
  const list = [];
  if (b.meet_url) list.push(button('Rejoindre la visio', b.meet_url));
  list.push(button('Ajouter à mon agenda Google', googleCalendarUrl(b), 'light'));
  return buttons(...list);
}

/* ───────── Modèles ───────── */
export function render(ctx: Ctx): Mail {
  const now = ctx.now ?? new Date();
  const b = ctx.booking ?? null;
  const pay = ctx.payment ?? null;
  const price = ctx.priceCents ?? 0;
  const paid = (ctx.paidCents ?? 0) > 0;

  switch (ctx.kind) {
    case 'booking_request': {
      if (!b) throw new Error('réservation manquante');
      const name = firstName(b.full_name);
      const w = when(b.starts_at, b.timezone, { year: false });
      const body =
        p(`J’ai bien reçu votre demande de rendez-vous, merci pour votre confiance. Votre créneau est bloqué : je vous confirme la séance très vite par e-mail, avec le lien de la visio.`) +
        summary(bookingRows(b, price ? [['Tarif', paid ? `${euros(price)} · <span style="color:${C.green};font-weight:600;">réglé</span>` : euros(price)]] : [])) +
        (b.message ? quote('Votre message', b.message) : '') +
        (!paid && price ? paymentBlock(b, price) : '') +
        p(`Un empêchement ou une question ? Répondez simplement à cet e-mail. Pour décaler la séance, prévenez-moi au moins 48&nbsp;h avant.`, 'margin-top:6px;');
      return finish(
        {
          preheader: `${offerName(b.offer_slug)} · ${w.main}. Je vous confirme le rendez-vous très vite.`,
          badge: badge('Demande reçue'),
          title: name ? `Merci ${esc(name)}, votre créneau est réservé` : 'Merci, votre créneau est réservé',
          body,
        },
        `Votre demande de rendez-vous est bien reçue · ${offerName(b.offer_slug)}`,
      );
    }

    case 'booking_new': {
      if (!b) throw new Error('réservation manquante');
      const phone = b.phone.replace(/[^\d+]/g, '');
      const wa = phone.replace(/^\+/, '').replace(/^0(?=\d{9}$)/, '33');
      const rows: [string, string][] = [
        ['Cliente', esc(b.full_name)],
        ['E-mail', `<a href="mailto:${esc(b.email)}" style="color:${C.ink};">${esc(b.email)}</a>`],
        ...(b.phone ? ([['Téléphone', `<a href="tel:${esc(phone)}" style="color:${C.ink};">${esc(b.phone)}</a> · <a href="https://wa.me/${esc(wa)}" style="color:${C.caramel};">WhatsApp</a>`]] as [string, string][]) : []),
        ['Séance', `${esc(offerName(b.offer_slug))} · ${duration(offerMinutes(b.offer_slug))}`],
        ['Date et heure (Paris)', esc(whenParis(b.starts_at, b.timezone))],
      ];
      const body =
        p(`Une nouvelle demande de rendez-vous vient d’arriver sur le site. La cliente a reçu un accusé de réception ; elle attend votre confirmation avec le lien de la visio.`) +
        summary(rows) +
        (b.message ? quote('Son message', b.message) : '') +
        buttons(button('Confirmer dans l’agenda', `${ADMIN}/admin/agenda`)) +
        p(`Astuce : répondez à cet e-mail pour écrire directement à ${esc(firstName(b.full_name) || b.full_name)}.`, `font-size:13px;color:${C.brown};text-align:center;`);
      const t = timeFmt(PARIS).format(new Date(b.starts_at));
      const d = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: PARIS }).format(new Date(b.starts_at));
      return finish(
        { preheader: `${b.full_name} · ${offerName(b.offer_slug)} · ${d} à ${t}`, badge: badge('Nouvelle réservation'), title: `${esc(b.full_name)} a réservé une séance`, body, internal: true },
        `Nouvelle réservation : ${offerName(b.offer_slug)} · ${d} à ${t} · ${b.full_name}`,
      );
    }

    case 'booking_paid': {
      if (!b || !pay) throw new Error('réservation ou paiement manquant');
      const name = firstName(b.full_name);
      const confirmed = b.status === 'confirmed';
      const body =
        p(`J’ai bien reçu votre règlement de <strong>${euros(pay.amount_cents)}</strong>, merci&nbsp;! ${confirmed ? 'Votre rendez-vous est confirmé : voici le récapitulatif.' : 'Je vous confirme le rendez-vous très vite, avec le lien de la visio.'}`) +
        summary(bookingRows(b, [['Paiement', `${euros(pay.amount_cents)} · par carte · <span style="color:${C.green};font-weight:600;">reçu</span>`]])) +
        (confirmed ? joinBlock(b) : '') +
        p(`Vous recevez aussi le reçu de Stripe, notre prestataire de paiement. Un empêchement ? Répondez simplement à cet e-mail, au moins 48&nbsp;h avant la séance.`);
      return finish(
        { preheader: `Règlement de ${euros(pay.amount_cents)} reçu pour votre ${offerName(b.offer_slug)}.`, badge: badge('Paiement reçu', 'green'), title: name ? `Merci ${esc(name)}, c’est réglé` : 'Merci, c’est réglé', body },
        `Paiement reçu pour votre séance · ${offerName(b.offer_slug)}`,
      );
    }

    case 'booking_confirmed': {
      if (!b) throw new Error('réservation manquante');
      const name = firstName(b.full_name);
      const w = when(b.starts_at, b.timezone, { year: false });
      const prep = OFFERS[b.offer_slug]?.prep;
      const body =
        p(`Bonne nouvelle : votre rendez-vous est confirmé. J’ai hâte d’échanger avec vous&nbsp;!`) +
        summary(bookingRows(b, [['Lien de la visio', b.meet_url ? `<a href="${esc(b.meet_url)}" style="color:${C.caramel};word-break:break-all;">${esc(b.meet_url)}</a>` : 'Je vous l’envoie par e-mail avant la séance.']])) +
        joinBlock(b) +
        p(`Le fichier joint <em>rendez-vous.ics</em> ajoute aussi la séance à Apple Calendrier ou Outlook.`, `font-size:13px;color:${C.brown};text-align:center;`) +
        (!paid && price ? paymentBlock(b, price, 'Il reste à régler votre séance') : '') +
        h2('Pour bien préparer la séance') +
        bullets([
          'Installez-vous au calme, avec une bonne connexion (ordinateur ou téléphone).',
          'Notez vos questions à l’avance : on avance plus vite et vous n’oubliez rien.',
          ...(prep ? [prep] : []),
        ]) +
        p(`Un empêchement ? Prévenez-moi au moins 48&nbsp;h avant en répondant à cet e-mail : on trouve un autre créneau.`);
      return finish(
        { preheader: `${offerName(b.offer_slug)} · ${w.main}. Le lien de la visio est dans cet e-mail.`, badge: badge('Rendez-vous confirmé', 'green'), title: name ? `C’est confirmé, ${esc(name)}&nbsp;!` : 'C’est confirmé&nbsp;!', body },
        `Votre rendez-vous est confirmé · ${w.main.charAt(0).toUpperCase() + w.main.slice(1)}`,
        icsFile(b, now),
      );
    }

    case 'booking_reminder': {
      if (!b) throw new Error('réservation manquante');
      const name = firstName(b.full_name);
      const tz = safeTz(b.timezone);
      const start = new Date(b.starts_at);
      const today = ymd(now, tz) === ymd(start, tz);
      const t = timeFmt(tz).format(start);
      const moment = today ? `aujourd’hui à ${t}` : `demain à ${t}`;
      const body =
        p(`Petit rappel : votre séance <strong>${esc(offerName(b.offer_slug))}</strong> a lieu ${moment}. Tout est prêt de mon côté&nbsp;!`) +
        summary(bookingRows(b, b.meet_url ? [['Lien de la visio', `<a href="${esc(b.meet_url)}" style="color:${C.caramel};word-break:break-all;">${esc(b.meet_url)}</a>`]] : [])) +
        joinBlock(b) +
        (!b.meet_url ? p('Le lien de la visio vous sera envoyé juste avant la séance.') : '') +
        (!paid && price ? paymentBlock(b, price, 'Pensez à régler votre séance avant le rendez-vous') : '') +
        p(`Un imprévu ? Répondez vite à cet e-mail ou écrivez-moi sur WhatsApp.`);
      return finish(
        { preheader: `${offerName(b.offer_slug)} ${moment}. Le lien de la visio est dans cet e-mail.`, badge: badge('Rappel'), title: today ? `À tout à l’heure${name ? `, ${esc(name)}` : ''}&nbsp;!` : `À demain${name ? `, ${esc(name)}` : ''}&nbsp;!`, body },
        `Rappel : votre rendez-vous ${moment}`,
      );
    }

    case 'booking_moved': {
      if (!b) throw new Error('réservation manquante');
      const name = firstName(b.full_name);
      const w = when(b.starts_at, b.timezone, { year: false });
      const confirmed = b.status === 'confirmed';
      const old = ctx.oldStartsAt ? when(ctx.oldStartsAt, b.timezone, { year: false }) : null;
      const body =
        p(`Votre séance a été déplacée. Voici le nouvel horaire${old ? ` (au lieu du <span style="text-decoration:line-through;color:${C.brown};">${esc(old.main)}</span>)` : ''}.`) +
        (ctx.message ? quote('Mon message', ctx.message) : '') +
        summary(bookingRows(b, confirmed && b.meet_url ? [['Lien de la visio', `<a href="${esc(b.meet_url)}" style="color:${C.caramel};word-break:break-all;">${esc(b.meet_url)}</a>`]] : [])) +
        (confirmed ? joinBlock(b) : p('Je vous confirme ce nouvel horaire très vite, avec le lien de la visio.')) +
        p(`Cet horaire ne vous convient pas ? Répondez simplement à cet e-mail et on en trouve un autre.`);
      return finish(
        { preheader: `Nouvel horaire : ${w.main}.`, badge: badge('Nouvel horaire'), title: name ? `${esc(name)}, votre rendez-vous change d’horaire` : 'Votre rendez-vous change d’horaire', body },
        `Votre rendez-vous a été déplacé · ${w.main.charAt(0).toUpperCase() + w.main.slice(1)}`,
        confirmed ? icsFile(b, now) : undefined,
      );
    }

    case 'booking_cancelled': {
      if (!b) throw new Error('réservation manquante');
      const name = firstName(b.full_name);
      const w = when(b.starts_at, b.timezone, { year: false });
      const body =
        p(`Votre rendez-vous <strong>${esc(offerName(b.offer_slug))}</strong> du ${esc(w.main)} (${esc(w.zone)}) est annulé.`) +
        (ctx.message ? quote('Mon message', ctx.message) : '') +
        (paid ? p(`Vous aviez déjà réglé la séance : je reviens vers vous pour la reporter ou vous rembourser, comme vous préférez.`) : '') +
        p(`Vous pouvez choisir un nouveau créneau quand vous le souhaitez :`) +
        buttons(button('Choisir un nouveau créneau', `${SITE}/reserver/${b.offer_slug}?utm_source=email&utm_campaign=annulation`)) +
        p(`Une question ? Répondez simplement à cet e-mail.`);
      return finish(
        { preheader: `${offerName(b.offer_slug)} du ${w.main} : rendez-vous annulé.`, badge: badge('Rendez-vous annulé', 'red'), title: name ? `${esc(name)}, votre rendez-vous est annulé` : 'Votre rendez-vous est annulé', body },
        `Votre rendez-vous du ${w.main} est annulé`,
      );
    }

    case 'guide_link': {
      if (!pay || !ctx.downloadUrl) throw new Error('paiement ou lien manquant');
      const name = firstName(pay.customer_name);
      const title = offerName(pay.offer_slug, pay.offer_name);
      const body =
        p(`Merci pour votre achat&nbsp;! Votre guide <strong>${esc(title)}</strong> est prêt : téléchargez-le avec le bouton ci-dessous.`) +
        buttons(button('Télécharger mon guide (PDF)', ctx.downloadUrl)) +
        summary([
          ['Votre guide', esc(title)],
          ['Montant', `${euros(pay.amount_cents)} · <span style="color:${C.green};font-weight:600;">réglé</span>`],
          ['Lien de téléchargement', 'Actif 7 jours. Le fichier vous appartient ensuite sans limite de durée.'],
        ]) +
        h2('Bien garder votre guide') +
        bullets([
          'Sur téléphone : ouvrez le PDF puis « Partager » → « Enregistrer dans Fichiers » (iPhone) ou « Télécharger » (Android).',
          'Sur ordinateur : le fichier arrive dans le dossier Téléchargements.',
          'Lien expiré ou fichier perdu ? Répondez à cet e-mail : je vous le renvoie.',
        ]) +
        p(`Bonne lecture, et n’hésitez pas à me montrer vos créations sur <a href="${INSTAGRAM}" style="color:${C.caramel};">Instagram</a>&nbsp;!`);
      return finish(
        { preheader: `Votre guide « ${title} » est prêt à télécharger.`, badge: badge('Merci pour votre achat', 'green'), title: name ? `${esc(name)}, voici votre guide` : 'Voici votre guide', body },
        `Votre guide est prêt à télécharger · ${title}`,
      );
    }

    case 'sale_new': {
      if (!pay) throw new Error('paiement manquant');
      const title = offerName(pay.offer_slug, pay.offer_name);
      const src = String(pay.metadata?.source ?? '');
      const camp = String(pay.metadata?.campaign ?? '');
      const SRC: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', whatsapp: 'WhatsApp', google: 'Google', email: 'E-mail', direct: 'Accès direct' };
      const rows: [string, string][] = [
        ['Offre', esc(title)],
        ['Montant', `<strong>${euros(pay.amount_cents)}</strong> · par carte (Stripe)`],
        ['Cliente', `${esc(pay.customer_name || '—')}${pay.customer_email ? `<br><a href="mailto:${esc(pay.customer_email)}" style="color:${C.ink};">${esc(pay.customer_email)}</a>` : ''}`],
        ...(b ? ([['Rendez-vous', esc(whenParis(b.starts_at, b.timezone))]] as [string, string][]) : []),
        ...(src ? ([['Venue de', `${esc(SRC[src] ?? src)}${camp ? ` · lien « ${esc(camp)} »` : ''}`]] as [string, string][]) : []),
      ];
      const body =
        p(b ? 'Une séance vient d’être réglée en ligne.' : pay.offer_slug.startsWith('guide') ? 'Un guide vient d’être acheté. La cliente a reçu automatiquement son lien de téléchargement par e-mail.' : 'Un paiement vient d’arriver sur le site.') +
        summary(rows) +
        buttons(button(b ? 'Voir l’agenda' : 'Voir les paiements', `${ADMIN}/admin/${b ? 'agenda' : 'paiements'}`));
      return finish(
        { preheader: `${title} · ${euros(pay.amount_cents)}${pay.customer_name ? ` · ${pay.customer_name}` : ''}`, badge: badge('Nouvelle vente', 'green'), title: `+ ${euros(pay.amount_cents)} : ${esc(title)}`, body, internal: true },
        `Nouvelle vente : ${title} · ${euros(pay.amount_cents)}`,
      );
    }
  }
  throw new Error(`modèle inconnu : ${ctx.kind}`);
}

function finish(l: Layout, subject: string, ics?: string): Mail {
  const html = layout(l);
  return { subject: subject.replace(/\u00a0/g, ' '), html, text: toText(html), ics };
}

/* ───────── Données d'exemple (aperçu depuis l'admin) ───────── */
export function sample(kind: Kind, meetUrl: string, now = new Date()) {
  // samedi prochain, 10:00 à Paris
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7 || 7));
  const iso = `${d.toISOString().slice(0, 10)}T09:00:00Z`;
  const booking: Booking = {
    id: '00000000-0000-4000-8000-000000000000',
    offer_slug: 'coaching-formulation',
    starts_at: iso,
    full_name: 'Aïcha Koné',
    email: 'aicha.kone@example.com',
    phone: '+225 07 00 00 00 00',
    message: 'Bonjour Leslie, j’aimerais apprendre à formuler un beurre nourrissant pour mes cheveux crépus.',
    status: kind === 'booking_moved' || kind === 'booking_reminder' || kind === 'booking_confirmed' ? 'confirmed' : 'pending',
    meet_url: meetUrl || 'https://meet.google.com/abc-defg-hij',
    timezone: 'Africa/Abidjan',
  };
  const payment: Payment = {
    id: '00000000-0000-4000-8000-000000000001',
    provider: 'stripe',
    offer_slug: kind === 'booking_paid' ? 'coaching-formulation' : 'guide-recettes-capillaires',
    offer_name: '',
    amount_cents: kind === 'booking_paid' ? 6000 : 5500,
    customer_name: 'Aïcha Koné',
    customer_email: 'aicha.kone@example.com',
    booking_id: kind === 'booking_paid' ? booking.id : null,
    metadata: { source: 'instagram', campaign: 'insta' },
  };
  const reminderNow = new Date(new Date(iso).getTime() - 20 * 3600000);
  return {
    kind,
    booking: kind === 'guide_link' || kind === 'sale_new' ? null : booking,
    payment: kind === 'booking_paid' || kind === 'guide_link' || kind === 'sale_new' ? payment : null,
    paidCents: kind === 'booking_paid' ? 6000 : 0,
    priceCents: 6000,
    downloadUrl: `${SITE}/offres/guide-recettes-capillaires`,
    oldStartsAt: new Date(new Date(iso).getTime() - 86400000).toISOString(),
    message: kind === 'booking_moved' || kind === 'booking_cancelled' ? 'Un imprévu de mon côté, désolée ! Merci de votre compréhension.' : '',
    now: kind === 'booking_reminder' ? reminderNow : now,
  } satisfies Ctx;
}
