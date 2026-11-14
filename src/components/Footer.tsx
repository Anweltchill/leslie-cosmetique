import { Instagram, Music2, Mail, ArrowUp, CalendarDays } from 'lucide-react';
import { Link } from '@/lib/router';
import { site } from '@/data/site';
import { formations, coachings, offerPath, formatPrice } from '@/data/offers';
import { track } from '@/lib/track';
import { scrollToTop } from '@/lib/anim';

const linkCls = 'link-line text-[14px] text-cream transition-colors hover:text-white-warm';
const headCls = 'text-[11.5px] font-medium uppercase tracking-[0.18em] text-sand';
const socialCls =
  'flex h-10 w-10 items-center justify-center rounded-full border border-cream/40 text-white-warm transition-all duration-300 hover:border-white-warm hover:bg-white-warm hover:text-espresso';

export function Footer() {
  return (
    <footer className="bg-espresso text-cream">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="flex flex-col items-start justify-between gap-5 border-b border-cream/20 py-8 md:flex-row md:items-center">
          <div>
            <p className="font-serif-lc text-[26px] leading-tight text-white-warm md:text-[30px]">
              Une question sur votre projet ?
            </p>
            <p className="mt-1 text-[14px] text-cream">Réservez un appel visio d’une heure, en choisissant votre date et votre heure.</p>
          </div>
          <Link
            to="/reserver"
            trackName="footer_reserver"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-cream px-5 py-3 text-[14px] font-medium text-espresso transition-colors hover:bg-white-warm"
          >
            <CalendarDays size={16} strokeWidth={1.8} aria-hidden />
            Réserver un appel
          </Link>
        </div>

        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3" ariaLabel="Leslie Cosmétique — Accueil">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream font-serif-lc text-[19px] font-medium text-espresso">
                {site.monogram}
              </span>
              <span className="text-[12px] font-medium uppercase tracking-[0.22em] text-white-warm">{site.name}</span>
            </Link>
            <p className="mt-4 max-w-[280px] text-[14px] leading-relaxed text-cream">
              Formations et coachings en cosmétique naturelle, soins capillaires et création de marque.
            </p>
            <div className="mt-5 flex gap-2.5">
              <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram de Leslie Cosmétique" onClick={() => track('social_click', { network: 'instagram' })} className={socialCls}>
                <Instagram size={17} strokeWidth={1.6} />
              </a>
              <a href={site.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok de Leslie Cosmétique" onClick={() => track('social_click', { network: 'tiktok' })} className={socialCls}>
                <Music2 size={17} strokeWidth={1.6} />
              </a>
              <a href={`mailto:${site.email}`} aria-label="Écrire un e-mail" onClick={() => track('contact_click', { channel: 'email', where: 'footer_icon' })} className={socialCls}>
                <Mail size={17} strokeWidth={1.6} />
              </a>
            </div>
          </div>

          <nav aria-label="Formations">
            <h3 className={headCls}>Formations</h3>
            <ul className="mt-4 space-y-2.5">
              {formations.map((o) => (
                <li key={o.slug} className="flex items-baseline justify-between gap-3 pr-4">
                  <Link to={offerPath(o)} className={linkCls}>{o.shortName}</Link>
                  <span className="whitespace-nowrap text-[12.5px] text-sand">{formatPrice(o.price)}</span>
                </li>
              ))}
              <li><Link to="/formations" className="link-line text-[13px] font-medium text-white-warm">Toutes les formations</Link></li>
            </ul>
          </nav>

          <nav aria-label="Coachings">
            <h3 className={headCls}>Coachings visio</h3>
            <ul className="mt-4 space-y-2.5">
              {coachings.map((o) => (
                <li key={o.slug} className="flex items-baseline justify-between gap-3 pr-4">
                  <Link to={offerPath(o)} className={linkCls}>{o.shortName}</Link>
                  <span className="whitespace-nowrap text-[12.5px] text-sand">{formatPrice(o.price)}</span>
                </li>
              ))}
              <li><Link to="/coachings" className="link-line text-[13px] font-medium text-white-warm">Tous les coachings</Link></li>
            </ul>
          </nav>

          <nav aria-label="Informations">
            <h3 className={headCls}>Infos</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/a-propos" className={linkCls}>À propos de Leslie</Link></li>
              <li><Link to="/contact" className={linkCls}>Contact</Link></li>
              <li><Link to="/reserver" className={linkCls}>Réserver un appel</Link></li>
              <li>
                <a href={`mailto:${site.email}`} className={linkCls} onClick={() => track('contact_click', { channel: 'email', where: 'footer' })}>
                  {site.email}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-cream/20 py-6 text-[12.5px] text-cream md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} {site.name}. Tous droits réservés.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li><Link to="/mentions-legales" className="link-line hover:text-white-warm">Mentions légales</Link></li>
            <li><Link to="/cgv" className="link-line hover:text-white-warm">CGV</Link></li>
            <li><Link to="/confidentialite" className="link-line hover:text-white-warm">Confidentialité</Link></li>
          </ul>
          <button
            type="button"
            onClick={() => scrollToTop()}
            className="inline-flex items-center gap-1.5 text-white-warm transition-colors hover:text-sand"
          >
            Retour en haut <ArrowUp size={14} aria-hidden />
          </button>
        </div>
      </div>
    </footer>
  );
}
