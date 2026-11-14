import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { site } from '@/data/site';
import { liveTraining, offerPath } from '@/data/offers';
import { enrollmentState } from '@/lib/enrollment';
import { useRouter } from '@/lib/router';
import { MagneticButton } from './MagneticButton';
import { CountdownPanel } from './Countdown';
import { track } from '@/lib/track';

/**
 * Pop-up d'information sur la formation en direct (dates réelles de l'offre).
 * Une fois par visite, jamais sur la page de la formation elle-même, et plus du tout après la clôture des inscriptions.
 */
export function UrgencyPopup() {
  const [visible, setVisible] = useState(false);
  const { path } = useRouter();
  const offer = liveTraining;
  const offerUrl = offer ? offerPath(offer) : '';

  useEffect(() => {
    if (!site.urgency.active || !offer?.enrollment) return;
    if (!enrollmentState(offer.enrollment).open) return;
    if (path === offerUrl) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem('lc-urgency') === '1';
    } catch {
      /* stockage indisponible */
    }
    if (seen) return;
    const t = setTimeout(() => {
      setVisible(true);
      track('urgency_popup_view', { offer: offer.slug });
    }, 9000);
    return () => clearTimeout(t);
  }, [offer, offerUrl, path]);

  useEffect(() => {
    if (path === offerUrl) setVisible(false);
  }, [path, offerUrl]);

  if (!visible || !offer?.enrollment) return null;

  const close = () => {
    try {
      sessionStorage.setItem('lc-urgency', '1');
    } catch {
      /* stockage indisponible */
    }
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-5 left-5 right-5 z-[70] mx-auto max-w-[420px] rounded-[24px] border border-sand bg-white-warm p-6 shadow-[0_30px_60px_-25px_rgba(58,42,34,0.45)] md:left-auto md:right-8"
      role="dialog"
      aria-label="Information sur la formation en direct"
    >
      <button
        type="button"
        onClick={() => {
          track('urgency_popup_close', { offer: offer.slug });
          close();
        }}
        aria-label="Fermer le message"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brown transition-colors hover:bg-nude"
      >
        <X size={16} strokeWidth={1.8} />
      </button>
      <div className="flex items-center gap-2 text-brown">
        <Sparkles size={16} strokeWidth={1.8} aria-hidden />
        <span className="text-[11px] font-medium uppercase tracking-[0.18em]">Formation en direct</span>
      </div>
      <p className="mt-3 pr-6 font-serif-lc text-[24px] leading-snug text-espresso">{offer.name}</p>
      <div className="mt-3">
        <CountdownPanel offer={offer} where="urgency_popup" compact />
      </div>
      <MagneticButton to={offerUrl} trackName="urgency_cta" className="mt-5 w-full !py-3 text-[14px]" onClick={close}>
        Découvrir la formation
      </MagneticButton>
    </div>
  );
}
