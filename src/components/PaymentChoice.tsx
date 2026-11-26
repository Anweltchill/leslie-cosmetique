import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Loader2, Lock, MessageCircle, Smartphone, X } from 'lucide-react';
import { site } from '@/data/site';
import { formatPrice } from '@/data/offers';
import { track } from '@/lib/track';
import { mobileMoneyEnabled, startCheckout, type CheckoutInput } from '@/lib/checkout';

/** 1 € = 655,957 FCFA (parité fixe, zones UEMOA et CEMAC). */
const toFcfa = (eur: number) => Math.round(eur * 655.957).toLocaleString('fr-FR');

interface Props {
  open: boolean;
  onClose: () => void;
  offerName: string;
  price: number;
  checkout: CheckoutInput & { offer_slug: string };
  /** Précision ajoutée au message WhatsApp (ex. date du rendez-vous réservé). */
  detail?: string;
}

/** Fenêtre « Comment souhaitez-vous payer ? » : carte bancaire (Stripe) ou Mobile Money (WhatsApp). */
export function PaymentChoice({ open, onClose, offerName, price, checkout, detail }: Props) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(false);
  const firstBtn = useRef<HTMLButtonElement>(null);
  const mobile = mobileMoneyEnabled();

  useEffect(() => {
    if (!open) return;
    setError(false);
    firstBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !paying && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, paying, onClose]);

  // Étape du tunnel : fenêtre de paiement ouverte.
  const offerSlug = checkout.offer_slug;
  useEffect(() => {
    if (open) track('pay_choice_open', { offer: offerSlug });
  }, [open, offerSlug]);

  // Retour arrière depuis la page Stripe (page restaurée du cache) : on réactive le bouton.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPaying(false);
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  if (!open) return null;

  const payByCard = async () => {
    track('pay_method_card', { offer: checkout.offer_slug });
    setError(false);
    setPaying(true);
    try {
      await startCheckout(checkout);
    } catch {
      setPaying(false);
      setError(true);
    }
  };

  const whatsappUrl = () => {
    const lines = [
      `Salut, je suis intéressé(e) par l’offre « ${offerName} » (${formatPrice(price)}, soit ${toFcfa(price)} FCFA) et je ne peux pas payer par carte.`,
      detail ?? '',
    ].filter(Boolean);
    return `https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  // Rendue directement dans <body> : la page peut être animée (transform), ce qui décalerait une fenêtre « fixed ».
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Choisir le moyen de paiement">
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-espresso/55 backdrop-blur-[2px]" onClick={() => !paying && onClose()} />
      <div
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] bg-cream shadow-[0_30px_80px_-30px_rgba(58,42,34,0.7)] sm:max-w-[520px] sm:rounded-[24px]"
        data-lenis-prevent
      >
        <div className="flex items-start justify-between gap-4 bg-espresso px-6 py-5 text-white-warm">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sand">Paiement</p>
            <p className="mt-1 font-serif-lc text-[23px] leading-tight">Comment souhaitez-vous payer&nbsp;?</p>
            <p className="mt-1.5 text-[13px] text-sand">
              {offerName} — <span className="font-medium text-white-warm">{formatPrice(price)}</span>
              {mobile && <span className="text-sand/80"> · {toFcfa(price)} FCFA</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={paying}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sand transition-colors hover:bg-white-warm/10 hover:text-white-warm"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {/* Carte bancaire */}
          <section className="rounded-[18px] border border-sand bg-white-warm p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-nude text-caramel">
                <CreditCard size={20} strokeWidth={1.7} aria-hidden />
              </span>
              <div>
                <h3 className="font-serif-lc text-[20px] leading-tight text-espresso">Carte bancaire</h3>
                <p className="text-[12.5px] text-brown">Visa, Mastercard, CB… — paiement sécurisé par Stripe</p>
              </div>
            </div>
            <button
              ref={firstBtn}
              type="button"
              onClick={payByCard}
              disabled={paying}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-espresso px-5 py-3.5 text-[14.5px] font-medium text-white-warm transition-colors hover:bg-brown disabled:cursor-wait disabled:opacity-75"
            >
              {paying ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Lock size={15} strokeWidth={1.8} aria-hidden />}
              {paying ? 'Redirection vers le paiement…' : `Payer ${formatPrice(price)} par carte`}
            </button>
            {error && (
              <p className="mt-2.5 text-center text-[12.5px] text-[#9b3b2a]" role="alert">
                Le paiement n’a pas pu démarrer. Vérifiez votre connexion puis réessayez.
              </p>
            )}
          </section>

          {/* Mobile Money */}
          {mobile && (
            <section className="rounded-[18px] border border-sand bg-white-warm p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-nude text-caramel">
                  <Smartphone size={20} strokeWidth={1.7} aria-hidden />
                </span>
                <div>
                  <h3 className="font-serif-lc text-[20px] leading-tight text-espresso">Mobile Money</h3>
                  <p className="text-[12.5px] text-brown">Payez avec votre numéro de téléphone</p>
                </div>
              </div>
              <p className="mt-4 text-[12px] font-medium uppercase tracking-[0.14em] text-brown">Opérateurs acceptés</p>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Opérateurs Mobile Money acceptés">
                {site.mobileMoney.map((op) => (
                  <li key={op} className="rounded-full border border-sand bg-cream px-3 py-1.5 text-[12.5px] font-medium text-espresso">
                    {op}
                  </li>
                ))}
              </ul>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('pay_method_mobile', { offer: checkout.offer_slug })}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#1f8f4e] px-5 py-3.5 text-[14.5px] font-medium text-white transition-colors hover:bg-[#187a42]"
              >
                <MessageCircle size={17} strokeWidth={1.8} aria-hidden />
                Continuer sur WhatsApp
              </a>
              <p className="mt-2.5 text-center text-[12px] leading-snug text-brown">
                Un message est préparé pour Leslie sur WhatsApp : elle vous explique ensuite comment payer avec votre opérateur.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
