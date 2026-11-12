import { useEffect, useRef } from 'react';
import { FlaskConical, HandHeart, Leaf, Sparkles } from 'lucide-react';
import { gsap } from '@/lib/anim';
import { useSeo } from '@/lib/seo';
import { site } from '@/data/site';
import { MagneticButton } from '@/components/MagneticButton';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';

const values = [
  { icon: FlaskConical, title: 'La rigueur de la formulation', text: 'Des méthodes précises, des formules équilibrées et stables, transmises sans jargon inutile.' },
  { icon: HandHeart, title: 'L\'humain avant tout', text: 'Un accompagnement qui part de votre réalité : vos cheveux, votre peau, votre projet, votre rythme.' },
  { icon: Leaf, title: 'Le naturel exigeant', text: 'Des matières premières choisies avec soin, pour des produits efficaces et sensoriels.' },
  { icon: Sparkles, title: 'L\'autonomie comme but', text: 'Mon objectif n\'est pas de vous rendre dépendante, mais de vous donner les clés pour avancer seule.' },
];

export function AboutPage() {
  useSeo({
    title: 'À propos',
    description:
      'Leslie Djoman, formulatrice en cosmétique naturelle et formatrice. Découvrez son parcours et son approche : science, sensorialité et autonomie.',
    path: '/a-propos',
  });

  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelector('img'),
        { clipPath: 'inset(100% 0 0 0 round 24px)', scale: 1.12 },
        {
          clipPath: 'inset(0% 0 0 0 round 24px)',
          scale: 1,
          duration: 1.4,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <header className="mx-auto max-w-[1120px] px-5 pb-8 pt-32 md:px-8 md:pb-10 md:pt-36">
        <Reveal><p className="label-lc">À propos</p></Reveal>
        <MaskLines className="mt-3">
          <h1 className="font-serif-lc text-[32px] leading-[1.08] text-espresso md:text-[42px]">
            <MaskLine>Formulatrice et passionnée</MaskLine>
            <MaskLine className="italic text-caramel">de cosmétique naturelle</MaskLine>
          </h1>
        </MaskLines>
      </header>

      <section className="mx-auto max-w-[1120px] px-5 md:px-8" aria-label="Portrait et parcours">
        <div className="grid items-start gap-8 md:grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr] lg:gap-14">
          <div ref={imgRef} className="relative mx-auto w-full max-w-[380px] md:sticky md:top-24">
            <img
              src="/portrait-leslie.webp"
              alt="Leslie Djoman en train de formuler une émulsion dans un bécher, entourée de flacons ambrés et d'herbes séchées"
              loading="eager"
              decoding="async"
              className="aspect-[4/5] w-full rounded-[22px] object-cover"
            />
            <img
              src="/float-drop.webp"
              alt=""
              aria-hidden
              loading="lazy"
              className="float-soft absolute -right-5 top-10 hidden w-16 md:block"
              style={{ ['--float-rot' as string]: '8deg' }}
            />
          </div>

          <div className="max-w-[640px]">
            <Reveal>
              <p className="font-serif-lc text-[21px] italic leading-snug text-brown md:text-[23px]">
                « Je suis Leslie, fondatrice de {site.name} et experte en formulation cosmétique. »
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 text-[14.5px] leading-[1.7] text-espresso">
                J'aide les particuliers et les entrepreneurs à créer des produits efficaces, sûrs et adaptés à leurs besoins. Mon travail consiste à rendre la formulation accessible : comprendre les matières premières, construire des formules équilibrées et réaliser des textures dont on est fière.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-3 text-[14.5px] leading-[1.7] text-espresso">
                Que vous souhaitiez formuler vos propres soins capillaires, résoudre une problématique précise ou lancer votre marque, je vous transmets une méthode claire et des réponses concrètes — pour que vous avanciez en toute autonomie.
              </p>
            </Reveal>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {values.map((v, i) => (
                <Reveal key={v.title} delay={i * 0.07}>
                  <div className="flex h-full items-start gap-3 rounded-[18px] border border-sand/70 bg-white-warm p-4 transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_20px_40px_-28px_rgba(107,74,56,0.4)]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nude text-brown">
                      <v.icon size={16} strokeWidth={1.5} aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-serif-lc text-[17px] leading-tight text-espresso">{v.title}</h2>
                      <p className="mt-1 text-[13px] leading-relaxed text-brown">{v.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1}>
              <div className="mt-7 flex flex-wrap gap-3">
                <MagneticButton to="/formations" trackName="about_formations" className="!px-6 !py-3 text-[14px]">Découvrir les formations</MagneticButton>
                <MagneticButton to="/reserver" variant="outline" trackName="about_coachings" className="!px-6 !py-3 text-[14px]">Réserver un coaching</MagneticButton>
              </div>
            </Reveal>

            {/* {{TÉMOIGNAGES}} — emplacement réservé pour de vrais témoignages clients */}
          </div>
        </div>
      </section>

      <div className="h-12 md:h-16" aria-hidden />
    </>
  );
}
