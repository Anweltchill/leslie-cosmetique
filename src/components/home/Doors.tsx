import { ArrowUpRight, GraduationCap, Video } from 'lucide-react';
import { Link } from '@/lib/router';
import { formations, coachings, offerPath, formatPrice, type Offer } from '@/data/offers';
import { Reveal, MaskLines, MaskLine } from '@/components/Reveal';
import { CountdownLine } from '@/components/Countdown';
import { LoopVideo } from '@/components/LoopVideo';

function Family({
  icon: Icon,
  label,
  title,
  text,
  image,
  imageAlt,
  video,
  items,
  to,
  cta,
  dark,
  delay,
}: {
  icon: typeof GraduationCap;
  label: string;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
  /** Vidéo d'illustration (remplace l'image ; l'image reste l'aperçu si la vidéo ne joue pas). */
  video?: { src: string; poster: string };
  items: Offer[];
  to: string;
  cta: string;
  dark?: boolean;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <article className={`group flex h-full flex-col overflow-hidden rounded-[22px] ${dark ? 'bg-espresso text-white-warm' : 'border border-sand/70 bg-white-warm text-espresso'}`}>
        <Link to={to} trackName={`family_img_${title}`} className="relative block overflow-hidden">
          {video ? (
            <LoopVideo src={video.src} poster={video.poster} className="aspect-[16/10] w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
          ) : (
            <img src={image} alt={imageAlt} loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/10 to-transparent" aria-hidden />
          <span className="absolute inset-x-0 bottom-0 p-5 md:p-6">
            <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-sand">
              <Icon size={14} strokeWidth={1.8} aria-hidden /> {label}
            </span>
            <span className="mt-1.5 block font-serif-lc text-[32px] leading-none text-white-warm">{title}</span>
            <span className="mt-2 block max-w-[380px] text-[13.5px] leading-snug text-cream">{text}</span>
          </span>
        </Link>
        <div className="flex flex-1 flex-col px-5 pb-5 md:px-6 md:pb-6">
        <ul className={`divide-y ${dark ? 'divide-white-warm/15' : 'divide-sand/70'}`}>
          {items.map((o) => (
            <li key={o.slug}>
              <Link
                to={offerPath(o)}
                trackName={`family_${o.slug}`}
                className="group flex items-center justify-between gap-4 py-3.5"
              >
                <span className="min-w-0">
                  <span className="block font-serif-lc text-[18px] leading-tight">{o.name}</span>
                  <span className={`block text-[12.5px] ${dark ? 'text-sand' : 'text-brown'}`}>{o.durationLabel ?? o.channel}</span>
                  {o.enrollment && (
                    <span className="mt-1 block">
                      <CountdownLine offer={o} where="home_door" tone={dark ? 'dark' : 'light'} />
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-serif-lc text-[20px] font-medium">{formatPrice(o.price)}</span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 group-hover:rotate-45 ${dark ? 'bg-white-warm text-espresso' : 'bg-espresso text-white-warm'}`}>
                    <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          to={to}
          trackName={`family_all_${title}`}
          className={`link-line mt-5 self-start text-[13px] font-medium ${dark ? 'text-white-warm' : 'text-espresso'}`}
        >
          {cta}
        </Link>
        </div>
      </article>
    </Reveal>
  );
}

export function Doors() {
  return (
    <section className="mx-auto max-w-[1120px] px-5 py-12 md:px-8 md:py-16" aria-label="Mes offres">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal><p className="label-lc">Mes offres</p></Reveal>
          <MaskLines className="mt-3">
            <h2 className="font-serif-lc text-[28px] leading-[1.1] text-espresso md:text-[36px]">
              <MaskLine>Deux façons d’avancer <span className="italic text-caramel">avec moi</span></MaskLine>
            </h2>
          </MaskLines>
        </div>
        <Reveal delay={0.1} className="max-w-[360px]">
          <p className="text-[14px] leading-relaxed text-brown">
            Apprenez seule avec une formation en ligne, ou faites-vous accompagner en visio lors d’un coaching individuel.
          </p>
        </Reveal>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5">
        <Family
          icon={GraduationCap}
          label="Apprendre seule"
          title="Formations"
          text="Des guides en ligne pour apprendre à formuler, à votre rythme."
          image="/videos/porte-formations.webp"
          imageAlt="Application d'une crème capillaire maison sur des cheveux crépus"
          // Source : Drive « Leslie cosmetique media site », copy_C84358A3-….mov (portrait 4K).
          // Cadrage 16:10 : plan 1 (crème sur les doigts) à 34 % de la hauteur, plan 2 (cheveux) à 10 %.
          video={{ src: '/videos/porte-formations.mp4', poster: '/videos/porte-formations.webp' }}
          items={formations}
          to="/formations"
          cta="Voir les formations"
          delay={0}
        />
        <Family
          icon={Video}
          label="Être accompagnée"
          title="Coachings"
          text="Un accompagnement individuel avec Leslie pour vos formules, votre marque, ou pour vous orienter."
          image="/videos/porte-coachings.webp"
          imageAlt="Femme noire parlant face caméra en appliquant un soin sur sa main"
          // Source : Drive « Leslie cosmetique media site », copy_827EAC12-….mov (portrait 4K, un seul plan).
          // Cadrage 16:10 fixe à 25 % de la hauteur (gros plan visage, yeux au-dessus du texte même sur mobile).
          video={{ src: '/videos/porte-coachings.mp4', poster: '/videos/porte-coachings.webp' }}
          items={coachings}
          to="/coachings"
          cta="Voir les coachings"
          dark
          delay={0.1}
        />
      </div>
    </section>
  );
}
