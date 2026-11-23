import { site } from '@/data/site';

/** Promotion en cours (voir `site.promo`). */
export const promoActive = site.promo.active;
export const promoPercent = site.promo.percent;

/** Prix barré (prix habituel) correspondant à un prix remisé, arrondi à l'euro. */
export const compareAtPrice = (price: number) => Math.round(price / (1 - promoPercent / 100));
