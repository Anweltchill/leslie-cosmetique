import { ArrowRight, Compass } from 'lucide-react';
import { auditOffer, bookingHref, formatPrice, offerPath } from '@/data/offers';
import { Link } from '@/lib/router';
import { track } from '@/lib/track';
import { MagneticButton } from '@/components/MagneticButton';
import { Reveal } from '@/components/Reveal';
import { WasPrice } from '@/components/Promo';

/** Bloc d'accueil « Vous ne savez pas par où commencer ? » (point d'entrée vers l'audit). */
export function AuditHomeBlock() {
  const audit = auditOffer;
  if (!audit) return null;
  const href = bookingHref(audit);
  const internal = href.startsWith('/');

  return (
    <section className="mx-auto max-w-[1120px] px-5 pb-4 md:px-8 md:pb-6" aria-label="Audit d'orientation">
      <Reveal>
        <div className="flex flex-col gap-5 rounded-[22px] border border-sand/70 bg-nude/60 p-6 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white-warm text-espresso">
              <Compass size={19} strokeWidth={1.6} aria-hidden />
            </span>
            <div>
              <h2 className="font-serif-lc text-[24px] leading-tight text-espresso md:text-[28px]">Vous ne savez pas par où commencer ?</h2>
              <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-brown">{audit.paragraphs[0] as string}</p>
              <p className="mt-2 text-[12.5px] font-medium uppercase tracking-[0.12em] text-caramel">
                Audit · {audit.duration} · <WasPrice price={audit.price} className="mr-1" />{formatPrice(audit.price)}
              </p>
            </div>
          </div>
          <MagneticButton
            to={internal ? href : undefined}
            href={internal ? undefined : href}
            trackName="audit_book_home_block"
            onClick={() => track('audit_book_click', { where: 'home_block' })}
            className="shrink-0 self-start md:self-center"
          >
            Réserver un audit de 30 min
          </MagneticButton>
        </div>
      </Reveal>
    </section>
  );
}

/** Carte discrète « Pas sûre de votre choix ? » (pages Formations et Coachings). */
export function AuditHint({ where }: { where: string }) {
  const audit = auditOffer;
  if (!audit) return null;
  return (
    <Reveal>
      <Link
        to={offerPath(audit)}
        trackName={`audit_hint_${where}`}
        className="group flex flex-col gap-4 rounded-[22px] border border-dashed border-sand bg-cream p-5 transition-colors duration-300 hover:border-caramel hover:bg-white-warm md:flex-row md:items-center md:justify-between md:p-6"
      >
        <span className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nude text-espresso">
            <Compass size={17} strokeWidth={1.6} aria-hidden />
          </span>
          <span>
            <span className="block font-serif-lc text-[21px] leading-tight text-espresso">Pas sûre de votre choix ?</span>
            <span className="mt-1 block max-w-[560px] text-[13.5px] leading-snug text-brown">
              Un audit de {audit.duration} (<WasPrice price={audit.price} className="mr-1" />{formatPrice(audit.price)}) pour vous orienter vers la formation, le guide ou l’accompagnement le plus adapté à votre projet.
            </span>
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2 self-start text-[13.5px] font-medium text-espresso md:self-center">
          <span className="link-line">Découvrir l’audit</span>
          <ArrowRight size={15} strokeWidth={1.8} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </span>
      </Link>
    </Reveal>
  );
}
