import { Mail, Instagram, Music2, CalendarHeart, ArrowUpRight } from 'lucide-react';
import { useSeo } from '@/lib/seo';
import { site } from '@/data/site';
import { track } from '@/lib/track';
import { Link } from '@/lib/router';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';

export function ContactPage() {
  useSeo({
    title: 'Contact',
    description:
      'Contactez Leslie Cosmétique : une question sur une formation, un coaching ou votre projet de marque ? Écrivez directement à Leslie.',
    path: '/contact',
  });

  return (
    <>
      <header className="mx-auto max-w-[1120px] px-5 pb-8 pt-32 md:px-8 md:pb-10 md:pt-36">
        <Reveal><p className="label-lc">Contact</p></Reveal>
        <MaskLines className="mt-3">
          <h1 className="font-serif-lc text-[32px] leading-[1.08] text-espresso md:text-[42px]">
            <MaskLine>Écrivez-moi,</MaskLine>
            <MaskLine className="italic text-caramel">je réponds personnellement</MaskLine>
          </h1>
        </MaskLines>
        <Reveal delay={0.12}>
          <p className="mt-4 max-w-[480px] text-[14.5px] leading-relaxed text-brown">
            Une question avant de vous lancer ? Un doute sur l'offre la plus adaptée ? Envoyez un message, sans formulaire obligatoire ni inscription.
          </p>
        </Reveal>
      </header>

      <section className="mx-auto max-w-[1120px] px-5 pb-12 md:px-8 md:pb-16" aria-label="Moyens de contact">
        <div className="grid gap-4 md:grid-cols-3">
          <Reveal>
            <a
              href={`mailto:${site.email}`}
              onClick={() => track('contact_click', { channel: 'email', where: 'contact_page' })}
              className="group flex h-full flex-col rounded-[20px] border border-sand/70 bg-white-warm p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_26px_50px_-30px_rgba(107,74,56,0.45)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-nude text-brown">
                <Mail size={20} strokeWidth={1.5} aria-hidden />
              </span>
              <h2 className="mt-5 font-serif-lc text-[21px] text-espresso">Par e-mail</h2>
              <p className="mt-2 flex-1 text-[14px] text-brown">Le moyen le plus simple et le plus direct.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-[14px] font-medium text-espresso transition-colors group-hover:text-caramel">
                {site.email}
                <ArrowUpRight size={15} strokeWidth={1.8} className="transition-transform duration-300 group-hover:rotate-45" aria-hidden />
              </span>
            </a>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="flex h-full flex-col rounded-[20px] border border-sand/70 bg-white-warm p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-nude text-brown">
                <Instagram size={20} strokeWidth={1.5} aria-hidden />
              </span>
              <h2 className="mt-5 font-serif-lc text-[21px] text-espresso">Sur les réseaux</h2>
              <p className="mt-2 flex-1 text-[14px] text-brown">Conseils, textures et coulisses de formulation, chaque semaine.</p>
              <div className="mt-5 flex gap-3">
                <a
                  href={site.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('social_click', { network: 'instagram', where: 'contact_page' })}
                  className="inline-flex items-center gap-2 rounded-full border border-sand px-5 py-2.5 text-[13.5px] font-medium text-espresso transition-all hover:border-espresso hover:bg-espresso hover:text-cream"
                >
                  <Instagram size={15} strokeWidth={1.8} aria-hidden /> Instagram
                </a>
                <a
                  href={site.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('social_click', { network: 'tiktok', where: 'contact_page' })}
                  className="inline-flex items-center gap-2 rounded-full border border-sand px-5 py-2.5 text-[13.5px] font-medium text-espresso transition-all hover:border-espresso hover:bg-espresso hover:text-cream"
                >
                  <Music2 size={15} strokeWidth={1.8} aria-hidden /> TikTok
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="flex h-full flex-col rounded-[20px] border border-sand/70 bg-espresso p-6 text-white-warm">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white-warm/10 text-nude">
                <CalendarHeart size={20} strokeWidth={1.5} aria-hidden />
              </span>
              <h2 className="mt-5 font-serif-lc text-[21px]">Réserver directement</h2>
              <p className="mt-2 flex-1 text-[14px] text-cream">
                Vous savez déjà ce qu'il vous faut ? Choisissez votre date et votre heure dans le calendrier.
              </p>
              <Link
                to="/reserver"
                trackName="contact_booking_card"
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-cream px-6 py-3 text-[14px] font-medium text-espresso transition-colors hover:bg-white-warm"
              >
                Ouvrir le calendrier
                <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
