import { ArrowUpRight } from 'lucide-react';
import { type Offer, offerPath, formatPrice } from '@/data/offers';
import { Link } from '@/lib/router';
import { CountdownLine } from '@/components/Countdown';

interface Props {
  offer: Offer;
  index?: number;
}

export function OfferCard({ offer, index = 0 }: Props) {
  return (
    <Link
      to={offerPath(offer)}
      trackName={`offer_card_${offer.slug}`}
      className="offer-card group relative flex h-full w-[72vw] max-w-[300px] shrink-0 snap-center flex-col overflow-hidden rounded-[20px] border border-sand/70 bg-white-warm shadow-[0_16px_40px_-30px_rgba(107,74,56,0.35)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_55px_-28px_rgba(107,74,56,0.45)] md:w-auto md:max-w-none"
      ariaLabel={offer.name}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={offer.image}
          alt={offer.imageAlt}
          loading={index > 1 ? 'lazy' : undefined}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/30 via-transparent to-transparent" />
        {offer.badge && (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-cream/95 px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-brown">
            {offer.badge}
          </span>
        )}
        <span className="absolute right-3.5 top-3.5 rounded-full bg-espresso/75 px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white-warm backdrop-blur-sm">
          {offer.kind === 'formation' ? 'Formation' : 'Coaching'}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-serif-lc text-[20px] leading-tight text-espresso">{offer.shortName}</h3>
        <p className="text-[13px] leading-relaxed text-brown">{offer.tagline}</p>
        {offer.enrollment && <CountdownLine offer={offer} where={`offer_card_${offer.slug}`} />}
        <div className="mt-auto flex items-end justify-between pt-2.5">
          <div>
            <p className="font-serif-lc text-[22px] font-medium leading-none text-espresso transition-transform duration-300 group-hover:-translate-y-0.5">
              {formatPrice(offer.price)}
            </p>
            {(offer.duration || offer.priceNote) && (
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-brown">{offer.duration ?? offer.priceNote}</p>
            )}
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border border-sand text-espresso transition-all duration-300 group-hover:border-espresso group-hover:bg-espresso group-hover:text-cream"
            aria-hidden
          >
            <ArrowUpRight size={17} strokeWidth={1.8} className="transition-transform duration-300 group-hover:rotate-45" />
          </span>
        </div>
      </div>
    </Link>
  );
}
