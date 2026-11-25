import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { RouterProvider, useRouter } from '@/lib/router';
import { initSmoothScroll, scrollToTop, ScrollTrigger } from '@/lib/anim';
import { initScrollDepthTracking, track } from '@/lib/track';
import { injectJsonLd } from '@/lib/seo';
import { promoActive } from '@/lib/promo';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Intro } from '@/components/Intro';
import { Cursor } from '@/components/Cursor';
import { UrgencyPopup } from '@/components/UrgencyPopup';
import { QuestionWidget } from '@/components/QuestionWidget';
import { HomePage } from '@/pages/HomePage';
import { FormationsPage } from '@/pages/FormationsPage';
import { CoachingsPage } from '@/pages/CoachingsPage';
import { OfferPage } from '@/pages/OfferPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { BookingPage } from '@/pages/BookingPage';
import { MerciPage } from '@/pages/MerciPage';
import { MentionsLegalesPage, CgvPage, ConfidentialitePage } from '@/pages/LegalPages';

function ScrollManager() {
  const { path } = useRouter();
  useEffect(() => {
    scrollToTop(true);
    const raf = requestAnimationFrame(() => scrollToTop(true));
    const t = setTimeout(() => ScrollTrigger.refresh(), 60);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [path]);
  return null;
}

function ProgressBar() {
  useEffect(() => {
    const bar = document.getElementById('lc-progress');
    if (!bar) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        bar.style.transform = `scaleX(${p})`;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div
      id="lc-progress"
      className="fixed inset-x-0 top-0 z-[55] h-[2px] origin-left scale-x-0 bg-caramel"
      aria-hidden
    />
  );
}

function Routes({ introDone }: { introDone: boolean }) {
  const { path } = useRouter();

  const page = useMemo(() => {
    if (path === '/') return <HomePage started={introDone} />;
    if (path === '/formations') return <FormationsPage />;
    if (path === '/coachings') return <CoachingsPage />;
    if (path.startsWith('/offres/')) return <OfferPage slug={path.replace('/offres/', '')} />;
    if (path === '/a-propos') return <AboutPage />;
    if (path === '/contact') return <ContactPage />;
    if (path === '/reserver') return <BookingPage />;
    if (path.startsWith('/reserver/')) return <BookingPage slug={path.replace('/reserver/', '')} />;
    if (path === '/merci') return <MerciPage />;
    if (path === '/mentions-legales') return <MentionsLegalesPage />;
    if (path === '/cgv') return <CgvPage />;
    if (path === '/confidentialite') return <ConfidentialitePage />;
    return <HomePage started={introDone} />;
  }, [path, introDone]);

  return (
    <main key={path} className={`page-enter ${promoActive ? 'pt-8' : ''}`}>
      {page}
    </main>
  );
}

// Espace admin chargé à part (n'alourdit pas le site public).
const AdminApp = lazy(() => import('@/admin/AdminApp'));

function AppInner() {
  const { path } = useRouter();
  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-cream" />}>
        <AdminApp />
      </Suspense>
    );
  }
  return <PublicSite />;
}

function PublicSite() {
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  useEffect(() => {
    initSmoothScroll();
    injectJsonLd();
    // Page d'arrivée (les changements de page suivants sont suivis par le routeur).
    track('page_view', { path: window.location.pathname });
  }, []);

  useEffect(() => initScrollDepthTracking(), []);

  return (
    <div className="grain">
      <Intro onDone={finishIntro} />
      <ProgressBar />
      <Navbar />
      <ScrollManager />
      <Routes introDone={introDone} />
      <Footer />
      <UrgencyPopup />
      <QuestionWidget />
      <Cursor />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AppInner />
    </RouterProvider>
  );
}
