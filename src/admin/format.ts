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
