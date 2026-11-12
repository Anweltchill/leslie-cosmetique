import { FlaskConical, HandHeart, Leaf } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const pillars = [
  {
    icon: FlaskConical,
    title: 'Une expertise réelle',
    text: 'Basée sur la science et la pratique',
  },
  {
    icon: HandHeart,
    title: 'Un accompagnement personnalisé',
    text: 'Adapté à vos besoins',
  },
  {
    icon: Leaf,
    title: 'Une approche naturelle et efficace',
    text: 'Des résultats concrets',
  },
];

export function Pillars() {
  return (
    <section className="border-y border-sand/50 bg-white-warm" aria-label="Les trois piliers">
      <div className="mx-auto grid max-w-[1120px] gap-5 px-5 py-6 sm:grid-cols-3 md:gap-6 md:px-8 md:py-7">
        {pillars.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.1} className={`flex items-start gap-4 ${i > 0 ? 'sm:border-l sm:border-sand/70 sm:pl-6' : ''}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nude text-espresso transition-transform duration-500 hover:rotate-6 hover:scale-105">
              <p.icon size={17} strokeWidth={1.6} aria-hidden />
            </span>
            <div>
              <h3 className="font-serif-lc text-[17px] leading-snug text-espresso">{p.title}</h3>
              <p className="mt-0.5 text-[13px] leading-snug text-brown">{p.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
