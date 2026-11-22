import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/anim';
import { MagneticButton } from '@/components/MagneticButton';
import { LoopVideo } from '@/components/LoopVideo';
import { media, photo, photoSet } from '@/data/media';

const moments = ['Votre première crème', 'Votre routine capillaire', 'Votre propre gamme'];

export function VisionBand() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.vision-img', { yPercent: -8, scale: 1.08 }, {
        yPercent: 8,
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.fromTo('.vision-inset', { autoAlpha: 0, y: 40, rotate: -4 }, {
        autoAlpha: 1,
        y: 0,
        rotate: 3,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 70%', once: true },
      });
      gsap.fromTo('.vision-moment', { autoAlpha: 0, x: 20 }, {
        autoAlpha: 1,
        x: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 65%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-espresso" aria-label="Imaginez la suite">
      <div className="absolute inset-0">
        <img
          src={photo(media.vision, 1600)}
          srcSet={photoSet(media.vision)}
          sizes="100vw"
          alt="Femme noire aux cheveux afro préparant ses soins sur sa coiffeuse, ambiance chaleureuse"
          loading="lazy"
          decoding="async"
          className="vision-img absolute -top-[10%] h-[120%] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/65 to-espresso/20 md:bg-gradient-to-l" aria-hidden />
      </div>

      <div className="relative mx-auto grid min-h-[520px] max-w-[1120px] items-center gap-10 px-5 py-16 md:grid-cols-[340px_1fr] md:px-8 md:py-20">
        <div className="max-w-[540px] md:order-2 md:justify-self-end">
          <p className="label-lc text-sand">Projetez-vous</p>
          <h2 className="mt-3 font-serif-lc text-[32px] leading-[1.08] text-white-warm md:text-[44px]">
            Imaginez ce que vos mains <span className="italic text-sand">vont créer</span>
          </h2>
          <ul className="mt-6 space-y-3">
            {moments.map((m, i) => (
              <li key={m} className="vision-moment flex items-center gap-4 border-b border-white-warm/20 pb-3 font-serif-lc text-[21px] text-white-warm md:text-[24px]">
                <span className="font-sans text-[12px] font-medium tracking-[0.14em] text-sand">0{i + 1}</span>
                {m}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <MagneticButton to="/formations" variant="cream" trackName="vision_formations">Commencer à formuler</MagneticButton>
            <MagneticButton to="/reserver" variant="light" trackName="vision_reserver">En parler avec Leslie</MagneticButton>
          </div>
        </div>

        <div className="vision-inset relative mx-auto hidden w-full max-w-[320px] md:order-1 md:block">
          <div className="overflow-hidden rounded-[22px] border-4 border-white-warm shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
            {/* Source : Drive « Leslie cosmetique media site », copy_8E508A28-….mov — recadrage 4:5 à 8 % de la hauteur */}
            <LoopVideo src="/videos/projetez-vous.mp4" poster="/videos/projetez-vous.webp" className="aspect-[4/5] w-full object-cover" />
          </div>
          <div className="absolute -bottom-5 -right-6 rounded-[14px] bg-white-warm px-4 py-3 shadow-lg">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-caramel">Fait maison</span>
            <span className="block font-serif-lc text-[18px] leading-tight text-espresso">Des soins qui vous ressemblent</span>
          </div>
        </div>
      </div>
    </section>
  );
}
