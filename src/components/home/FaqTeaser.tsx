import { FaqAccordion } from '@/components/FaqAccordion';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';
import { Link } from '@/lib/router';
import { site } from '@/data/site';

const items = [
  {
    q: "Est-ce accessible depuis l'Afrique ?",
    a: "Oui. Les formations comme les coachings sont 100 % en ligne : vous pouvez suivre les cours et réserver votre visio depuis l'Afrique francophone comme depuis la diaspora.",
  },
  {
    q: 'Quels sont les moyens de paiement ?',
    a: site.faq.paiement,
  },
  {
    q: 'Faut-il un prérequis pour se lancer ?',
    a: site.faq.prerequis,
  },
  {
    q: "Combien de temps ai-je accès aux formations ?",
    a: site.faq.acces,
  },
  {
    q: 'Comment se déroulent les coachings ?',
    a: "En visio, pendant 1 heure, à un créneau que vous choisissez (30 minutes pour l'audit d'orientation). Vous repartez avec des réponses concrètes et des pistes d'action claires.",
  },
];

export function FaqTeaser() {
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-12 md:px-8 md:py-16" aria-label="Questions fréquentes">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:gap-14">
        <div>
          <Reveal><p className="label-lc">Questions fréquentes</p></Reveal>
          <MaskLines className="mt-3">
            <h2 className="font-serif-lc text-[28px] leading-[1.1] text-espresso md:text-[36px]">
              <MaskLine>Tout ce que vous</MaskLine>
              <MaskLine className="italic text-caramel">vous demandez</MaskLine>
            </h2>
          </MaskLines>
          <Reveal delay={0.12}>
            <p className="mt-4 max-w-[340px] text-[14px] leading-relaxed text-brown">
              Une autre question ? Écrivez-moi directement, je réponds personnellement.
            </p>
            <Link to="/contact" trackName="faq_contact_link" className="link-line mt-4 inline-block text-[14px] font-medium text-espresso">
              Aller à la page contact
            </Link>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <FaqAccordion items={items} idPrefix="home-faq" />
        </Reveal>
      </div>
    </section>
  );
}
