/** Formats d'affichage et classes communes de l'espace admin. */
const TZ = 'Europe/Paris';
export const fmtDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
export const fmtDateTime = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ });
export const fmtTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
export const fmtDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
export const euros = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
export const num = (n: number) => new Intl.NumberFormat('fr-FR').format(n);


export const inputCls =
  'w-full rounded-[10px] border border-sand bg-white-warm px-3 py-2 text-[13.5px] text-espresso placeholder:text-brown/50 focus:border-caramel focus:outline-none';
export const btnCls =
  'inline-flex items-center justify-center gap-2 rounded-full bg-espresso px-4 py-2 text-[13px] font-medium text-white-warm transition-colors hover:bg-brown disabled:opacity-50';
export const btnGhostCls =
  'inline-flex items-center justify-center gap-2 rounded-full border border-sand px-4 py-2 text-[13px] font-medium text-espresso transition-colors hover:bg-nude disabled:opacity-50';

/** Décalage (ms) de l'heure de Paris par rapport à UTC à un instant donné. */
const parisOffset = (t: number) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(t))
      .map((p) => [p.type, p.value]),
  );
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) - t;
};
/** « 2026-11-28 » + « 09:00 » (heure de Paris) → instant UTC. */
export function parisToDate(day: string, time: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m || !t) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]);
  let ts = guess - parisOffset(guess);
  ts = guess - parisOffset(ts);
  return new Date(ts);
}
/** Instant → { day: « 2026-11-28 », time: « 09:00 » } en heure de Paris. */
export function dateToParis(d: Date) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
  const time = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
  return { day, time };
}
