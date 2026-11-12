import { useEffect } from 'react';
import { CalendarDays, Check, Clock3, MonitorPlay, ShoppingBag } from 'lucide-react';
import { getOffer, offerPath, formatPrice, offers } from '@/data/offers';
import { site } from '@/data/site';
import { useSeo } from '@/lib/seo';
import { Link, useRouter } from '@/lib/router';
import { track } from '@/lib/track';
import { MagneticButton } from '@/components/MagneticButton';
import { OfferCard } from '@/components/OfferCard';
import { FaqAccordion } from '@/components/FaqAccordion';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';

const btnCls =
  'flex w-full items-center justify-center gap-2.5 rounded-full bg-espresso px-6 py-3.5 text-[14.5px] font-medium text-white-warm transition-colors hover:bg-brown';

export function OfferPage({ slug }: { slug: string }) {
  const offer = getOffer(slug);
  const { navigate } = useRouter();

  useEffect(() => {
    if (!offer) navigate('/formations');
  }, [offer, navigate]);

  useSeo({
    title: offer?.name ?? 'Offre',
    description: offer ? `${offer.tagline} — ${offer.format}. ${formatPrice(offer.price)}${offer.duration ? `, ${offer.duration}` : ''}.` : '',
    path: offer ? offerPath(offer) : '/',
    image: offer?.image,
  });

  useEffect(() => {
    if (offer) track('view_offer', { slug: offer.slug, kind: offer.kind });
  }, [offer]);

  if (!offer) return null;

  const isCoaching = offer.kind === 'coaching';
  const isPreorder = offer.slug === 'formation-produits-capillaires' && site.preorder.active;
  const bookPath = `/reserver/${offer.slug}`;
  const related = offer.related
    .map((r) => offers.find((o) => o.slug === r))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .slice(0, 2);

  const action = (where: string, cls: string) =>
    isCoaching ? (
      <Link to={bookPath} trackName={`offer_book_${where}_${offer.slug}`} className={cls}>
        <CalendarDays size={16} strokeWidth={1.8} aria-hidden />
        {offer.cta}
      </Link>
    ) : (
      <a
        href={offer.link}
        target={offer.link.startsWith('http') ? '_blank' : undefined}
        rel={offer.link.startsWith('http') ? 'noopener noreferrer' : undefined}
        onClick={() => track('buy_click', { offer: offer.slug, price: offer.price, where })}
        className={cls}
        data-track={`offer_buy_${where}_${offer.slug}`}
      >
        <ShoppingBag size={16} strokeWidth={1.8} aria-hidden />
        {isPreorder ? 'Pré-commander' : offer.cta}
      </a>
    );

  return (
    <>
      <header className="bg-cream pb-10 pt-32 md:pb-14 md:pt-40">
        <div className="mx-auto grid max-w-[1120px] items-center gap-8 px-5 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:px-8">
          <div>
            <nav className="text-[12.5px] text-brown" aria-label="Fil d'Ariane">
              <Link to={isCoaching ? '/coachings' : '/formations'} className="link-line hover:text-espresso">
                {isCoaching ? 'Coachings' : 'Formations'}
              </Link>
              <span className="mx-2 text-sand" aria-hidden>/</span>
              <span className="text-espresso">{offer.shortName}</span>
            </nav>
            <MaskLines className="mt-4">
              <h1 className="font-serif-lc text-[32px] leading-[1.08] text-espresso md:text-[42px]">
                <MaskLine>{offer.name}</MaskLine>
              </h1>
            </MaskLines>
            <Reveal delay={0.08}>
              <p className="mt-3 max-w-[480px] font-serif-lc text-[19px] italic leading-snug text-brown md:text-[21px]">« {offer.tagline} »</p>
              <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-espresso">{offer.hook}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-espresso px-3.5 py-1.5 text-[12.5px] font-medium text-white-warm">{formatPrice(offer.price)}</span>
                {offer.duration && <span className="rounded-full bg-nude px-3.5 py-1.5 text-[12.5px] font-medium text-espresso">{offer.duration} en visio</span>}
                {!isCoaching && <span className="rounded-full bg-nude px-3.5 py-1.5 text-[12.5px] font-medium text-espresso">100 % en ligne</span>}
                {offer.badge && <span className="rounded-full bg-caramel px-3.5 py-1.5 text-[12.5px] font-medium text-white-warm">{offer.badge}</span>}
              </div>
              {isPreorder && (
                <p className="mt-4 inline-block rounded-[12px] bg-nude px-4 py-2.5 text-[13px] font-medium text-espresso">
                  Bientôt disponible — Pré-commande avec réduction {site.preorder.discount}
                </p>
              )}
              <div className="mt-6 max-w-[320px]">{action('hero', btnCls)}</div>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <div className="relative mx-auto max-w-[460px] overflow-hidden rounded-[22px] shadow-[0_30px_60px_-35px_rgba(58,42,34,0.55)]">
              <img src={offer.image} alt={offer.imageAlt} decoding="async" fetchPriority="high" className="aspect-[4/3] w-full object-cover md:aspect-[5/4]" />
              <span className="absolute left-4 top-4 rounded-full bg-white-warm/95 px-3 py-1.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-espresso">
                {isCoaching ? 'Coaching' : 'Formation'}
              </span>
            </div>
          </Reveal>
        </div>
      </header>

      <section className="border-t border-sand/50 bg-white-warm py-12 md:py-14" aria-label="Détails de l'offre">
        <div className="mx-auto grid max-w-[1120px] gap-8 px-5 md:px-8 lg:grid-cols-[1fr_310px] lg:gap-12">
          <div>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="font-serif-lc text-[24px] text-espresso">En détail</h2>
                {offer.paragraphs.map((p, i) => (
                  <Reveal key={i} delay={i * 0.05}>
                    <p className="mt-3 text-[14.5px] leading-[1.7] text-espresso">{p}</p>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.08}>
                <div className="rounded-[18px] bg-nude/60 p-5 md:p-6">
                  <h2 className="font-serif-lc text-[22px] text-espresso">Ce que tu vas obtenir</h2>
                  <ul className="mt-4 space-y-2.5">
                    {offer.outcomes.map((o) => (
                      <li key={o} className="flex items-start gap-2.5 text-[14px] text-espresso">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-espresso text-white-warm">
                          <Check size={11} strokeWidth={2.5} aria-hidden />
                        </span>
                        {o}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 flex items-center gap-2 border-t border-sand pt-4 text-[13px] text-espresso">
                    {isCoaching ? <Clock3 size={15} className="text-caramel" aria-hidden /> : <MonitorPlay size={15} className="text-caramel" aria-hidden />}
                    {offer.format}
                  </p>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <div className="mt-10">
                <h2 className="font-serif-lc text-[24px] text-espresso">Questions fréquentes</h2>
                <div className="mt-3">
                  <FaqAccordion items={offer.faq} idPrefix={`faq-${offer.slug}`} />
                </div>
              </div>
            </Reveal>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-[20px] border border-sand bg-cream p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-brown">{isCoaching ? 'Réservation' : 'Accès immédiat'}</p>
              <div className="mt-3 flex items-baseline gap-2.5">
                <span className="font-serif-lc text-[38px] font-medium leading-none text-espresso">{formatPrice(offer.price)}</span>
                {offer.duration && <span className="text-[12.5px] font-medium uppercase tracking-[0.12em] text-caramel">{offer.duration}</span>}
              </div>
              <p className="mt-2 text-[13px] text-brown">{offer.format}</p>
              <div className="mt-5">{action('aside', btnCls)}</div>
              <p className="mt-3 text-center text-[12px] text-brown">
                {isCoaching ? 'Choisis ta date et ton heure dans le calendrier.' : 'Paiement sécurisé via un lien externe.'}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-cream/95 px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[560px] items-center justify-between gap-4">
          <div>
            <p className="font-serif-lc text-[22px] font-medium leading-none text-espresso">{formatPrice(offer.price)}</p>
            {offer.duration && <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-caramel">{offer.duration}</p>}
          </div>
          {action('mobile_bar', 'inline-flex items-center gap-2 rounded-full bg-espresso px-5 py-3 text-[13.5px] font-medium text-white-warm transition-colors hover:bg-brown')}
        </div>
      </div>
      <section className="scroll-mt-24 border-t border-sand/60 bg-cream pb-16 pt-16 md:pt-20 lg:pb-20" aria-label="Autres offres">
        <div className="mx-auto max-w-[1120px] px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif-lc text-[26px] text-espresso md:text-[30px]">Tu aimeras aussi</h2>
            <MagneticButton to={isCoaching ? '/coachings' : '/formations'} variant="outline" trackName="offer_back_list" className="!px-5 !py-2.5 text-[13px]">
              {isCoaching ? 'Tous les coachings' : 'Toutes les formations'}
            </MagneticButton>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((o, i) => (
              <OfferCard key={o.slug} offer={o} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
