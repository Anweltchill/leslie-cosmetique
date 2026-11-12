import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from '@/lib/anim';

interface Props {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'span' | 'p' | 'h2' | 'h3' | 'li';
}

/** Apparition en fondu + montée, pilotée par le scroll. */
export function Reveal({ children, delay = 0, y = 34, className = '', as = 'div' }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      );
    });
    return () => ctx.revert();
  }, [delay, y]);

  const Tag = as as 'div';
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}

interface MaskRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Révélation de titre ligne par ligne depuis un masque. */
export function MaskLines({ children, className = '', delay = 0 }: MaskRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lines = el.querySelectorAll('.mask-line-inner');
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lines,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.1,
          delay,
          ease: 'power4.out',
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      );
    });
    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function MaskLine({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <span className={`mask-line-inner block will-change-transform ${className}`}>{children}</span>
    </span>
  );
}
