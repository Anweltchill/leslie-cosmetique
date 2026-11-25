import { site } from '@/data/site';
import { formatPrice } from '@/data/offers';
import { compareAtPrice, promoActive, promoPercent } from '@/lib/promo';

/** Prix barré, à placer à côté du prix payé. N'affiche rien si la promotion est désactivée. */
export function WasPrice({ price, className = '' }: { price: number; className?: string }) {
  if (!promoActive || compareAtPrice(price) <= price) return null;
  return (
    <s className={`whitespace-nowrap decoration-[1.5px] opacity-60 ${className}`}>
      <span className="sr-only">Au lieu de </span>
      {formatPrice(compareAtPrice(price))}
    </s>
  );
}

/** Pastille « −30 % ». */
export function PromoBadge({ className = '' }: { className?: string }) {
  if (!promoActive) return null;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full bg-[#9b3b2a] px-2.5 py-1 font-sans text-[11px] font-medium leading-none tracking-wide text-white-warm ${className}`}>
      −{promoPercent} %
    </span>
  );
}

/** Bandeau défilant en haut du site (dans la barre de navigation). */
export function PromoBanner() {
  if (!promoActive) return null;
  const items = Array.from({ length: 6 }, () => site.promo.banner);
  return (
    <div className="relative flex h-8 items-center overflow-hidden bg-espresso text-white-warm" role="region" aria-label="Promotion en cours">
      <p className="sr-only">{site.promo.banner}</p>
      <div className="flex" aria-hidden>
        {[0, 1].map((half) => (
          <div key={half} className="marquee-track flex shrink-0 items-center gap-8 pr-8">
            {items.map((t, i) => (
              <span key={i} className="flex items-center gap-8 whitespace-nowrap text-[11.5px] font-medium uppercase tracking-[0.16em]">
                {t}
                <span className="block h-1 w-1 rounded-full bg-sand" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
