import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';
import { MagneticButton } from '@/components/MagneticButton';

const steps = [
  {
    num: '01',
    title: 'Je choisis mon offre',
    text: 'Une formation pour apprendre en autonomie, ou un coaching pour être accompagnée en visio.',
    image: '/step-choose.webp',
    alt: "Main d'une femme parcourant les offres Leslie Cosmétique sur un ordinateur portable",
  },
  {
    num: '02',
    title: 'J’achète ou je réserve',
    text: 'Inscription à la formation, accès immédiat aux guides, ou choix de votre date et de votre heure dans le calendrier.',
    image: '/step-book.webp',
    alt: 'Mains tenant un téléphone affichant un calendrier de réservation',
  },
  {
    num: '03',
    title: 'J’avance en autonomie',
    text: 'Vous formulez, vous ajustez, vous progressez, avec des méthodes claires et des réponses concrètes.',
    image: '/step-progress.webp',
    alt: 'Mains versant une crème ivoire dans un pot en verre, geste sûr et accompli',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white-warm py-12 md:py-16" aria-label="Comment ça se passe">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal><p className="label-lc">Comment ça se passe</p></Reveal>
            <MaskLines className="mt-3">
              <h2 className="font-serif-lc text-[28px] leading-[1.1] text-espresso md:text-[36px]">
                <MaskLine>Trois étapes, <span className="italic text-caramel">et vous avancez</span></MaskLine>
              </h2>
            </MaskLines>
          </div>
          <Reveal delay={0.1}>
            <MagneticButton to="/reserver" variant="outline" trackName="hiw_reserver" className="!px-5 !py-2.5 text-[13px]">
              Réserver un appel
            </MagneticButton>
          </Reveal>
        </div>

        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal
              as="li"
              key={s.num}
              delay={i * 0.1}
              className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-sand/70 bg-cream transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_22px_44px_-30px_rgba(107,74,56,0.5)]"
            >
              <div className="relative w-full overflow-hidden">
                <img src={s.image} alt={s.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
                <span className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white-warm font-serif-lc text-[16px] text-espresso shadow-md">{s.num}</span>
              </div>
              <div className="p-5">
                <h3 className="font-serif-lc text-[20px] leading-tight text-espresso">{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-brown">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
