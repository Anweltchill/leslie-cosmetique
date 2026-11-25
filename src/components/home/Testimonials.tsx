import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Quote, X } from 'lucide-react';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';
import { LoopVideo } from '@/components/LoopVideo';
import { track } from '@/lib/track';

/** Citations tirées mot pour mot des messages reçus par Leslie (captures ci-dessous). */
const QUOTES = [
  {
    name: 'Fatoumata D.',
    text: 'C’est une véritable mine d’or ! Chaque page est remplie de conseils précieux, d’astuces et d’inspirations.',
  },
  {
    name: 'Aïssatou B.',
    text: 'Grâce à ton expertise, j’ai pu passer de l’idée à des produits finis d’une qualité professionnelle remarquable.',
  },
  {
    name: 'Leslie B.',
    text: 'Les explications sont très claires, les dosages sont précis. Je le recommande sans hésiter.',
  },
];

/** Captures des messages (WhatsApp, Instagram), recadrées sans la barre d'état du téléphone. */
const SHOTS = [
  { src: '/avis/avis-05.webp', name: 'Fatoumata D.' },
  { src: '/avis/avis-07.webp', name: 'Aïssatou B.' },
  { src: '/avis/avis-03.webp', name: 'Nadia M.' },
  { src: '/avis/avis-04.webp', name: 'Leslie B.' },
  { src: '/avis/avis-06.webp', name: 'Nadia K.' },
  { src: '/avis/avis-02.webp', name: 'Aïcha L.' },
  { src: '/avis/avis-01.webp', name: 'Clarisse' },
];

export function Testimonials() {
  const track_ = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const scroll = (dir: 1 | -1) => {
    const el = track_.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 260) + 16) * 2, behavior: 'smooth' });
  };

  return (
    <section id="avis" className="scroll-mt-24 overflow-hidden bg-cream py-12 md:py-16" aria-label="Avis clientes">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal><p className="label-lc">Avis clientes</p></Reveal>
            <MaskLines className="mt-3">
              <h2 className="font-serif-lc text-[28px] leading-[1.1] text-espresso md:text-[36px]">
                <MaskLine>Elles en parlent <span className="italic text-caramel">mieux que moi</span></MaskLine>
              </h2>
            </MaskLines>
          </div>
          <Reveal delay={0.1} className="max-w-[380px]">
            <p className="text-[14px] leading-relaxed text-brown">
              Quelques-uns des messages reçus après la lecture de mes guides et mes accompagnements.
            </p>
          </Reveal>
        </div>

        {/* Citations mises en avant */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {QUOTES.map((q, i) => (
            <Reveal key={q.name} delay={i * 0.08} className="h-full">
              <figure className="flex h-full flex-col rounded-[22px] border border-sand/70 bg-white-warm p-6 shadow-[0_24px_50px_-40px_rgba(107,74,56,0.5)]">
                <Quote size={26} strokeWidth={1.4} className="text-caramel" aria-hidden />
                <blockquote className="mt-3 flex-1 font-serif-lc text-[20px] italic leading-snug text-espresso">« {q.text} »</blockquote>
                <figcaption className="mt-5 flex items-center gap-2 text-[13px] font-medium text-brown">
                  <span className="h-px w-6 bg-caramel" aria-hidden />
                  {q.name}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* Captures des messages */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="text-[12.5px] font-medium uppercase tracking-[0.16em] text-brown">Leurs messages</p>
          <div className="hidden gap-2 md:flex">
            <button type="button" onClick={() => scroll(-1)} aria-label="Messages précédents" className="flex h-10 w-10 items-center justify-center rounded-full border border-sand text-espresso transition-colors hover:bg-nude">
              <ChevronLeft size={17} />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label="Messages suivants" className="flex h-10 w-10 items-center justify-center rounded-full border border-sand text-espresso transition-colors hover:bg-nude">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={track_}
        data-lenis-prevent
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 pt-2 [scrollbar-width:none] md:px-[max(2rem,calc((100vw-1120px)/2+2rem))] [&::-webkit-scrollbar]:hidden"
      >
        {SHOTS.map((s, i) => (
          <button
            key={s.src}
            type="button"
            data-card
            onClick={() => {
              setOpen(i);
              track('testimonial_open', { index: i + 1 });
            }}
            className={`group shrink-0 snap-start text-left ${i % 2 ? 'md:translate-y-4' : ''}`}
            aria-label={`Agrandir le message de ${s.name}`}
          >
            <span className="block w-[230px] rounded-[28px] bg-espresso p-1.5 pt-4 shadow-[0_26px_50px_-30px_rgba(58,42,34,0.65)] transition-transform duration-500 group-hover:-translate-y-1.5 md:w-[250px]">
              <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-white-warm/25" aria-hidden />
              <img src={s.src} alt={`Message de ${s.name} à Leslie`} width={600} height={663} loading="lazy" className="block w-full rounded-[20px]" />
            </span>
            <span className="mt-3 block text-center text-[13px] font-medium text-espresso">{s.name}</span>
          </button>
        ))}
      </div>

      {/* Avant / après */}
      <div className="mx-auto mt-8 max-w-[1120px] px-5 md:px-8">
        <div className="rounded-[26px] border border-sand/70 bg-white-warm p-5 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-center">
            <div>
              <p className="label-lc">Avant / après</p>
              <h3 className="mt-3 font-serif-lc text-[26px] leading-tight text-espresso md:text-[30px]">
                Des résultats <span className="italic text-caramel">visibles</span>
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-brown">Des tempes qui se redensifient grâce à des soins adaptés et réguliers.</p>
              <p className="mt-4 text-[11.5px] leading-snug text-brown/80">Résultats individuels : ils peuvent varier d’une personne à l’autre.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_0.5625fr]">
              {['/avis/avant-apres-1.webp', '/avis/avant-apres-2.webp'].map((src, i) => (
                <figure key={src} className="relative overflow-hidden rounded-[18px]">
                  <img src={src} alt={`Avant et après : repousse des cheveux au niveau des tempes (${i + 1})`} width={900} height={900} loading="lazy" className="aspect-square w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-espresso/80 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white-warm backdrop-blur-sm">Avant</span>
                  <span className="absolute right-2 top-2 rounded-full bg-caramel/90 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white-warm backdrop-blur-sm">Après</span>
                </figure>
              ))}
              <div className="relative col-span-2 mx-auto w-[62%] overflow-hidden rounded-[18px] sm:col-span-1 sm:w-full">
                <LoopVideo
                  src="/videos/offre-2-guide-recettes-galerie-1.mp4"
                  poster="/videos/offre-2-guide-recettes-galerie-1.webp"
                  className="aspect-[9/16] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {open !== null && <Lightbox index={open} onClose={() => setOpen(null)} onMove={setOpen} />}
    </section>
  );
}

function Lightbox({ index, onClose, onMove }: { index: number; onClose: () => void; onMove: (i: number) => void }) {
  const shot = SHOTS[index];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onMove((index + 1) % SHOTS.length);
      if (e.key === 'ArrowLeft') onMove((index - 1 + SHOTS.length) % SHOTS.length);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [index, onClose, onMove]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Message de ${shot.name}`}>
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-full items-center gap-3">
        <button type="button" onClick={() => onMove((index - 1 + SHOTS.length) % SHOTS.length)} aria-label="Message précédent" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white-warm/15 text-white-warm hover:bg-white-warm/25 sm:flex">
          <ChevronLeft size={20} />
        </button>
        <figure className="relative">
          <span className="block rounded-[28px] bg-espresso p-1.5 pt-4 shadow-2xl">
            <img src={shot.src} alt={`Message de ${shot.name} à Leslie`} className="max-h-[78vh] w-auto max-w-[min(480px,84vw)] rounded-[20px]" />
          </span>
          <figcaption className="mt-3 text-center text-[13.5px] font-medium text-white-warm">{shot.name}</figcaption>
          <button type="button" onClick={onClose} aria-label="Fermer" className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white-warm text-espresso shadow-lg">
            <X size={16} />
          </button>
        </figure>
        <button type="button" onClick={() => onMove((index + 1) % SHOTS.length)} aria-label="Message suivant" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white-warm/15 text-white-warm hover:bg-white-warm/25 sm:flex">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
