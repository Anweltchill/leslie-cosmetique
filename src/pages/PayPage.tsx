import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { site } from '@/data/site';
import { useNoIndex, useSeo } from '@/lib/seo';
import { Link } from '@/lib/router';
import { startCheckout } from '@/lib/checkout';
import { Shell } from '@/components/ResultShell';

const btn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-espresso px-6 py-3 text-[14px] font-medium text-white-warm transition-colors hover:bg-brown';

const ERRORS: Record<string, string> = {
  deja_regle: 'Cette séance est déjà réglée : rien d’autre à faire. Leslie vous confirme le rendez-vous par e-mail.',
  reservation_introuvable: 'Ce rendez-vous n’existe plus ou a été annulé. Vous pouvez réserver un nouveau créneau.',
  reservation_passee: 'La date de ce rendez-vous est passée. Vous pouvez réserver un nouveau créneau.',
};

/** Lien « Payer par carte » des e-mails : ouvre directement le paiement Stripe de la séance réservée. */
export function PayPage() {
  const bookingId = new URLSearchParams(window.location.search).get('r') ?? '';
  const valid = /^[0-9a-f-]{36}$/i.test(bookingId);
  const [error, setError] = useState(valid ? '' : 'reservation_introuvable');

  useSeo({ title: 'Paiement de votre séance', description: 'Paiement sécurisé de votre séance.', path: '/payer' });
  useNoIndex();

  useEffect(() => {
    if (!valid) return;
    startCheckout({ booking_id: bookingId, cancel_path: '/' }).catch((e: Error) => setError(e.message || 'checkout'));
  }, [bookingId, valid]);

  if (!error) {
    return (
      <Shell>
        <Loader2 size={30} className="mx-auto animate-spin text-caramel" aria-hidden />
        <h1 className="mt-5 font-serif-lc text-[28px] text-espresso">Paiement sécurisé</h1>
        <p className="mt-2 text-[14.5px] text-brown">Ouverture de la page de paiement Stripe…</p>
      </Shell>
    );
  }

  const done = error === 'deja_regle';
  return (
    <Shell>
      <AlertCircle size={30} className={`mx-auto ${done ? 'text-[#3f6b3a]' : 'text-caramel'}`} aria-hidden />
      <h1 className="mt-5 font-serif-lc text-[28px] text-espresso">{done ? 'Séance déjà réglée' : 'Paiement indisponible'}</h1>
      <p className="mx-auto mt-2 max-w-[440px] text-[14.5px] leading-relaxed text-brown">
        {ERRORS[error] ?? 'Le paiement n’a pas pu s’ouvrir. Réessayez dans un instant, ou écrivez à Leslie.'}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {done ? (
          <Link to="/" className={btn}>Retour à l’accueil</Link>
        ) : ERRORS[error] ? (
          <Link to="/reserver" className={btn}>Réserver un créneau</Link>
        ) : (
          <button type="button" onClick={() => window.location.reload()} className={btn}>Réessayer</button>
        )}
      </div>
      <p className="mt-6 text-[13px] text-brown">
        Une question ? <a href={`mailto:${site.email}`} className="link-line text-espresso">{site.email}</a>
      </p>
    </Shell>
  );
}
