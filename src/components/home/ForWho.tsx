import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';

const profiles = [
  {
    image: '/who-formulate.webp',
    alt: "Femme noire souriante mélangeant une crème dans un bol, cheveux en twist-out",
    title: 'Tu veux formuler tes propres soins',
    text: 'Comprendre les ingrédients, maîtriser les émulsions et créer des produits qui te ressemblent.',
    to: '/formations',
    cta: 'Voir les formations',
  },
  {
    image: '/who-brand.webp',
    alt: 'Entrepreneuse noire souriante tenant un flacon ambré dans son atelier lumineux',
    title: 'Tu as un projet de marque',
    text: 'De l\'idée au lancement : clarifier ton concept, tes produits et tes prochaines étapes.',
    to: '/offres/consultation-lancement-marque',
    cta: 'Voir la consultation',
  },
  {
    image: '/who-hair.webp',
    alt: 'Femme noire rayonnante aux cheveux crépus naturels, lumière dorée',
    title: 'Tu as des difficultés avec tes cheveux',
    text: 'Sécheresse, casse, routine introuvable : repartir avec des réponses adaptées à ta fibre.',
    to: '/offres/coaching-conseils-capillaires',
    cta: 'Voir le coaching capillaire',
  },
];

export function ForWho() {
  return (
    <section className="py-12 md:py-16" aria-label="Pour qui">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <Reveal><p className="label-lc">Pour qui ?</p></Reveal>
        <MaskLines className="mt-3">
          <h2 className="font-serif-lc text-[28px] leading-[1.1] text-espresso md:text-[36px]">
            <MaskLine>Vous vous reconnaissez <span className="italic text-caramel">dans l'une d'elles ?</span></MaskLine>
          </h2>
        </MaskLines>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {profiles.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1} className="h-full">
              <Link
                to={p.to}
                trackName={`forwho_${i}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[22px] shadow-[0_30px_60px_-36px_rgba(58,42,34,0.65)] md:aspect-[3/4]"
              >
                <img
                  src={p.image}
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-espresso/95 via-espresso/35 to-transparent transition-opacity duration-500" aria-hidden />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-serif-lc text-[23px] leading-[1.15] text-white-warm">{p.title}</h3>
                  <p className="mt-2 max-h-0 overflow-hidden text-[13.5px] leading-relaxed text-cream opacity-0 transition-all duration-500 group-hover:max-h-32 group-hover:opacity-100 group-focus-visible:max-h-32 group-focus-visible:opacity-100 [@media(hover:none)]:max-h-32 [@media(hover:none)]:opacity-100">{p.text}</p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white-warm px-4 py-2 text-[12px] font-medium text-espresso transition-colors group-hover:bg-sand">
                    {p.cta}
                    <ArrowRight size={13} strokeWidth={1.8} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
