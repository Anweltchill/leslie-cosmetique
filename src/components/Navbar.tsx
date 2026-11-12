import { useEffect, useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { site } from '@/data/site';
import { MagneticButton } from './MagneticButton';

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/formations', label: 'Formations' },
  { to: '/coachings', label: 'Coachings' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const { path } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 40);
        setHidden(y > 140 && y > lastY && !menuOpen);
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${hidden ? '-translate-y-full' : 'translate-y-0'} ${
          scrolled ? 'bg-cream/95 shadow-[0_1px_0_rgba(217,196,172,0.7)] backdrop-blur-md' : 'bg-cream'
        }`}
      >
        <nav className="mx-auto flex h-[64px] max-w-[1120px] items-center justify-between px-5 md:px-8" aria-label="Navigation principale">
          <Link to="/" className="group flex items-center gap-3" ariaLabel="Leslie Cosmétique — Accueil" trackName="logo">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-espresso font-serif-lc text-[18px] font-medium leading-none text-white-warm transition-transform duration-500 group-hover:rotate-[-8deg]">
              {site.monogram}
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.22em] text-espresso sm:block">{site.name}</span>
          </Link>

          <ul className="hidden items-center gap-7 lg:flex">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  trackName={`nav_${l.label}`}
                  className={`link-line text-[12.5px] font-medium uppercase tracking-[0.12em] transition-colors ${
                    path === l.to ? 'active text-caramel' : 'text-espresso hover:text-caramel'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <MagneticButton to="/reserver" trackName="nav_reserver" className="!px-5 !py-2.5 text-[13px]">
              Réserver un appel
            </MagneticButton>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-sand text-espresso transition-colors lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
          >
            <Menu size={20} strokeWidth={1.6} />
          </button>
        </nav>
      </header>

      {/* Menu mobile plein écran */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col bg-cream transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex h-[72px] items-center justify-between px-5">
          <span className="font-serif-lc text-[30px] font-medium text-espresso">{site.monogram}</span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-sand text-espresso"
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={20} strokeWidth={1.6} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col justify-center px-8" aria-label="Menu mobile">
          <ul className="space-y-2">
            {links.map((l, i) => (
              <li
                key={l.to}
                className={`overflow-hidden transition-all delay-[${i * 60}ms] duration-500 ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
                style={{ transitionDelay: menuOpen ? `${120 + i * 70}ms` : '0ms' }}
              >
                <Link
                  to={l.to}
                  className={`group flex items-center justify-between border-b border-sand/60 py-3.5 font-serif-lc text-[32px] leading-none ${
                    path === l.to ? 'text-caramel' : 'text-espresso'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                  <ArrowRight size={26} strokeWidth={1.4} className="text-caramel opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <div
            className={`mt-10 transition-all duration-500 ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
            style={{ transitionDelay: menuOpen ? '500ms' : '0ms' }}
          >
            <MagneticButton to="/reserver" trackName="menu_reserver" className="w-full">
              Réserver un appel
            </MagneticButton>
          </div>
        </nav>
      </div>
    </>
  );
}
