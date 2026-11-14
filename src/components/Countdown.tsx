import { CalendarDays, Hourglass } from 'lucide-react';
import type { Offer } from '@/data/offers';
import { pad2, useEnrollment, useEnrollmentTracking, type EnrollmentState } from '@/lib/enrollment';

type Tone = 'light' | 'dark';

const shortLeft = (s: EnrollmentState) =>
  s.days > 0 ? `J-${s.days}` : `plus que ${pad2(s.hours)} h ${pad2(s.minutes)} min`;

/** Ligne discrète pour les cartes et listes : « Fin des inscriptions : 23 décembre · J-39 ». */
export function CountdownLine({ offer, where, tone = 'light', className = '' }: { offer: Offer; where: string; tone?: Tone; className?: string }) {
  const state = useEnrollment(offer.enrollment);
  useEnrollmentTracking(state, where, offer.slug);
  if (!offer.enrollment || !state) return null;

  const muted = tone === 'dark' ? 'text-sand' : 'text-brown';
  const strong = tone === 'dark' ? 'text-white-warm' : 'text-espresso';

  if (!state.open) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${strong} ${className}`} data-track={`enrollment_closed_${where}`} data-countdown-state="closed">
        <Hourglass size={12} strokeWidth={1.8} className="text-caramel" aria-hidden />
        Inscriptions closes
      </span>
    );
  }
  return (
    <span className={`inline-flex items-start gap-1.5 text-[12px] leading-snug ${muted} ${className}`} data-track={`countdown_${where}`} data-countdown-state="open">
      <Hourglass size={12} strokeWidth={1.8} className="mt-[2px] shrink-0 text-caramel" aria-hidden />
      <span>
        Fin des inscriptions : <span className={`whitespace-nowrap font-medium ${strong}`}>{offer.enrollment.closesLabel}</span>{' '}
        <span className="whitespace-nowrap">
          <span aria-hidden>·</span> <span className={`font-medium tabular-nums ${strong}`}>{shortLeft(state)}</span>
        </span>
      </span>
    </span>
  );
}

/** Bloc compte à rebours (page détail, bandeau, pop-up). */
export function CountdownPanel({ offer, where, tone = 'light', compact = false }: { offer: Offer; where: string; tone?: Tone; compact?: boolean }) {
  const state = useEnrollment(offer.enrollment);
  useEnrollmentTracking(state, where, offer.slug);
  if (!offer.enrollment || !state) return null;
  const e = offer.enrollment;

  const dark = tone === 'dark';
  const muted = dark ? 'text-sand' : 'text-brown';
  const strong = dark ? 'text-white-warm' : 'text-espresso';
  const box = dark ? 'bg-white-warm/10 text-white-warm' : 'bg-white-warm text-espresso border border-sand/70';

  const units = [
    { v: state.days, l: state.days > 1 ? 'jours' : 'jour' },
    { v: state.hours, l: 'h' },
    { v: state.minutes, l: 'min' },
    { v: state.seconds, l: 's' },
  ];

  return (
    <div data-track={state.open ? `countdown_${where}` : `enrollment_closed_${where}`} data-countdown-state={state.open ? 'open' : 'closed'}>
      <p className={`flex items-center gap-1.5 text-[12.5px] ${muted}`}>
        <Hourglass size={13} strokeWidth={1.8} className="text-caramel" aria-hidden />
        {state.open ? (
          <span>Fin des inscriptions : <span className={`font-medium ${strong}`}>{e.closesLabel}</span></span>
        ) : (
          <span className={`font-medium ${strong}`}>Inscriptions closes</span>
        )}
      </p>
      {state.open && (
        <div className={`mt-2 flex gap-1.5 ${compact ? '' : 'sm:gap-2'}`} role="timer" aria-label={`Fin des inscriptions dans ${state.days} jours, ${state.hours} heures et ${state.minutes} minutes`}>
          {units.map((u) => (
            <span key={u.l} className={`flex min-w-[52px] flex-col items-center rounded-[12px] px-2 py-1.5 ${box} ${compact ? '' : 'sm:min-w-[58px]'}`}>
              <span className="font-serif-lc text-[20px] font-medium leading-none tabular-nums">{pad2(u.v)}</span>
              <span className={`mt-1 text-[10px] uppercase tracking-[0.12em] ${muted}`}>{u.l}</span>
            </span>
          ))}
        </div>
      )}
      <p className={`mt-2 flex items-center gap-1.5 text-[12.5px] ${muted}`}>
        <CalendarDays size={13} strokeWidth={1.8} className="text-caramel" aria-hidden />
        <span>Formation les <span className={`font-medium ${strong}`}>{e.datesLabel}</span></span>
      </p>
    </div>
  );
}
