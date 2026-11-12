type TrackProps = Record<string, string | number | boolean | undefined>;

/**
 * Point d'entrée unique pour le suivi d'événements.
 * Branchable plus tard à GA4 / Plausible / PostHog en complétant ce corps.
 */
export function track(event: string, props?: TrackProps) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    console.debug('[track]', event, props ?? {});
  }
  (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event, ...props });
}

export function initScrollDepthTracking() {
  if (typeof window === 'undefined') return () => {};
  const marks = [25, 50, 75, 100];
  const fired = new Set<number>();
  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const pct = Math.round((window.scrollY / max) * 100);
    for (const m of marks) {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        track('scroll_depth', { percent: m, path: window.location.pathname });
      }
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}
