import { useEffect, useState } from 'react';
import { AlertCircle, CalendarCheck2, Check, Download, Loader2, RotateCcw } from 'lucide-react';
import { getOffer, formatPrice } from '@/data/offers';
import { site } from '@/data/site';
import { useSeo } from '@/lib/seo';
import { Link } from '@/lib/router';
import { track } from '@/lib/track';
import { fetchCheckoutStatus, lastCheckout, startCheckout, type CheckoutStatus } from '@/lib/checkout';

const longFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

const btn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-espresso px-6 py-3 text-[14px] font-medium text-white-warm transition-colors hover:bg-brown disabled:cursor-wait disabled:opacity-75';
const btnGhost =
  'inline-flex items-center justify-center rounded-full border border-sand px-6 py-3 text-[14px] font-medium text-espresso transition-colors hover:bg-nude';

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

/** Page de retour après le paiement Stripe (succès ou abandon). */
export function MerciPage() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id') ?? '';
  const cancelled = params.get('annule') === '1';
  const cancelledSlug = params.get('offre') ?? '';
  const backPath = (params.get('retour') ?? '').startsWith('/') ? params.get('retour')! : '/';

  useSeo({ title: cancelled ? 'Paiement non finalisé' : 'Merci', description: 'Confirmation de votre commande.', path: '/merci' });
  useNoIndex();

  if (cancelled) return <Cancelled slug={cancelledSlug} backPath={backPath} />;
  if (sessionId) return <Success sessionId={sessionId} />;
  return (
    <Shell>
      <h1 className="font-serif-lc text-[30px] text-espresso">Aucune commande en cours</h1>
      <div className="mt-6">
        <Link to="/" className={btn}>Retour à l’accueil</Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream pb-20 pt-32 md:pt-40">
      <div className="mx-auto max-w-[640px] px-5">
        <div className="rounded-[24px] border border-sand/70 bg-white-warm px-6 py-10 text-center shadow-[0_24px_50px_-36px_rgba(107,74,56,0.45)] md:px-10 md:py-12">
          {children}
        </div>
      </div>
    </div>
  );
}

function Success({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<CheckoutStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const load = () => {
      fetchCheckoutStatus(sessionId)
        .then((d) => {
          if (cancelled) return;
          setData(d);
          // Paiement encore en cours de validation : on revérifie quelques fois.
          if (d.status !== 'paid' && tries++ < 4) window.setTimeout(load, 3000);
        })
        .catch(() => !cancelled && setError(true));
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (data?.status !== 'paid') return;
    const key = `lc-purchase-${sessionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
    track('purchase', { offer: data.offer_slug, value: data.amount_cents / 100, currency: 'EUR' });
  }, [data, sessionId]);

  if (error) {
    return (
      <Shell>
        <AlertCircle size={34} className="mx-auto text-caramel" aria-hidden />
        <h1 className="mt-4 font-serif-lc text-[28px] text-espresso">Vérification impossible pour le moment</h1>
        <p className="mx-auto mt-3 max-w-[440px] text-[14.5px] leading-relaxed text-brown">
          Nous n’avons pas pu vérifier votre paiement. Rechargez la page dans quelques instants. Si vous avez été débitée, écrivez à{' '}
          <a href={`mailto:${site.email}`} className="link-line text-espresso">{site.email}</a> : nous vous répondons rapidement.
        </p>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <Loader2 size={28} className="mx-auto animate-spin text-caramel" aria-label="Chargement" />
        <p className="mt-4 text-[14.5px] text-brown">Vérification de votre paiement…</p>
      </Shell>
    );
  }

  const offer = getOffer(data.offer_slug);
  const paid = data.status === 'paid';

  if (!paid) {
    return (
      <Shell>
        <Loader2 size={28} className="mx-auto animate-spin text-caramel" aria-hidden />
        <h1 className="mt-4 font-serif-lc text-[28px] text-espresso">Paiement en cours de validation</h1>
        <p className="mx-auto mt-3 max-w-[440px] text-[14.5px] leading-relaxed text-brown">
          Votre paiement est en cours de traitement par votre banque. Vous recevrez un e-mail de confirmation dès qu’il sera validé.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e3ecdf] text-[#3f6b3a]">
        <Check size={26} strokeWidth={2} aria-hidden />
      </span>
      <p className="label-lc mt-5">Paiement confirmé</p>
      <h1 className="mt-2 font-serif-lc text-[30px] leading-tight text-espresso md:text-[34px]">
        Merci{data.name ? ` ${data.name.split(' ')[0]}` : ''} !
      </h1>
      <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-relaxed text-brown">
        {offer?.name ?? data.offer_name} — <span className="text-espresso">{formatPrice(data.amount_cents / 100)}</span>
      </p>

      {data.kind === 'guide' ? (
        <>
          {data.download_url ? (
            <div className="mt-7">
              <a href={data.download_url} className={btn} onClick={() => track('guide_download', { offer: data.offer_slug })}>
                <Download size={16} strokeWidth={1.8} aria-hidden /> Télécharger mon guide (PDF)
              </a>
            </div>
          ) : (
            <p className="mx-auto mt-6 max-w-[440px] text-[14px] text-espresso">Votre guide vous est envoyé par e-mail très rapidement.</p>
          )}
          <p className="mx-auto mt-5 max-w-[460px] text-[13px] leading-relaxed text-brown">
            Enregistrez le guide sur votre téléphone ou votre ordinateur : ce lien de téléchargement reste valable 7 jours.
            {data.email ? ` Votre reçu a été envoyé à ${data.email}.` : ''}
          </p>
        </>
      ) : (
        <>
          {data.booking_starts_at && (
            <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-nude px-4 py-2 text-[14px] text-espresso">
              <CalendarCheck2 size={16} className="text-caramel" aria-hidden />
              <span className="first-letter:uppercase">{longFmt.format(new Date(data.booking_starts_at))}</span>
            </p>
          )}
          <p className="mx-auto mt-5 max-w-[460px] text-[14.5px] leading-relaxed text-brown">
            Votre séance est réglée. Leslie vous confirme le rendez-vous par e-mail{data.email ? ` à ${data.email}` : ''} avec le lien visio.
          </p>
        </>
      )}

      <div className="mt-8">
        <Link to="/" className={btnGhost}>Retour à l’accueil</Link>
      </div>
      <p className="mt-6 text-[12.5px] text-brown">
        Une question ? Écrivez à <a href={`mailto:${site.email}`} className="link-line text-espresso">{site.email}</a>
      </p>
    </Shell>
  );
}

function Cancelled({ slug, backPath }: { slug: string; backPath: string }) {
  const offer = getOffer(slug);
  const last = lastCheckout();
  const canRetry = Boolean(last && last.offer_slug === slug);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const isCoaching = offer?.kind === 'coaching';

  const retry = async () => {
    if (!last) return;
    setBusy(true);
    setFailed(false);
    try {
      await startCheckout(last);
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  return (
    <Shell>
      <AlertCircle size={34} className="mx-auto text-caramel" aria-hidden />
      <h1 className="mt-4 font-serif-lc text-[30px] leading-tight text-espresso">Paiement non finalisé</h1>
      <p className="mx-auto mt-3 max-w-[460px] text-[14.5px] leading-relaxed text-brown">
        Aucun montant n’a été débité.
        {isCoaching && canRetry && last?.booking_starts_at
          ? ' Votre créneau reste bloqué : vous pouvez reprendre le paiement maintenant.'
          : offer
            ? ` Vous pouvez reprendre votre commande « ${offer.shortName} » quand vous le souhaitez.`
            : ''}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {canRetry && (
          <button type="button" onClick={retry} disabled={busy} className={btn}>
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <RotateCcw size={16} strokeWidth={1.8} aria-hidden />}
            Reprendre le paiement
          </button>
        )}
        <Link to={canRetry ? '/' : backPath} className={btnGhost}>
          {canRetry ? 'Retour à l’accueil' : 'Retour'}
        </Link>
      </div>
      {failed && <p className="mt-4 text-[12.5px] text-[#9b3b2a]" role="alert">Le paiement n’a pas pu démarrer. Réessayez dans un instant.</p>}
    </Shell>
  );
}
