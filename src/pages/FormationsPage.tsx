import { useSeo } from '@/lib/seo';
import { formations, offerPath, formatPrice } from '@/data/offers';
import { site } from '@/data/site';
import { Link } from '@/lib/router';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';
import { CountdownLine } from '@/components/Countdown';
import { AuditHint } from '@/components/AuditPromo';
import { ArrowRight, Clock3, BadgeCheck, Check, MonitorPlay } from 'lucide-react';

export function FormationsPage() {
  useSeo({
    title: 'Formations',
    description:
      'Formations de Leslie Cosmétique : guide de 10 recettes capillaires (38 €) et guide numérique de formulation cosmétique (48 €), accessibles partout et à votre rythme.',
    path: '/formations',
  });

  return (
    <>
      <header className="bg-cream pb-8 pt-32 md:pb-10 md:pt-36">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <Reveal><p className="label-lc">Formations en ligne</p></Reveal>
            <MaskLines className="mt-3">
              <h1 className="font-serif-lc text-[32px] leading-[1.08] text-espresso md:text-[42px]">
                <MaskLine>Apprendre à formuler, <span className="italic text-caramel">à votre rythme</span></MaskLine>
              </h1>
            </MaskLines>
          </div>
          <Reveal delay={0.1} className="max-w-[400px]">
            <p className="text-[14.5px] leading-relaxed text-brown">
              Deux guides complémentaires pour devenir autonome : un guide de recettes capillaires, et un guide pour poser des bases solides en formulation.
            </p>
          </Reveal>
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] space-y-5 px-5 pb-12 md:px-8 md:pb-16" aria-label="Liste des formations">
        {formations.map((o, i) => (
          <Reveal key={o.slug} delay={i * 0.08}>
            <Link
              to={offerPath(o)}
              trackName={`formations_page_card_${o.slug}`}
              className="group grid gap-5 rounded-[22px] border border-sand/70 bg-white-warm p-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-36px_rgba(107,74,56,0.5)] md:grid-cols-[300px_1fr_200px] md:items-center md:gap-7 md:p-5"
            >
              <div className="relative overflow-hidden rounded-[16px]">
                <img
                  src={o.image}
                  alt={o.imageAlt}
                  loading={i === 0 ? undefined : 'lazy'}
                  decoding="async"
                  className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105 md:aspect-[4/3]"
                />
                {o.badge && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white-warm px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-espresso">
                    <BadgeCheck size={12} strokeWidth={2} className="text-caramel" aria-hidden /> {o.badge}
                  </span>
                )}
              </div>
              <div>
                <h2 className="font-serif-lc text-[24px] leading-tight text-espresso md:text-[26px]">{o.name}</h2>
                <p className="mt-1.5 font-serif-lc text-[16px] italic leading-snug text-brown">{o.tagline}</p>
                {o.enrollment && <CountdownLine offer={o} where="formations_page" className="mt-2" />}
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {o.outcomes.slice(0, 4).map((x) => (
                    <li key={x} className="flex items-start gap-2 text-[13px] leading-snug text-espresso">
                      <Check size={13} strokeWidth={2.4} className="mt-0.5 shrink-0 text-caramel" aria-hidden />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-sand/60 pt-4 md:flex-col md:items-start md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <div>
                  <span className="font-serif-lc text-[30px] font-medium leading-none text-espresso">{formatPrice(o.price)}</span>
                  {o.priceNote && <span className="ml-1.5 text-[12px] text-brown">{o.priceNote}</span>}
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-brown">
                    <MonitorPlay size={13} className="text-caramel" aria-hidden /> {o.channel}
                  </p>
                  {o.slug === 'formation-produits-capillaires' && site.preorder.active && (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-nude px-3 py-1 text-[11px] font-medium text-espresso">
                      <Clock3 size={12} aria-hidden /> Pré-commande {site.preorder.discount}
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-espresso px-4 py-2.5 text-[13px] font-medium text-white-warm transition-colors group-hover:bg-brown">
                  Découvrir
                  <ArrowRight size={14} strokeWidth={1.8} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
        <AuditHint where="formations_page" />
      </section>
    </>
  );
}
