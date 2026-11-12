import { useRef, type ReactNode, type MouseEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/router';
import { track } from '@/lib/track';

interface Props {
  children: ReactNode;
  to?: string;
  href?: string;
  variant?: 'primary' | 'outline' | 'cream' | 'light';
  className?: string;
  trackName?: string;
  withArrow?: boolean;
  onClick?: () => void;
}

export function MagneticButton({
  children,
  to,
  href,
  variant = 'primary',
  className = '',
  trackName,
  withArrow = true,
  onClick,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  const base =
    'group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium tracking-wide transition-all duration-300 will-change-transform';
  const variants = {
    primary: 'bg-espresso text-white-warm hover:bg-brown shadow-[0_10px_30px_-12px_rgba(58,42,34,0.5)]',
    outline: 'border border-sand bg-transparent text-espresso hover:border-caramel hover:bg-white-warm',
    cream: 'bg-cream text-espresso hover:bg-white-warm shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]',
    light: 'border border-white-warm/60 bg-white-warm/10 text-white-warm backdrop-blur-sm hover:bg-white-warm hover:text-espresso',
  };
  const cls = `${base} ${variants[variant]} ${className}`;

  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia('(pointer: coarse)').matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  const fire = () => {
    if (trackName) track('cta_click', { name: trackName });
    onClick?.();
  };

  const inner = (
    <>
      <span>{children}</span>
      {withArrow && (
        <ArrowRight
          size={16}
          strokeWidth={1.8}
          className="transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} trackName={trackName}>
        <span
          ref={(n) => { ref.current = n; }}
          className="contents"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          onClick={fire}
        >
          {inner}
        </span>
      </Link>
    );
  }
  return (
    <a
      ref={(n) => { ref.current = n; }}
      href={href ?? '#'}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      className={cls}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={fire}
      data-track={trackName}
    >
      {inner}
    </a>
  );
}
