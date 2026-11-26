import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, CreditCard, ExternalLink, LayoutDashboard, Loader2, LogIn, Menu, MessageCircleQuestion, Settings as SettingsIcon, TrendingUp, Users, X } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { site } from '@/data/site';
import { SESSION_EXPIRED, getToken, login, logout, rpc, type Booking, type Question } from './api';
import { Overview } from './sections/Overview';
import { Acquisition } from './sections/Acquisition';
import { Agenda } from './sections/Agenda';
import { Contacts } from './sections/Contacts';
import { Support } from './sections/Support';
import { Payments } from './sections/Payments';
import { Settings } from './sections/Settings';
import { inputCls } from './format';

const NAV = [
  { to: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { to: '/admin/acquisition', label: 'Acquisition', icon: TrendingUp },
  { to: '/admin/agenda', label: 'Agenda', icon: CalendarDays, badge: 'bookings' as const },
  { to: '/admin/contacts', label: 'Contacts', icon: Users },
  { to: '/admin/support', label: 'Support', icon: MessageCircleQuestion, badge: 'questions' as const },
  { to: '/admin/paiements', label: 'Paiements', icon: CreditCard },
  { to: '/admin/parametres', label: 'Paramètres', icon: SettingsIcon },
];

function useAdminHead() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `Admin — ${site.name}`;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      meta.remove();
    };
  }, []);
}

export default function AdminApp() {
  useAdminHead();
  const [me, setMe] = useState<{ email: string; name: string } | null>(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    rpc<{ email: string; name: string }>('lc_admin_me')
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setMe(null);
    window.addEventListener(SESSION_EXPIRED, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED, onExpired);
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-brown">
        <Loader2 size={20} className="animate-spin" aria-label="Chargement" />
      </div>
    );
  }
  if (!me) return <Login onLogged={setMe} />;
  return <Shell me={me} onLogout={async () => { await logout(); setMe(null); }} />;
}

function Login({ onLogged }: { onLogged: (me: { email: string; name: string }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await login(email, password);
    if (!r.ok) {
      setError(r.error);
      setBusy(false);
      return;
    }
    try {
      onLogged(await rpc<{ email: string; name: string }>('lc_admin_me'));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5 py-10">
      <form onSubmit={submit} className="w-full max-w-[380px] rounded-[22px] border border-sand/70 bg-white-warm p-7 shadow-[0_30px_60px_-40px_rgba(58,42,34,0.6)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-espresso font-serif-lc text-[20px] text-white-warm">{site.monogram}</span>
        <h1 className="mt-4 font-serif-lc text-[28px] leading-tight text-espresso">Espace admin</h1>
        <p className="mt-1 text-[13px] text-brown">{site.name}</p>
        <label className="mt-6 block text-[12.5px] font-medium text-espresso">
          E-mail
          <input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} mt-1 py-2.5`} />
        </label>
        <label className="mt-3 block text-[12.5px] font-medium text-espresso">
          Mot de passe
          <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} mt-1 py-2.5`} />
        </label>
        {error && <p className="mt-3 text-[13px] text-[#9b3b2a]" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-espresso px-5 py-3 text-[14px] font-medium text-white-warm transition-colors hover:bg-brown disabled:opacity-60">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} Se connecter
        </button>
        <Link to="/" className="link-line mt-5 inline-block text-[12.5px] text-brown">← Retour au site</Link>
      </form>
    </div>
  );
}

function Shell({ me, onLogout }: { me: { email: string; name: string }; onLogout: () => void }) {
  const { path } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [badges, setBadges] = useState({ bookings: 0, questions: 0 });

  const refreshBadges = useCallback(async () => {
    try {
      const now = new Date();
      const [b, q] = await Promise.all([
        rpc<Booking[]>('lc_admin_bookings', { p_from: now.toISOString(), p_to: new Date(now.getTime() + 365 * 86400000).toISOString() }),
        rpc<Question[]>('lc_admin_questions'),
      ]);
      setBadges({ bookings: b.filter((x) => x.status === 'pending').length, questions: q.filter((x) => x.status === 'new').length });
    } catch {
      /* compteurs facultatifs */
    }
  }, []);

  useEffect(() => {
    void refreshBadges();
  }, [refreshBadges, path]);
  useEffect(() => setMenuOpen(false), [path]);

  const current = path === '/admin' || path === '/admin/' ? '/admin' : path;
  let section;
  switch (current) {
    case '/admin/acquisition': section = <Acquisition />; break;
    case '/admin/agenda': section = <Agenda onChange={refreshBadges} />; break;
    case '/admin/contacts': section = <Contacts />; break;
    case '/admin/support': section = <Support onChange={refreshBadges} />; break;
    case '/admin/paiements': section = <Payments />; break;
    case '/admin/parametres': section = <Settings email={me.email} onLogout={onLogout} />; break;
    default: section = <Overview />;
  }

  const nav = (
    <nav aria-label="Navigation admin" className="space-y-1">
      {NAV.map((n) => {
        const active = current === n.to;
        const count = n.badge ? badges[n.badge] : 0;
        return (
          <Link
            key={n.to}
            to={n.to}
            className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] font-medium transition-colors ${
              active ? 'bg-white-warm/10 text-white-warm' : 'text-sand hover:bg-white-warm/5 hover:text-white-warm'
            }`}
          >
            <n.icon size={17} strokeWidth={1.7} aria-hidden />
            <span className="flex-1">{n.label}</span>
            {count > 0 && <span className="rounded-full bg-[#c8873e] px-2 py-0.5 text-[11px] font-semibold text-white-warm">{count}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden flex-col bg-espresso p-5 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="mb-8 flex items-center gap-3 px-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white-warm font-serif-lc text-[18px] text-espresso">{site.monogram}</span>
          <div>
            <p className="font-serif-lc text-[18px] leading-tight text-white-warm">{site.name}</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-sand">Espace admin</p>
          </div>
        </div>
        {nav}
        <div className="mt-auto space-y-2 border-t border-white-warm/10 pt-4">
          <a href={/^admin[.-]/.test(window.location.hostname) ? site.url : '/'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 text-[13px] text-sand hover:text-white-warm">
            <ExternalLink size={14} aria-hidden /> Voir le site
          </a>
          <p className="truncate px-3 text-[12px] text-sand/70">{me.email}</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-espresso px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white-warm font-serif-lc text-[16px] text-espresso">{site.monogram}</span>
          <span className="text-[12px] uppercase tracking-[0.16em] text-sand">Espace admin</span>
        </div>
        <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white-warm/30 text-white-warm">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
          {!menuOpen && badges.bookings + badges.questions > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#c8873e]" />}
        </button>
      </header>
      {menuOpen && <div className="sticky top-[64px] z-20 bg-espresso px-4 pb-4 lg:hidden">{nav}</div>}

      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-8">{section}</main>
    </div>
  );
}
