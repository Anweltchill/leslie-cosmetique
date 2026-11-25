import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarCheck2, Check, Clock3, CreditCard, Loader2, Video } from 'lucide-react';
import { coachings, formatPrice, getVisibleOffer, offerPath, usesCalendar, bookingHref, type Offer } from '@/data/offers';
import { useSeo } from '@/lib/seo';
import { Link, useRouter } from '@/lib/router';
import { track } from '@/lib/track';
import { createBooking, fetchTakenSlots } from '@/lib/booking';
import { paysOnline, startCheckout } from '@/lib/checkout';
import { WasPrice } from '@/components/Promo';
import { BookingCalendar, timeFmt } from '@/components/booking/BookingCalendar';

const longFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const STEPS = ['Coaching', 'Date et heure', 'Coordonnées'];

const inputCls =
  'mt-1.5 w-full rounded-[12px] border border-sand bg-white-warm px-4 py-3 text-[14.5px] text-espresso placeholder:text-brown/50 transition-colors focus:border-caramel focus:outline-none';

export function BookingPage({ slug }: { slug?: string }) {
  const initial = slug ? getVisibleOffer(slug) : undefined;
  const { navigate } = useRouter();
  const [offer, setOffer] = useState<Offer | undefined>(initial && usesCalendar(initial) ? initial : undefined);
  const [step, setStep] = useState(offer ? 1 : 0);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [day, setDay] = useState<Date | null>(null);
  const [slot, setSlot] = useState<Date | null>(null);
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [done, setDone] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(false);

  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPaying(false);
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const pay = async () => {
    if (!offer || !slot) return;
    track('booking_pay_click', { offer: offer.slug });
    setPayError(false);
    setPaying(true);
    try {
      await startCheckout({
        offer_slug: offer.slug,
        email: form.email.trim(),
        name: form.fullName.trim(),
        booking_starts_at: slot.toISOString(),
        cancel_path: '/reserver',
      });
    } catch {
      setPaying(false);
      setPayError(true);
    }
  };

  // Coaching réservé hors calendrier (audit) : redirection vers son lien ou sa page.
  useEffect(() => {
    if (initial && initial.kind === 'coaching' && !usesCalendar(initial) && bookingHref(initial).startsWith('/')) {
      navigate(bookingHref(initial), { replace: true });
    }
  }, [initial, navigate]);

  useSeo({
    title: 'Réserver un appel',
    description: 'Choisissez votre coaching, votre date et votre heure : réservez votre appel visio d’une heure avec Leslie Djoman.',
    path: '/reserver',
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 2);
    fetchTakenSlots(from, to)
      .then((s) => { if (!cancelled) setTaken(s); })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [month]);

  const chooseOffer = (o: Offer) => {
    setOffer(o);
    setStep(1);
    track('booking_offer_select', { offer: o.slug });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!offer || !slot) return;
    setSending(true);
    setSendError('');
    const res = await createBooking({ offerSlug: offer.slug, startsAt: slot, ...form });
    setSending(false);
    if (res.ok) {
      setDone(true);
      track('booking_submit', { offer: offer.slug });
      return;
    }
    if (res.reason === 'taken') {
      setTaken((t) => new Set(t).add(slot.getTime()));
      setSlot(null);
      setStep(1);
      setSendError('Ce créneau vient d’être réservé. Choisissez-en un autre.');
    } else {
      setSendError('L’envoi n’a pas abouti. Vérifiez vos informations puis réessayez.');
    }
  };

  return (
    <div className="bg-cream pb-16 pt-32 md:pb-20 md:pt-36">
      <div className="mx-auto max-w-[1120px] px-5 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-lc">Réservation</p>
            <h1 className="mt-3 font-serif-lc text-[32px] leading-[1.1] text-espresso md:text-[40px]">
              Réservez votre appel <span className="italic text-brown">en 3 étapes</span>
            </h1>
          </div>
          {!done && (
            <ol className="flex flex-wrap gap-2" aria-label="Étapes">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                    i === step ? 'bg-espresso text-white-warm' : i < step ? 'bg-nude text-espresso' : 'border border-sand text-brown'
                  }`}
                  aria-current={i === step ? 'step' : undefined}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white-warm/20 text-[11px]">
                    {i < step ? <Check size={11} strokeWidth={2.5} /> : i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[290px_1fr]">
          <aside className="order-2 lg:order-1">
            <div className="rounded-[20px] border border-sand/70 bg-white-warm p-5 lg:sticky lg:top-24">
              <p className="text-[11.5px] font-medium uppercase tracking-[0.16em] text-brown">Votre rendez-vous</p>
              {offer ? (
                <>
                  <div className="mt-4 flex items-center gap-3">
                    <img src={offer.image} alt="" className="h-14 w-14 rounded-[12px] object-cover" />
                    <div>
                      <p className="font-serif-lc text-[19px] leading-tight text-espresso">{offer.name}</p>
                      <p className="text-[13px] font-medium text-caramel">
                        {formatPrice(offer.price)} <WasPrice price={offer.price} className="ml-1 font-normal text-brown" />
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 border-t border-sand/60 pt-4 text-[13.5px] text-espresso">
                    <li className="flex items-center gap-2.5"><Clock3 size={15} className="text-caramel" aria-hidden /> {offer.duration} en tête à tête</li>
                    <li className="flex items-center gap-2.5"><Video size={15} className="text-caramel" aria-hidden /> En visio, lien envoyé par e-mail</li>
                    <li className="flex items-center gap-2.5">
                      <CalendarCheck2 size={15} className="text-caramel" aria-hidden />
                      {slot ? <span className="first-letter:uppercase">{longFmt.format(slot)} à {timeFmt.format(slot)}</span> : 'Date à choisir'}
                    </li>
                  </ul>
                  {!done && step > 0 && (
                    <button type="button" onClick={() => setStep(0)} className="link-line mt-4 text-[13px] font-medium text-brown hover:text-espresso">
                      Changer de coaching
                    </button>
                  )}
                </>
              ) : (
                <p className="mt-3 text-[14px] leading-relaxed text-brown">Choisissez d’abord le coaching qui correspond à votre besoin.</p>
              )}
            </div>
          </aside>

          <section className="order-1 rounded-[20px] border border-sand/70 bg-white-warm p-5 shadow-[0_24px_50px_-36px_rgba(107,74,56,0.45)] md:p-7 lg:order-2" aria-live="polite">
            {done && offer && slot ? (
              <div className="py-6 text-center md:py-10">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e3ecdf] text-[#3f6b3a]">
                  <Check size={26} strokeWidth={2} aria-hidden />
                </span>
                <h2 className="mt-5 font-serif-lc text-[28px] text-espresso">Demande envoyée</h2>
                <p className="mx-auto mt-2 max-w-[460px] text-[14.5px] leading-relaxed text-brown">
                  Votre créneau du <strong className="font-medium text-espresso">{longFmt.format(slot)} à {timeFmt.format(slot)}</strong> est bloqué.
                  {paysOnline(offer.slug) ? ' Réglez votre séance en ligne pour finaliser votre réservation. ' : ' '}
                  Leslie vous confirme le rendez-vous par e-mail à {form.email} avec le lien visio.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  {paysOnline(offer.slug) ? (
                    <button
                      type="button"
                      onClick={pay}
                      disabled={paying}
                      className="inline-flex items-center gap-2 rounded-full bg-espresso px-6 py-3 text-[14px] font-medium text-white-warm transition-colors hover:bg-brown disabled:cursor-wait disabled:opacity-75"
                    >
                      {paying ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <CreditCard size={16} strokeWidth={1.8} aria-hidden />}
                      {paying ? 'Redirection vers le paiement…' : `Régler ma séance (${formatPrice(offer.price)})`}
                    </button>
                  ) : (
                    <a
                      href={offer.link}
                      target={offer.link.startsWith('http') ? '_blank' : undefined}
                      rel={offer.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                      onClick={() => track('booking_pay_click', { offer: offer.slug })}
                      className="inline-flex items-center gap-2 rounded-full bg-espresso px-6 py-3 text-[14px] font-medium text-white-warm transition-colors hover:bg-brown"
                    >
                      Régler ma séance ({formatPrice(offer.price)})
                    </a>
                  )}
                  <Link to="/" className="inline-flex items-center rounded-full border border-sand px-6 py-3 text-[14px] font-medium text-espresso transition-colors hover:bg-nude">
                    Retour à l’accueil
                  </Link>
                </div>
                {paysOnline(offer.slug) && (
                  <p className={`mt-4 text-[12.5px] ${payError ? 'text-[#9b3b2a]' : 'text-brown'}`} role={payError ? 'alert' : undefined}>
                    {payError
                      ? 'Le paiement n’a pas pu démarrer. Vérifiez votre connexion puis réessayez.'
                      : 'Paiement sécurisé par carte bancaire (Stripe).'}
                  </p>
                )}
              </div>
            ) : step === 0 ? (
              <>
                <h2 className="font-serif-lc text-[24px] text-espresso">De quoi avez-vous besoin ?</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {coachings.map((o) => !usesCalendar(o) ? (
                    <a
                      key={o.slug}
                      href={bookingHref(o)}
                      target={bookingHref(o).startsWith('http') ? '_blank' : undefined}
                      rel={bookingHref(o).startsWith('http') ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        track('audit_book_click', { offer: o.slug, where: 'booking_page' });
                        const href = bookingHref(o);
                        if (href.startsWith('/')) {
                          e.preventDefault();
                          navigate(href);
                        }
                      }}
                      data-track={`audit_book_booking_page`}
                      className="group overflow-hidden rounded-[16px] border border-sand/70 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <img src={o.image} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="p-4">
                        <p className="font-serif-lc text-[19px] leading-tight text-espresso">{o.name}</p>
                        <p className="mt-1.5 text-[13px] leading-snug text-brown">{o.tagline}</p>
                        <p className="mt-3 flex items-center justify-between text-[13px] font-medium text-espresso">
                          <span>
                            {formatPrice(o.price)} <WasPrice price={o.price} className="mx-1 font-normal text-brown" /> / {o.duration}
                          </span>
                          <ArrowRight size={15} className="text-caramel transition-transform group-hover:translate-x-1" aria-hidden />
                        </p>
                      </div>
                    </a>
                  ) : (
                    <button
                      key={o.slug}
                      type="button"
                      onClick={() => chooseOffer(o)}
                      className={`group overflow-hidden rounded-[16px] border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                        offer?.slug === o.slug ? 'border-espresso' : 'border-sand/70'
                      }`}
                    >
                      <img src={o.image} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="p-4">
                        <p className="font-serif-lc text-[19px] leading-tight text-espresso">{o.name}</p>
                        <p className="mt-1.5 text-[13px] leading-snug text-brown">{o.tagline}</p>
                        <p className="mt-3 flex items-center justify-between text-[13px] font-medium text-espresso">
                          <span>
                            {formatPrice(o.price)} <WasPrice price={o.price} className="mx-1 font-normal text-brown" /> / {o.duration}
                          </span>
                          <ArrowRight size={15} className="text-caramel transition-transform group-hover:translate-x-1" aria-hidden />
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : step === 1 ? (
              <>
                <h2 className="font-serif-lc text-[24px] text-espresso">Choisissez votre date et votre heure</h2>
                {sendError && <p className="mt-2 text-[13.5px] text-[#9b3b2a]">{sendError}</p>}
                <div className="mt-5">
                  <BookingCalendar
                    month={month}
                    onMonthChange={(m) => { setMonth(m); setDay(null); setSlot(null); }}
                    day={day}
                    onDayChange={(d) => { setDay(d); setSlot(null); }}
                    slot={slot}
                    onSlotChange={setSlot}
                    taken={taken}
                    loading={loading}
                    loadError={loadError}
                  />
                </div>
                <div className="mt-6 flex justify-between gap-3 border-t border-sand/60 pt-5">
                  <button type="button" onClick={() => setStep(0)} className="inline-flex items-center gap-2 text-[14px] font-medium text-brown hover:text-espresso">
                    <ArrowLeft size={15} aria-hidden /> Retour
                  </button>
                  <button
                    type="button"
                    disabled={!slot}
                    onClick={() => { setSendError(''); setStep(2); }}
                    className="inline-flex items-center gap-2 rounded-full bg-espresso px-6 py-3 text-[14px] font-medium text-white-warm transition-colors hover:bg-brown disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continuer <ArrowRight size={15} aria-hidden />
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={submit}>
                <h2 className="font-serif-lc text-[24px] text-espresso">Vos coordonnées</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-[13px] font-medium text-espresso">
                    Nom complet
                    <input required minLength={2} maxLength={120} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} autoComplete="name" />
                  </label>
                  <label className="text-[13px] font-medium text-espresso">
                    E-mail
                    <input required type="email" maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} autoComplete="email" />
                  </label>
                  <label className="text-[13px] font-medium text-espresso md:col-span-2">
                    WhatsApp ou téléphone <span className="font-normal text-brown">(facultatif)</span>
                    <input type="tel" maxLength={40} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} autoComplete="tel" />
                  </label>
                  <label className="text-[13px] font-medium text-espresso md:col-span-2">
                    Parlez-moi de votre projet <span className="font-normal text-brown">(facultatif)</span>
                    <textarea rows={4} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${inputCls} resize-none`} />
                  </label>
                </div>
                {sendError && <p className="mt-3 text-[13.5px] text-[#9b3b2a]">{sendError}</p>}
                <div className="mt-6 flex justify-between gap-3 border-t border-sand/60 pt-5">
                  <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-[14px] font-medium text-brown hover:text-espresso">
                    <ArrowLeft size={15} aria-hidden /> Retour
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center gap-2 rounded-full bg-espresso px-6 py-3 text-[14px] font-medium text-white-warm transition-colors hover:bg-brown disabled:opacity-60"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <CalendarCheck2 size={15} aria-hidden />}
                    Confirmer la réservation
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        {offer && !done && (
          <p className="mt-5 text-center text-[13px] text-brown">
            Envie d’en savoir plus avant de réserver ?{' '}
            <Link to={offerPath(offer)} className="link-line font-medium text-espresso">Voir le détail du coaching</Link>
          </p>
        )}
      </div>
    </div>
  );
}
