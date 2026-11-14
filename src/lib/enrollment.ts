import { useEffect, useState } from 'react';
import type { Enrollment } from '@/data/offers';
import { track } from './track';

export interface EnrollmentState {
  open: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function enrollmentState(e: Enrollment, now = Date.now()): EnrollmentState {
  const ms = Math.max(0, new Date(e.closesAt).getTime() - now);
  return {
    open: ms > 0,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}

/** État des inscriptions, mis à jour chaque seconde jusqu'à la clôture. */
export function useEnrollment(e?: Enrollment): EnrollmentState | null {
  const [state, setState] = useState(() => (e ? enrollmentState(e) : null));

  useEffect(() => {
    if (!e) return;
    setState(enrollmentState(e));
    const id = window.setInterval(() => {
      const next = enrollmentState(e);
      setState(next);
      if (!next.open) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [e]);

  return state;
}

const fired = new Set<string>();

/**
 * Suivi : « countdown_view » quand un compte à rebours s'affiche,
 * « enrollment_closed » quand l'état « Inscriptions closes » s'affiche (une fois par emplacement et par visite).
 */
export function useEnrollmentTracking(state: EnrollmentState | null, where: string, slug?: string) {
  const open = state?.open;
  useEffect(() => {
    if (open === undefined) return;
    const event = open ? 'countdown_view' : 'enrollment_closed';
    const key = `${event}:${where}`;
    if (fired.has(key)) return;
    fired.add(key);
    track(event, { where, offer: slug });
  }, [open, where, slug]);
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
