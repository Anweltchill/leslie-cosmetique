import { useEffect, useState } from 'react';
import { BellRing, CalendarDays, Check, Clock3, Euro, Hourglass, MonitorPlay, PackageCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { getOffer, getVisibleOffer, offerPath, familyPath, formatPrice, usesCalendar, type Block, type ListItem, type Offer } from '@/data/offers';
import { site } from '@/data/site';
import { useSeo, useJsonLd } from '@/lib/seo';
import { offerJsonLd } from '@/lib/offerSchema';
import { useEnrollment } from '@/lib/enrollment';
import { Link, useRouter } from '@/lib/router';
import { track } from '@/lib/track';
import { mobileMoneyEnabled, paysOnline } from '@/lib/checkout';
import { PaymentChoice } from '@/components/PaymentChoice';
import { MagneticButton } from '@/components/MagneticButton';
import { OfferCard } from '@/components/OfferCard';
import { FaqAccordion } from '@/components/FaqAccordion';
import { ModulesAccordion } from '@/components/ModulesAccordion';
import { CountdownLine, CountdownPanel } from '@/components/Countdown';
import { LoopVideo } from '@/components/LoopVideo';
import { WasPrice, PromoBadge } from '@/components/Promo';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';

const btnCls =
  'flex w-full items-center justify-center gap-2.5 rounded-full bg-espresso px-6 py-3.5 text-[14.5px] font-medium text-white-warm transition-colors hover:bg-brown';

const practicalIcons: Record<string, typeof Euro> = {
  Tarif: Euro,
  Format: MonitorPlay,
  Durée: Clock3,
  Dates: CalendarDays,
  'Fin des inscriptions': Hourglass,
};

function ListItemText({ item }: { item: ListItem }) {
  if (typeof item === 'string') return <>{item}</>;
  return (
    <>
      <strong className="font-medium text-espresso">{item.lead}</strong> : {item.text}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  if (typeof block === 'string') return <p className="mt-3 text-[14.5px] leading-[1.7] text-espresso">{block}</p>;
  return (
    <ul className="mt-3 space-y-2.5">
      {block.items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[14.5px] leading-[1.6] text-espresso">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-caramel" aria-hidden />
          <span><ListItemText item={item} /></span>
        </li>
      ))}
    </ul>
  );
}

type GalleryItem = NonNullable<Offer['gallery']>[number];
const ratioValue = (r: string) => {
  const [w, h] = r.split('/').map((n) => Number(n.trim()));
  return w / h;
};

/**
 * Visuels de l'offre, en haut de la colonne « Ce que vous allez obtenir ».
 * Formats verticaux ou carrés : côte à côte à la même hauteur ; formats horizontaux : l'un sous l'autre.
 */
function OfferGallery({ items }: { items: GalleryItem[] }) {
  const sideBySide = items.reduce((sum, g) => sum + ratioValue(g.ratio), 0) <= 1.8;
  return (
    <div className={sideBySide ? 'flex gap-3' : 'space-y-3'}>
      {items.map((g) => (
        <figure
          key={g.src}
          className="overflow-hidden rounded-[16px] shadow-[0_24px_50px_-32px_rgba(58,42,34,0.6)]"
          style={sideBySide ? { flex: `${ratioValue(g.ratio)} 1 0%`, aspectRatio: g.ratio } : { aspectRatio: g.ratio }}
        >
          {g.src.endsWith('.mp4') ? (
            <LoopVideo src={g.src} poster={g.poster ?? ''} className="h-full w-full object-cover" />
          ) : (
            <img src={g.src} alt={g.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          )}
        </figure>
      ))}
    </div>
  );
}

export function OfferPage({ slug }: { slug: string }) {
  const found = getOffer(slug);
  const offer = getVisibleOffer(slug);
  const { navigate } = useRouter();
  const enrollment = useEnrollment(offer?.enrollment);
  const closed = Boolean(enrollment && !enrollment.open);
  const [choiceOpen, setChoiceOpen] = useState(false);

  // Offre inconnue ou masquée : redirection vers la page de sa famille.
  useEffect(() => {
    if (!offer) navigate(found ? familyPath(found) : '/formations', { replace: true });
  }, [offer, found, navigate]);

  useSeo({
    title: offer?.name ?? 'Offre',
    description: offer
      ? `${offer.tagline} ${offer.format}. ${formatPrice(offer.price)}${offer.priceNote ? ` ${offer.priceNote}` : ''}${offer.duration ? `, ${offer.duration}` : ''}.${
          offer.enrollment ? ` Formation les ${offer.enrollment.datesLabel}, inscriptions jusqu’au ${offer.enrollment.closesLabel}.` : ''
        }`
      : '',
    path: offer ? offerPath(offer) : '/',
    image: offer?.image,
  });
  useJsonLd('offer', offer ? offerJsonLd(offer, !closed) : null);

  useEffect(() => {
    if (offer) track('view_offer', { slug: offer.slug, kind: offer.kind });
  }, [offer]);

  if (!offer) return null;

  const isCoaching = offer.kind === 'coaching';
  const calendar = usesCalendar(offer);
  const isPreorder = offer.slug === 'formation-produits-capillaires' && site.preorder.active;
  const bookPath = `/reserver/${offer.slug}`;
  const related = offer.related
    .map((r) => getVisibleOffer(r))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .slice(0, 2);
  const durationChip = offer.practical?.find((p) => p.label === 'Durée')?.value;
  const isLive = Boolean(offer.enrollment);
  const isAudit = offer.slug === 'audit-orientation';

  const action = (where: string, cls: string) => {
    if (calendar) {
      return (
        <Link to={bookPath} trackName={`offer_book_${where}_${offer.slug}`} className={cls}>
          <CalendarDays size={16} strokeWidth={1.8} aria-hidden />
          {offer.cta}
        </Link>
      );
    }
    if (closed && offer.enrollment) {
      const { closedLink, closedCta } = offer.enrollment;
      const onClick = () => track('notify_next_session_click', { offer: offer.slug, where });
      return closedLink.startsWith('/') ? (
        <Link to={closedLink} trackName={`notify_next_session_${where}`} className={cls} onClick={onClick}>
          <BellRing size={16} strokeWidth={1.8} aria-hidden />
          {closedCta}
        </Link>
      ) : (
        <a href={closedLink} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cls} data-track={`notify_next_session_${where}`}>
          <BellRing size={16} strokeWidth={1.8} aria-hidden />
          {closedCta}
        </a>
      );
    }
    if (paysOnline(offer.slug) && !isLive && !isPreorder) {
      const buy = () => {
        track('buy_click', { offer: offer.slug, price: offer.price, where });
        setChoiceOpen(true);
      };
      return (
        <button type="button" onClick={buy} className={cls} data-track={`offer_buy_${where}_${offer.slug}`} aria-haspopup="dialog">
          <ShoppingBag size={16} strokeWidth={1.8} aria-hidden />
          {offer.cta}
        </button>
      );
    }
    const external = offer.link.startsWith('http');
    const dataTrack = isLive ? `inscription_${where}` : isAudit ? `audit_book_${where}` : `offer_buy_${where}_${offer.slug}`;
    const onClick = () => {
      if (isLive) track('signup_click', { offer: offer.slug, price: offer.price, where });
      else if (isAudit) track('audit_book_click', { offer: offer.slug, price: offer.price, where });
      else track('buy_click', { offer: offer.slug, price: offer.price, where });
    };
    return (
      <a href={offer.link} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} onClick={onClick} className={cls} data-track={dataTrack}>
        {isCoaching ? <CalendarDays size={16} strokeWidth={1.8} aria-hidden /> : <ShoppingBag size={16} strokeWidth={1.8} aria-hidden />}
        {isPreorder ? 'Pré-commander' : offer.cta}
      </a>
    );
  };

  const asideLabel = isCoaching ? 'Réservation' : isLive ? 'Inscription' : 'Accès immédiat';
  const asideNote = calendar
    ? 'Choisissez votre date et votre heure dans le calendrier.'
    : closed
      ? 'Les inscriptions à cette session sont closes.'
      : isCoaching
        ? 'Réservation via un lien externe.'
        : paysOnline(offer.slug)
          ? `Paiement par carte bancaire (Stripe)${mobileMoneyEnabled() ? ' ou Mobile Money' : ''}. Guide téléchargeable dès le paiement validé.`
          : 'Paiement sécurisé via un lien externe.';

  return (
    <>
      <header className="bg-cream pb-10 pt-32 md:pb-14 md:pt-40">
        <div className="mx-auto grid max-w-[1120px] items-center gap-8 px-5 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:px-8">
          <div>
            <nav className="text-[12.5px] text-brown" aria-label="Fil d'Ariane">
              <Link to={familyPath(offer)} className="link-line hover:text-espresso">
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
              <p className="mt-3 max-w-[480px] font-serif-lc text-[19px] italic leading-snug text-brown md:text-[21px]">{offer.tagline}</p>
              {offer.hook && <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-espresso">{offer.hook}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-espresso px-3.5 py-1.5 text-[12.5px] font-medium text-white-warm">
                  <WasPrice price={offer.price} className="font-normal" />
                  <span>{formatPrice(offer.price)}{offer.priceNote ? ` ${offer.priceNote}` : ''}</span>
                </span>
                <PromoBadge className="!px-3.5 !py-1.5 !text-[12.5px]" />
                {offer.durationLabel && <span className="rounded-full bg-nude px-3.5 py-1.5 text-[12.5px] font-medium text-espresso">{offer.durationLabel}</span>}
                {!isCoaching && <span className="rounded-full bg-nude px-3.5 py-1.5 text-[12.5px] font-medium text-espresso">{offer.channel}</span>}
                {durationChip && <span className="rounded-full bg-nude px-3.5 py-1.5 text-[12.5px] font-medium text-espresso">{durationChip}</span>}
                {offer.badge && <span className="rounded-full bg-caramel px-3.5 py-1.5 text-[12.5px] font-medium text-white-warm">{offer.badge}</span>}
              </div>
              {isPreorder && (
                <p className="mt-4 inline-block rounded-[12px] bg-nude px-4 py-2.5 text-[13px] font-medium text-espresso">
                  Bientôt disponible — Pré-commande avec réduction {site.preorder.discount}
                </p>
              )}
              {isLive && (
                <div className="mt-5">
                  <CountdownPanel offer={offer} where="offer_hero" />
                </div>
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
          <div className="min-w-0">
            {offer.practical && (
              <Reveal>
                <div className="mb-10 rounded-[18px] border border-sand/70 bg-cream p-5 md:p-6">
                  <h2 className="font-serif-lc text-[22px] text-espresso">Dates et informations pratiques</h2>
                  <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
                    {offer.practical.map((p) => {
                      const Icon = practicalIcons[p.label] ?? Check;
                      return (
                        <div key={p.label} className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nude text-espresso">
                            <Icon size={15} strokeWidth={1.7} aria-hidden />
                          </span>
                          <div>
                            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-brown">{p.label}</dt>
                            <dd className="mt-0.5 font-serif-lc text-[17px] leading-snug text-espresso">{p.value}</dd>
                          </div>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              </Reveal>
            )}

            {/* Ordinateur : visuels à gauche (alternance avec le haut de page), « En détail » à droite.
                Mobile : « En détail », puis visuels. */}
            <div className={offer.gallery ? 'grid gap-8 md:grid-cols-2 md:items-start' : ''}>
              <div className={offer.gallery ? '' : 'max-w-[680px]'}>
                <h2 className="font-serif-lc text-[24px] text-espresso">En détail</h2>
                {offer.paragraphs.map((b, i) => (
                  <Reveal key={i} delay={i * 0.05}>
                    <BlockView block={b} />
                  </Reveal>
                ))}
              </div>
              {offer.gallery && (
                <Reveal delay={0.08} className="md:sticky md:top-28 md:order-first">
                  <OfferGallery items={offer.gallery} />
                </Reveal>
              )}
            </div>

            {/* « Ce que vous allez obtenir » : sur toute la largeur, points sur deux colonnes */}
            <Reveal delay={0.08}>
              <div className="mt-8 rounded-[18px] bg-nude/60 p-5 md:p-6">
                <h2 className="font-serif-lc text-[22px] text-espresso">{offer.outcomesTitle ?? 'Ce que vous allez obtenir'}</h2>
                {offer.outcomesIntro && <p className="mt-1 text-[13.5px] leading-relaxed text-brown">{offer.outcomesIntro}</p>}
                <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {offer.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2.5 text-[14px] text-espresso">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-espresso text-white-warm">
                        <Check size={11} strokeWidth={2.5} aria-hidden />
                      </span>
                      {o}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex items-center gap-2 border-t border-sand pt-3 text-[13px] text-espresso">
                  {isCoaching ? <Clock3 size={15} className="shrink-0 text-caramel" aria-hidden /> : <MonitorPlay size={15} className="shrink-0 text-caramel" aria-hidden />}
                  {offer.format}
                </p>
              </div>
            </Reveal>

            {offer.modules && (
              <Reveal delay={0.05}>
                <div className="mt-10">
                  <h2 className="font-serif-lc text-[24px] text-espresso">Les {offer.modules.length} modules</h2>
                  <div className="mt-3">
                    <ModulesAccordion modules={offer.modules} idPrefix={`modules-${offer.slug}`} offerSlug={offer.slug} />
                  </div>
                </div>
              </Reveal>
            )}

            {offer.sections?.map((s) => (
              <Reveal key={s.title} delay={0.05}>
                <div className="mt-10 flex gap-4 rounded-[18px] border border-sand/70 bg-cream p-5 md:p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nude text-espresso">
                    {isLive ? <PackageCheck size={17} strokeWidth={1.6} aria-hidden /> : <Sparkles size={17} strokeWidth={1.6} aria-hidden />}
                  </span>
                  <div>
                    <h2 className="font-serif-lc text-[22px] leading-tight text-espresso">{s.title}</h2>
                    {s.paragraphs.map((p) => (
                      <p key={p} className="mt-2.5 text-[14.5px] leading-[1.7] text-espresso">{p}</p>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}

            <Reveal delay={0.1}>
              <div className="mt-10">
                <h2 className="font-serif-lc text-[24px] text-espresso">Questions fréquentes</h2>
                <div className="mt-3">
                  <FaqAccordion items={offer.faq} idPrefix={`faq-${offer.slug}`} />
                </div>
              </div>
            </Reveal>

            {offer.notes && (
              <Reveal delay={0.05}>
                <div className="mt-10 border-t border-sand/70 pt-6">
                  <h2 className="font-serif-lc text-[20px] text-espresso">{offer.notes.title}</h2>
                  {offer.notes.paragraphs.map((p) => (
                    <p key={p} className="mt-2 max-w-[640px] text-[13.5px] leading-relaxed text-brown">{p}</p>
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-[20px] border border-sand bg-cream p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-brown">{asideLabel}</p>
                <PromoBadge />
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="font-serif-lc text-[38px] font-medium leading-none text-espresso">{formatPrice(offer.price)}</span>
                <WasPrice price={offer.price} className="font-serif-lc text-[20px] text-brown" />
                {offer.duration && <span className="text-[12.5px] font-medium uppercase tracking-[0.12em] text-caramel">{offer.duration}</span>}
                {offer.priceNote && <span className="text-[12.5px] text-brown">{offer.priceNote}</span>}
              </div>
              <p className="mt-2 text-[13px] text-brown">{offer.format}</p>
              {isLive && <CountdownLine offer={offer} where="offer_aside" className="mt-3" />}
              <div className="mt-5">{action('aside', btnCls)}</div>
              <p className="mt-3 text-center text-[12px] text-brown">{asideNote}</p>
            </div>
          </aside>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-cream/95 px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[560px] items-center justify-between gap-4">
          <div className="shrink-0">
            <p className="font-serif-lc text-[22px] font-medium leading-none text-espresso">
              {formatPrice(offer.price)} <WasPrice price={offer.price} className="text-[14px] text-brown" />
            </p>
            {(offer.duration || offer.priceNote) && (
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-caramel">{offer.duration ?? offer.priceNote}</p>
            )}
          </div>
          {action('mobile_bar', 'inline-flex items-center justify-center gap-2 rounded-full bg-espresso px-5 py-3 text-center text-[13.5px] font-medium leading-tight text-white-warm transition-colors hover:bg-brown')}
        </div>
      </div>
      {paysOnline(offer.slug) && !isCoaching && (
        <PaymentChoice
          open={choiceOpen}
          onClose={() => setChoiceOpen(false)}
          offerName={offer.name}
          price={offer.price}
          checkout={{ offer_slug: offer.slug, cancel_path: offerPath(offer) }}
        />
      )}
      <section className="scroll-mt-24 border-t border-sand/60 bg-cream pb-16 pt-16 md:pt-20 lg:pb-20" aria-label="Autres offres">
        <div className="mx-auto max-w-[1120px] px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif-lc text-[26px] text-espresso md:text-[30px]">Vous aimerez aussi</h2>
            <MagneticButton to={familyPath(offer)} variant="outline" trackName="offer_back_list" className="!px-5 !py-2.5 text-[13px]">
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
