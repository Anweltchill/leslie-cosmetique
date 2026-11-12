import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { site } from '@/data/site';
import { MagneticButton } from './MagneticButton';
import { track } from '@/lib/track';

export function UrgencyPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!site.urgency.active) return;
    if (sessionStorage.getItem('lc-urgency') === '1') return;
    const t = setTimeout(() => {
      setVisible(true);
      track('urgency_popup_view');
    }, 9000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const close = () => {
    sessionStorage.setItem('lc-urgency', '1');
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-5 left-5 right-5 z-[70] mx-auto max-w-[420px] rounded-[24px] border border-sand bg-white-warm p-6 shadow-[0_30px_60px_-25px_rgba(58,42,34,0.45)] md:left-auto md:right-8"
      role="dialog"
      aria-label="Information sur les places disponibles"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Fermer le message"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brown transition-colors hover:bg-nude"
      >
        <X size={16} strokeWidth={1.8} />
      </button>
      <div className="flex items-center gap-2 text-brown">
        <Sparkles size={16} strokeWidth={1.8} aria-hidden />
        <span className="text-[11px] font-medium uppercase tracking-[0.18em]">Information</span>
      </div>
      <p className="mt-3 font-serif-lc text-[24px] leading-snug text-espresso">{site.urgency.title}</p>
      <p className="mt-2 text-[14px] text-brown">
        Date de la session : <strong className="font-medium text-espresso">{site.urgency.sessionDate}</strong>
      </p>
      <MagneticButton to="/reserver" trackName="urgency_cta" className="mt-5 w-full !py-3 text-[14px]" onClick={close}>
        Réserver ma place
      </MagneticButton>
    </div>
  );
}
