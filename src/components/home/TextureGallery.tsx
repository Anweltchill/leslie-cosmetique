import { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';
import { track } from '@/lib/track';

const textures = [
  { src: '/texture-shea.webp', alt: 'Beurre de karité brut dans un bol en bois', caption: 'Beurre de karité' },
  { src: '/texture-whipped.webp', alt: 'Crème fouettée ivoire aux volutes soyeuses', caption: 'Crèmes fouettées' },
  { src: '/texture-gel.webp', alt: 'Gel cosmétique translucide ambré aux fines bulles', caption: 'Gels translucides' },
  { src: '/texture-oils.webp', alt: 'Huiles végétales dorées dans des flacons en verre', caption: 'Huiles dorées' },
  { src: '/texture-wax.webp', alt: "Perles de cire d'abeille dans un bol en céramique", caption: "Cire d'abeille" },
  { src: '/texture-clay.webp', alt: "Poudre fine d'argile beige et sa cuillère en bois", caption: 'Argiles douces' },
  { src: '/texture-botanicals.webp', alt: 'Pétales et plantes séchées sur lin beige', caption: 'Plantes séchées' },
  { src: '/texture-emulsion.webp', alt: 'Émulsion ivoire qui coule en rubans brillants', caption: 'Émulsions' },
  { src: '/texture-pipette.webp', alt: "Flacon à pipette ambré laissant tomber une goutte d'huile", caption: 'Actifs précieux' },
];

const marqueeWords = ['Émulsions', 'Textures', 'Actifs', 'Équilibre', 'Stabilité', 'Autonomie'];

export function TextureGallery() {
  const stripRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 300, behavior: 'smooth' });
    track('texture_arrow', { direction: dir > 0 ? 'next' : 'prev' });
  };

  return (
    <section className="overflow-hidden bg-cream" aria-label="Galerie des textures et matières premières">
      <div className="mx-auto grid max-w-[1120px] items-center gap-6 px-5 py-12 md:grid-cols-[260px_1fr] md:gap-10 md:px-8 md:py-16">
        <div>
          <Reveal><p className="label-lc">Textures et matières</p></Reveal>
          <MaskLines className="mt-3">
            <h2 className="font-serif-lc text-[28px] leading-[1.1] text-espresso md:text-[36px]">
              <MaskLine>La matière</MaskLine>
              <MaskLine className="italic text-caramel">avant toute chose</MaskLine>
            </h2>
          </MaskLines>
          <Reveal delay={0.1}>
            <p className="mt-3 text-[14px] leading-relaxed text-brown">
              Beurres, huiles, argiles, actifs : apprenez à connaître chaque ingrédient pour créer des soins qui fonctionnent vraiment.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                aria-label="Images précédentes"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-sand text-espresso transition-all hover:border-espresso hover:bg-espresso hover:text-white-warm"
              >
                <ArrowLeft size={16} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Images suivantes"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-sand text-espresso transition-all hover:border-espresso hover:bg-espresso hover:text-white-warm"
              >
                <ArrowRight size={16} strokeWidth={1.8} />
              </button>
            </div>
          </Reveal>
        </div>

        <div
          ref={stripRef}
          className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:-mr-8 md:ml-0 md:pl-0 md:pr-8 lg:-mr-[max(2rem,calc((100vw-1120px)/2+2rem))] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-label="Galerie de textures, faites glisser pour parcourir"
        >
          {textures.map((t, i) => (
            <figure key={t.src} className={`group w-[220px] shrink-0 snap-start md:w-[280px] ${i % 2 === 1 ? 'md:mt-10' : ''}`}>
              <div className="overflow-hidden rounded-[20px] shadow-[0_24px_50px_-32px_rgba(58,42,34,0.6)]">
                <img
                  src={t.src}
                  alt={t.alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <figcaption className="mt-3 font-serif-lc text-[18px] text-espresso">{t.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="border-y border-sand/60 bg-nude/60 py-3" aria-hidden>
        <div className="flex overflow-hidden">
          {[0, 1].map((half) => (
            <div key={half} className="marquee-track flex shrink-0 items-center gap-6 pr-6">
              {[...marqueeWords, ...marqueeWords, ...marqueeWords].map((w, i) => (
                <span key={i} className="flex items-center gap-6">
                  <span className="font-serif-lc text-[20px] italic text-brown">{w}</span>
                  <span className="block h-1 w-1 rounded-full bg-caramel" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
