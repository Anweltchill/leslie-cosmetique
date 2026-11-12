import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, GraduationCap, Leaf, Pause, Play, Video } from 'lucide-react';
import { gsap } from '@/lib/anim';
import { Link } from '@/lib/router';
import { MagneticButton } from '@/components/MagneticButton';
import { coachings, formations, formatPrice } from '@/data/offers';
import { site } from '@/data/site';
import { track } from '@/lib/track';

const fromPrice = (list: { price: number }[]) => formatPrice(Math.min(...list.map((o) => o.price)));

const paths = [
  { to: '/formations', icon: GraduationCap, title: 'Formations', text: 'En ligne, à ton rythme', price: `dès ${fromPrice(formations)}` },
  { to: '/coachings', icon: Video, title: 'Coachings', text: '1 h en visio avec Leslie', price: `dès ${fromPrice(coachings)}` },
];

export function Hero({ started }: { started: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!started) return;
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.fromTo('.hero-bg', { clipPath: 'inset(6% 6% 6% 6% round 32px)', scale: 1.18 }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', scale: 1, duration: 1.8 })
        .fromTo('.hero-line-inner', { yPercent: 115 }, { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.35)
        .fromTo('.hero-fade', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.8)
        .fromTo('.hero-chip', { autoAlpha: 0, y: 14, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.12 }, 1.1);

      gsap.to('.hero-parallax', {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, [started]);

  const togglePause = () => {
    setPaused((p) => {
      track('hero_motion_toggle', { paused: !p });
      return !p;
    });
  };

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-espresso pb-20 pt-24 md:h-[100svh] md:max-h-[960px] md:min-h-[640px] md:pb-0 md:pt-16"
      aria-label="Introduction"
    >
      <div className="hero-bg absolute inset-0 overflow-hidden will-change-transform">
        <div className="hero-parallax absolute inset-x-0 -top-[12%] h-[124%]">
        <img
          src="/hero-drip.webp"
          srcSet="/hero-drip-md.webp 1376w, /hero-drip.webp 2752w"
          sizes="100vw"
          alt="Crème ivoire onctueuse coulant d'une spatule en bois dans un pot en verre ambré, entourée de karité, flacon compte-gouttes et plantes séchées"
          className={`hero-media h-full w-full object-cover object-[72%_center] ${paused ? '[animation-play-state:paused]' : ''}`}
          fetchPriority="high"
          decoding="async"
        />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-espresso/95 via-espresso/70 to-espresso/10 md:via-espresso/55" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-espresso/80 to-transparent" aria-hidden />
      </div>

      <div className="relative mx-auto w-full max-w-[1120px] px-5 md:px-8">
        <div className="max-w-[580px]">
          <p className="hero-fade inline-flex items-center gap-2 rounded-full border border-white-warm/30 bg-white-warm/10 px-3.5 py-1.5 text-[12px] font-medium text-white-warm backdrop-blur-sm">
            <Leaf size={13} className="text-sand" aria-hidden />
            Formations et coachings en cosmétique naturelle
          </p>
          <h1 className="mt-5 font-serif-lc font-medium leading-[1] text-white-warm [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
            {['Apprendre', 'Formuler', 'Créer'].map((w, i) => (
              <span key={w} className="block overflow-hidden pb-[0.06em]">
                <span className={`hero-line-inner block text-[50px] sm:text-[62px] lg:text-[76px] ${i === 1 ? 'italic text-sand' : ''}`}>{w}</span>
              </span>
            ))}
          </h1>
          <p className="hero-fade mt-5 max-w-[460px] text-[15.5px] leading-relaxed text-cream">
            Je vous accompagne dans la formulation de vos produits cosmétiques, le soin de vos cheveux et la création de votre marque.
          </p>
          <div className="hero-fade mt-7 flex flex-wrap items-center gap-3">
            <MagneticButton to="/formations" variant="cream" trackName="hero_decouvrir">Découvrir mes offres</MagneticButton>
            <MagneticButton to="/reserver" variant="light" trackName="hero_reserver">Réserver un appel</MagneticButton>
          </div>

          <div className="mt-8 grid max-w-[500px] gap-3 sm:grid-cols-2">
            {paths.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                trackName={`hero_path_${p.title}`}
                className="hero-fade group flex items-start gap-3 rounded-[16px] border border-white-warm/25 bg-espresso/40 p-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white-warm/60 hover:bg-espresso/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white-warm text-espresso">
                  <p.icon size={16} strokeWidth={1.7} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between font-serif-lc text-[18px] leading-tight text-white-warm">
                    {p.title}
                    <ArrowUpRight size={15} className="text-sand transition-transform duration-300 group-hover:rotate-45" aria-hidden />
                  </span>
                  <span className="block text-[12.5px] text-cream">{p.text}</span>
                  <span className="mt-1 block text-[12.5px] font-medium text-white-warm">{p.price}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-chip absolute bottom-6 right-5 hidden items-center gap-3 rounded-full bg-white-warm/95 p-1.5 pr-4 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] md:flex lg:right-[max(2rem,calc((100vw-1120px)/2+2rem))]">
        <img src="/portrait-leslie.webp" alt="" className="h-10 w-10 rounded-full object-cover" />
        <span>
          <span className="block text-[13px] font-medium leading-tight text-espresso">{site.founder}</span>
          <span className="block text-[11.5px] text-brown">Formulatrice, fondatrice</span>
        </span>
      </div>

      <button
        type="button"
        onClick={togglePause}
        aria-label={paused ? 'Reprendre l’animation de l’image' : 'Mettre en pause l’animation de l’image'}
        aria-pressed={paused}
        className="absolute bottom-6 left-5 flex h-10 w-10 items-center justify-center rounded-full border border-white-warm/40 bg-espresso/40 text-white-warm backdrop-blur-sm transition-colors hover:bg-espresso/70 md:left-auto md:right-5 md:top-24 md:bottom-auto"
      >
        {paused ? <Play size={14} strokeWidth={1.8} /> : <Pause size={14} strokeWidth={1.8} />}
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center md:flex" aria-hidden>
        <div className="hero-chip flex flex-col items-center gap-2 text-[10.5px] uppercase tracking-[0.2em] text-cream">
          <span className="relative block h-9 w-5 rounded-full border border-white-warm/50">
            <span className="scroll-dot absolute left-[7px] top-1.5 block h-1.5 w-1.5 rounded-full bg-white-warm" />
          </span>
          Défiler
        </div>
      </div>
    </section>
  );
}
