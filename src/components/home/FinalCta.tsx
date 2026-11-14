import { MagneticButton } from '@/components/MagneticButton';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';

export function FinalCta() {
  return (
    <section className="mx-auto max-w-[1120px] px-5 pb-12 md:px-8 md:pb-16" aria-label="Appel à l'action final">
      <div className="relative grid overflow-hidden rounded-[26px] bg-espresso md:grid-cols-[1.2fr_0.8fr]">
        <img src="/float-drop.webp" alt="" aria-hidden loading="lazy" className="float-soft absolute left-[46%] top-6 hidden w-12 lg:block" style={{ ['--float-rot' as string]: '5deg' }} />
        <div className="relative px-6 py-10 md:px-10 md:py-12">
          <Reveal><p className="label-lc !text-sand">On commence ?</p></Reveal>
          <MaskLines className="mt-3">
            <h2 className="font-serif-lc text-[30px] leading-[1.08] text-white-warm md:text-[40px]">
              <MaskLine>Prête à créer vos</MaskLine>
              <MaskLine className="italic text-sand">propres formules ?</MaskLine>
            </h2>
          </MaskLines>
          <Reveal delay={0.1}>
            <p className="mt-3 max-w-[400px] text-[14.5px] leading-relaxed text-cream">
              Choisissez une formation pour apprendre à votre rythme, ou réservez un appel pour en parler ensemble.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <MagneticButton to="/formations" variant="cream" trackName="final_formations">
                Voir les formations
              </MagneticButton>
              <MagneticButton
                to="/reserver"
                variant="outline"
                trackName="final_coaching"
                className="!border-white-warm/60 !text-white-warm hover:!border-white-warm hover:!bg-white-warm/10"
              >
                Réserver un appel
              </MagneticButton>
            </div>
          </Reveal>
        </div>
        <div className="relative hidden md:block">
          <img src="/cta-final.webp" alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
