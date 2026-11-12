import { useSeo } from '@/lib/seo';
import { coachings, offerPath, formatPrice } from '@/data/offers';
import { Link } from '@/lib/router';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';
import { CalendarDays, Clock3, Video, MousePointerClick } from 'lucide-react';

const steps = [
  { icon: MousePointerClick, text: 'Choisis ton coaching' },
  { icon: CalendarDays, text: 'Sélectionne ta date et ton heure' },
  { icon: Video, text: 'Reçois ton lien visio par e-mail' },
];

export function CoachingsPage() {
  useSeo({
    title: 'Coachings',
    description:
      'Coachings individuels en visio avec Leslie Djoman : formulation cosmétique, conseils capillaires personnalisés et consultation lancement de marque.',
    path: '/coachings',
  });

  return (
    <>
      <header className="bg-cream pb-8 pt-32 md:pb-10 md:pt-36">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <Reveal><p className="label-lc">Coachings en visio</p></Reveal>
            <MaskLines className="mt-3">
              <h1 className="font-serif-lc text-[32px] leading-[1.08] text-espresso md:text-[42px]">
                <MaskLine>Une heure ensemble,</MaskLine>
                <MaskLine className="italic text-caramel">pour débloquer l'essentiel</MaskLine>
              </h1>
            </MaskLines>
          </div>
          <Reveal delay={0.1} className="max-w-[400px]">
            <p className="text-[14.5px] leading-relaxed text-brown">
              Trois accompagnements individuels en visio, adaptés à votre situation : vos formulations, vos cheveux, ou votre projet de marque.
            </p>
          </Reveal>
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] px-5 pb-10 md:px-8" aria-label="Liste des coachings">
        <div className="grid gap-4 md:grid-cols-3">
          {coachings.map((o, i) => (
            <Reveal key={o.slug} delay={i * 0.1} className="h-full">
              <article className="group flex h-full flex-col rounded-[22px] border border-sand/70 bg-white-warm p-3 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-36px_rgba(107,74,56,0.5)]">
                <Link to={offerPath(o)} trackName={`coachings_page_img_${o.slug}`} className="relative block overflow-hidden rounded-[16px]">
                  <img
                    src={o.image}
                    alt={o.imageAlt}
                    loading={i === 0 ? undefined : 'lazy'}
                    decoding="async"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white-warm px-3 py-1.5 text-[11px] font-medium text-espresso">
                    <Clock3 size={12} className="text-caramel" aria-hidden /> {o.duration} en visio
                  </span>
                </Link>
                <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
                  <h2 className="font-serif-lc text-[22px] leading-tight text-espresso">{o.name}</h2>
                  <p className="mt-1.5 flex-1 text-[13.5px] leading-snug text-brown">{o.tagline}</p>
                  <p className="mt-4 font-serif-lc text-[26px] font-medium leading-none text-espresso">{formatPrice(o.price)}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      to={`/reserver/${o.slug}`}
                      trackName={`coachings_page_book_${o.slug}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-espresso px-3 py-2.5 text-[13px] font-medium text-white-warm transition-colors hover:bg-brown"
                    >
                      <CalendarDays size={14} aria-hidden /> Réserver
                    </Link>
                    <Link
                      to={offerPath(o)}
                      trackName={`coachings_page_card_${o.slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-sand px-3 py-2.5 text-[13px] font-medium text-espresso transition-colors hover:bg-nude"
                    >
                      Détails
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-5 pb-12 md:px-8 md:pb-16" aria-label="Comment réserver">
        <Reveal>
          <div className="flex flex-col gap-5 rounded-[22px] bg-espresso p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="font-serif-lc text-[24px] text-white-warm md:text-[28px]">Réserver en 3 étapes</p>
              <ol className="mt-4 flex flex-col gap-3 md:flex-row md:gap-6">
                {steps.map((s, i) => (
                  <li key={s.text} className="flex items-center gap-2.5 text-[13.5px] text-cream">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white-warm/10 text-sand">
                      <s.icon size={15} aria-hidden />
                    </span>
                    {i + 1}. {s.text}
                  </li>
                ))}
              </ol>
            </div>
            <Link
              to="/reserver"
              trackName="coachings_page_calendar"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-cream px-6 py-3 text-[14px] font-medium text-espresso transition-colors hover:bg-white-warm"
            >
              <CalendarDays size={16} aria-hidden /> Ouvrir le calendrier
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
