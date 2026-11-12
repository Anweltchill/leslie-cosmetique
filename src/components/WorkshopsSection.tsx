import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';
import { MagneticButton } from '@/components/MagneticButton';

/**
 * SECTION ATELIERS — composants prêts, masqués pour plus tard.
 * Pour l'activer : importer dans HomePage et passer `visible` à true,
 * puis remplir la liste des ateliers ci-dessous.
 */
const workshops: { title: string; date: string; places: number; description: string }[] = [];

export function WorkshopsSection({ visible = false }: { visible?: boolean }) {
  if (!visible) return null;

  return (
    <section className="bg-nude py-12 md:py-16" aria-label="Ateliers">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <Reveal><p className="label-lc">Ateliers</p></Reveal>
        <MaskLines className="mt-3">
          <h2 className="font-serif-lc text-[28px] leading-[1.1] text-espresso md:text-[36px]">
            <MaskLine>Formuler ensemble,</MaskLine>
            <MaskLine className="italic text-caramel">en petit groupe</MaskLine>
          </h2>
        </MaskLines>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {workshops.map((w) => (
            <article key={w.title} className="rounded-[22px] border border-sand/70 bg-white-warm p-6">
              <div className="flex items-center justify-between text-[12px] font-medium uppercase tracking-[0.14em] text-caramel">
                <span>{w.date}</span>
                <span>{w.places} places</span>
              </div>
              <h3 className="mt-3 font-serif-lc text-[22px] text-espresso">{w.title}</h3>
              <p className="mt-2 text-[14px] text-brown">{w.description}</p>
              <MagneticButton to="/contact" variant="outline" className="mt-6" trackName={`workshop_${w.title}`}>
                Demander une place
              </MagneticButton>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
