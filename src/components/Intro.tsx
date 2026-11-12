import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/anim';
import { site } from '@/data/site';

export function Intro({ onDone }: { onDone: () => void }) {
  const [skip] = useState(() => sessionStorage.getItem('lc-intro') === '1');
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skip) {
      onDone();
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.to(root.current, {
          autoAlpha: 0,
          duration: 0.3,
          onComplete: () => { sessionStorage.setItem('lc-intro', '1'); onDone(); },
        });
        return;
      }
      const tl = gsap.timeline({
        onComplete: () => { sessionStorage.setItem('lc-intro', '1'); onDone(); },
      });
      tl.fromTo('.intro-mono path', { strokeDashoffset: 340 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.08 })
        .fromTo('.intro-drop', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }, '-=0.35')
        .to('.intro-drop', { y: '110vh', duration: 0.55, ease: 'power2.in' }, '+=0.15')
        .to(root.current, { yPercent: -100, duration: 0.65, ease: 'power3.inOut' }, '-=0.25');
    }, root);
    return () => ctx.revert();
  }, [skip, onDone]);

  if (skip) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[100] flex items-center justify-center bg-cream" role="presentation">
      <div className="relative flex flex-col items-center">
        <svg className="intro-mono h-24 w-24" viewBox="0 0 100 100" fill="none" aria-hidden>
          <path d="M62 22 H34 V78 H64" stroke="var(--espresso)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="340" strokeDashoffset="340" />
          <path d="M70 36 C56 30 44 38 44 50 C44 63 58 70 70 64" stroke="var(--caramel)" strokeWidth="4" strokeLinecap="round" strokeDasharray="340" strokeDashoffset="340" />
        </svg>
        <span className="intro-drop mt-4 block h-3 w-3 rounded-full bg-caramel" aria-hidden />
        <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.28em] text-brown/70">{site.name}</p>
      </div>
    </div>
  );
}
