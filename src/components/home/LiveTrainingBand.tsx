import { ArrowRight } from 'lucide-react';
import { liveTraining, offerPath } from '@/data/offers';
import { useEnrollment } from '@/lib/enrollment';
import { Link } from '@/lib/router';
import { CountdownLine } from '@/components/Countdown';

/** Bandeau discret d'accueil : formation en direct, dates et compte à rebours. Disparaît à la clôture. */
export function LiveTrainingBand() {
  const offer = liveTraining;
  const state = useEnrollment(offer?.enrollment);
  if (!offer?.enrollment || !state?.open) return null;

  return (
    <section className="border-b border-sand/60 bg-nude/70" aria-label="Formation en direct">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-2.5 px-5 py-3.5 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8">
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-brown">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-espresso px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white-warm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sand" aria-hidden /> En direct
          </span>
          <span className="font-serif-lc text-[17px] leading-tight text-espresso">{offer.name}</span>
          <span>· les {offer.enrollment.datesLabel}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <CountdownLine offer={offer} where="home_band" />
          <Link to={offerPath(offer)} trackName="home_band_formation" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-espresso">
            <span className="link-line">Découvrir la formation</span>
            <ArrowRight size={14} strokeWidth={1.8} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
