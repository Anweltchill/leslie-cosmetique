import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { gsap } from '@/lib/anim';
import { site } from '@/data/site';
import { MagneticButton } from '@/components/MagneticButton';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';

const points = ['Formulation cosmétique naturelle', 'Soins capillaires adaptés aux cheveux texturés', 'Accompagnement à la création de marque'];

export function AboutTeaser() {
  const imgWrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgWrap.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelector('img'),
        { clipPath: 'inset(100% 0 0 0 round 20px)', scale: 1.1 },
        {
          clipPath: 'inset(0% 0 0 0 round 20px)',
          scale: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section className="mx-auto max-w-[1120px] px-5 py-12 md:px-8 md:py-16" aria-label="À propos de Leslie">
      <div className="grid items-center gap-8 md:grid-cols-[400px_1fr] md:gap-14 lg:grid-cols-[460px_1fr]">
        <div ref={imgWrap} className="relative mx-auto w-full max-w-[420px] md:max-w-none">
          <img
            src="/portrait-leslie.webp"
            alt="Leslie Djoman, formulatrice, concentrée sur une émulsion dans son atelier, entourée de flacons ambrés"
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full rounded-[22px] object-cover shadow-[0_40px_80px_-40px_rgba(58,42,34,0.6)]"
          />
          <img
            src="/float-jar.webp"
            alt=""
            aria-hidden
            loading="lazy"
            className="float-soft absolute -right-6 -top-6 hidden w-20 md:block"
            style={{ ['--float-rot' as string]: '6deg' }}
          />
          <div className="absolute -bottom-4 left-4 rounded-[14px] bg-espresso px-4 py-2.5 text-white-warm shadow-lg">
            <span className="block font-serif-lc text-[18px] leading-tight">{site.founder}</span>
            <span className="block text-[11.5px] text-sand">Fondatrice de {site.name}</span>
          </div>
        </div>

        <div>
          <Reveal><p className="label-lc">À propos</p></Reveal>
          <MaskLines className="mt-3">
            <h2 className="font-serif-lc text-[28px] leading-[1.1] text-espresso md:text-[36px]">
              <MaskLine>Formulatrice et passionnée</MaskLine>
              <MaskLine className="italic text-caramel">de cosmétique naturelle</MaskLine>
            </h2>
          </MaskLines>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-[480px] text-[14.5px] leading-relaxed text-espresso">
              Je suis Leslie, fondatrice de Leslie Cosmétique et experte en formulation cosmétique. J'aide les particuliers et les entrepreneurs à créer des produits efficaces, sûrs et adaptés à leurs besoins.
            </p>
            <ul className="mt-5 space-y-2">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[14px] text-espresso">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-nude text-caramel">
                    <Check size={12} strokeWidth={2.4} aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <MagneticButton to="/a-propos" variant="outline" trackName="home_about_more" className="!px-5 !py-2.5 text-[13px]">
                En savoir plus
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
