import { useState } from 'react';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { Link } from '@/lib/router';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';
import { track } from '@/lib/track';

const creations = [
  {
    id: 'cremes',
    title: 'Crèmes et laits',
    kicker: 'Émulsions',
    image: '/create-cream.webp',
    alt: 'Pot ambré rempli de crème ivoire onctueuse, spatule en bois posée dessus, sur une pierre travertin',
    text: 'Des textures fondantes pour la peau et les cheveux. Vous apprenez à marier phase huileuse et phase aqueuse pour une émulsion stable.',
    learn: ['Choisir votre émulsifiant', 'Doser vos actifs', 'Stabiliser votre texture'],
    to: '/offres/guide-formulation',
    cta: 'Avec le Guide',
  },
  {
    id: 'masques',
    title: 'Masques et après-shampoings',
    kicker: 'Soins capillaires',
    image: '/create-hairmask.webp',
    alt: 'Pot ambré de masque capillaire caramel, peigne en bois, huile et noix de karité',
    text: 'Des soins riches et démêlants pensés pour les cheveux crépus, frisés et bouclés.',
    learn: ['Comprendre votre fibre', 'Nourrir sans alourdir', 'Créer votre routine'],
    to: '/offres/formation-cosmetique-capillaire',
    cta: 'Avec la Formation',
  },
  {
    id: 'nettoyants',
    title: 'Shampoings et gels douche',
    kicker: 'Nettoyants',
    image: '/create-cleanser.webp',
    alt: 'Flacon pompe ambré avec mousse onctueuse, fleurs séchées et romarin',
    text: 'Des nettoyants doux qui respectent le cuir chevelu et la peau, sans les dessécher.',
    learn: ['Choisir vos tensioactifs', 'Ajuster la viscosité', 'Respecter le pH'],
    to: '/offres/guide-formulation',
    cta: 'Avec le Guide',
  },
  {
    id: 'baumes',
    title: 'Baumes et beurres',
    kicker: '100 % corps gras',
    image: '/create-balm.webp',
    alt: 'Pot ambré de baume doré, beurre de karité, pastilles de cire et cuillère en bois',
    text: 'Karité, huiles végétales et cires : des soins nourrissants, simples et précieux.',
    learn: ['Associer beurres et huiles', 'Obtenir la bonne dureté', 'Conserver vos produits'],
    to: '/offres/guide-formulation',
    cta: 'Avec le Guide',
  },
];

function FlipCard({ c, index }: { c: (typeof creations)[number]; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const toggle = () => {
    setFlipped((f) => !f);
    track('creation_flip', { card: c.id });
  };

  return (
    <Reveal delay={index * 0.08} className="w-[78vw] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none">
      <div className={`flip-card aspect-[3/4] ${flipped ? 'is-flipped' : ''}`}>
        <div className="flip-inner">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={flipped}
            aria-label={`${c.title} : voir ce que vous allez apprendre`}
            className="flip-face group overflow-hidden rounded-[22px] text-left shadow-[0_30px_60px_-34px_rgba(58,42,34,0.65)]"
          >
            <img
              src={c.image}
              alt={c.alt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1.2s] group-hover:scale-110"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/20 to-transparent" aria-hidden />
            <span className="absolute left-4 top-4 rounded-full bg-white-warm/95 px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-espresso">
              {c.kicker}
            </span>
            <span className="absolute inset-x-0 bottom-0 p-5">
              <span className="block font-serif-lc text-[25px] leading-[1.1] text-white-warm">{c.title}</span>
              <span className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-sand">
                <RotateCcw size={13} aria-hidden /> Retournez la carte
              </span>
            </span>
          </button>

          <div className="flip-face flip-back flex flex-col rounded-[22px] bg-espresso p-5 text-white-warm" aria-hidden={!flipped}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white-warm/10 text-sand">
              <Sparkles size={17} aria-hidden />
            </span>
            <p className="mt-4 font-serif-lc text-[23px] leading-[1.1]">{c.title}</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-cream">{c.text}</p>
            <ul className="mt-4 space-y-2">
              {c.learn.map((l) => (
                <li key={l} className="flex items-center gap-2 text-[13px] text-white-warm">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sand" aria-hidden />
                  {l}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-center justify-between gap-2 pt-4">
              <Link
                to={c.to}
                trackName={`creation_${c.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2.5 text-[13px] font-medium text-espresso transition-colors hover:bg-white-warm"
              >
                {c.cta} <ArrowRight size={14} aria-hidden />
              </Link>
              <button
                type="button"
                onClick={toggle}
                aria-label="Retourner la carte"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white-warm/30 text-white-warm transition-colors hover:bg-white-warm/10"
              >
                <RotateCcw size={14} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function Creations() {
  return (
    <section className="overflow-hidden py-12 md:py-16" aria-label="Ce que vous allez créer">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal><p className="label-lc">Vos futures créations</p></Reveal>
            <MaskLines className="mt-3">
              <h2 className="font-serif-lc text-[28px] leading-[1.1] text-espresso md:text-[36px]">
                <MaskLine>Ce que vous allez <span className="italic text-caramel">créer de vos mains</span></MaskLine>
              </h2>
            </MaskLines>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-[340px] text-[14px] leading-relaxed text-brown">
              Survolez ou touchez une carte pour découvrir ce que vous apprendrez à formuler.
            </p>
          </Reveal>
        </div>

        <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {creations.map((c, i) => (
            <FlipCard key={c.id} c={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
