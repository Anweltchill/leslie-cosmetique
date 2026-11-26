import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, Loader2, Mail, Phone, Video, X } from 'lucide-react';
import { Link } from '@/lib/router';
import { EMAIL_LABEL, rpc, type Booking, type BookingStatus, type MailSettings } from '../api';
import { Badge, Card, Empty } from '../ui';
import { btnCls, btnGhostCls, dateToParis, euros, fmtDateTime, fmtTime, inputCls, parisToDate } from '../format';
import { Availability } from './Availability';

const STATUS: Record<BookingStatus, { label: string; tone: 'gold' | 'green' | 'red' | 'grey' }> = {
  pending: { label: 'À confirmer', tone: 'gold' },
  confirmed: { label: 'Confirmé', tone: 'green' },
  done: { label: 'Terminé', tone: 'grey' },
  cancelled: { label: 'Annulé', tone: 'red' },
};
const CHIP: Record<BookingStatus, string> = {
  pending: 'bg-[#f3e3c4] text-[#7a4f12]',
  confirmed: 'bg-[#e3ecdf] text-[#3f6b3a]',
  done: 'bg-nude text-brown',
  cancelled: 'bg-[#f4dcd6] text-[#9b3b2a] line-through',
};
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function Agenda({ onChange }: { onChange?: () => void }) {
  const [view, setView] = useState<'rdv' | 'dispo'>(() => (window.location.hash === '#disponibilites' ? 'dispo' : 'rdv'));
  const switchView = (v: 'rdv' | 'dispo') => {
    setView(v);
    window.history.replaceState(null, '', v === 'dispo' ? '#disponibilites' : window.location.pathname);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">Agenda</h1>
        <Link to="/admin/parametres" className={btnGhostCls}>
          <CalendarPlus size={15} aria-hidden /> Ajouter à Google Agenda / iPhone
        </Link>
      </div>
      <div className="flex gap-1.5" role="tablist" aria-label="Agenda">
        {([['rdv', 'Rendez-vous'], ['dispo', 'Mes disponibilités']] as const).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => switchView(v)}
            className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
              view === v ? 'bg-espresso text-white-warm' : 'border border-sand text-espresso hover:bg-nude'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {view === 'dispo' ? <Availability /> : <Bookings onChange={onChange} />}
    </div>
  );
}

function Bookings({ onChange }: { onChange?: () => void }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const gridStart = new Date(month);
      gridStart.setDate(gridStart.getDate() - 7);
      const gridEnd = new Date(month.getFullYear(), month.getMonth() + 1, 8);
      const now = new Date();
      const in60 = new Date(now.getTime() + 60 * 86400000);
      const [b, u] = await Promise.all([
        rpc<Booking[]>('lc_admin_bookings', { p_from: gridStart.toISOString(), p_to: gridEnd.toISOString() }),
        rpc<Booking[]>('lc_admin_bookings', { p_from: new Date(now.getTime() - 3600000).toISOString(), p_to: in60.toISOString() }),
      ]);
      setBookings(b);
      setUpcoming(u.filter((x) => x.status === 'pending' || x.status === 'confirmed'));
      setSelected((cur) => (cur ? [...b, ...u].find((x) => x.id === cur.id) ?? cur : cur));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  // Lien visio par défaut (Paramètres → E-mails automatiques)
  const [defaultMeet, setDefaultMeet] = useState('');
  useEffect(() => {
    rpc<MailSettings>('lc_admin_mail_settings').then((m) => setDefaultMeet(m.meet_url ?? '')).catch(() => undefined);
  }, []);

  const cells = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [month]);

  const byDay = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of bookings ?? []) {
      const k = dayKey(new Date(b.starts_at));
      m.set(k, [...(m.get(k) ?? []), b]);
    }
    return m;
  }, [bookings]);

  const update = async (b: Booking, status: BookingStatus | null, note: string | null) => {
    await rpc('lc_admin_update_booking', { p_id: b.id, p_status: status, p_note: note });
    setSelected({ ...b, status: status ?? b.status, admin_note: note ?? b.admin_note });
    await load();
    onChange?.();
  };
  const refresh = async () => {
    await load();
    onChange?.();
  };

  const today = dayKey(new Date());
  const lastRow = cells.slice(35).every((d) => d.getMonth() !== month.getMonth()) ? 35 : 42;

  return (
    <div className="space-y-5">
      {error && <p className="text-[14px] text-[#9b3b2a]">{error}</p>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card
          className="min-w-0"
          title={monthFmt.format(month).replace(/^./, (c) => c.toUpperCase())}
          action={
            <div className="flex gap-1.5">
              <button type="button" aria-label="Mois précédent" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-sand hover:bg-nude">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }} className="rounded-full border border-sand px-3 text-[12.5px] font-medium hover:bg-nude">
                Aujourd’hui
              </button>
              <button type="button" aria-label="Mois suivant" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-9 w-9 items-center justify-center rounded-full border border-sand hover:bg-nude">
                <ChevronRight size={16} />
              </button>
            </div>
          }
        >
          {!bookings ? (
            <p className="flex items-center gap-2 text-[14px] text-brown"><Loader2 size={16} className="animate-spin" /> Chargement…</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[560px] grid-cols-7 gap-px overflow-hidden rounded-[12px] border border-sand/70 bg-sand/70">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="bg-cream py-1.5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-brown">{w}</div>
                ))}
                {cells.slice(0, lastRow).map((d) => {
                  const inMonth = d.getMonth() === month.getMonth();
                  const list = byDay.get(dayKey(d)) ?? [];
                  return (
                    <div key={d.toISOString()} className={`min-h-[92px] p-1.5 ${inMonth ? 'bg-white-warm' : 'bg-cream/70'}`}>
                      <p className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${dayKey(d) === today ? 'bg-espresso font-medium text-white-warm' : inMonth ? 'text-espresso' : 'text-brown/50'}`}>
                        {d.getDate()}
                      </p>
                      <div className="space-y-1">
                        {list.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelected(b)}
                            className={`block w-full truncate rounded-[6px] px-1.5 py-1 text-left text-[11px] font-medium ${CHIP[b.status]}`}
                            title={`${fmtTime.format(new Date(b.starts_at))} · ${b.offer_name} · ${b.full_name}`}
                          >
                            {fmtTime.format(new Date(b.starts_at))} {b.full_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(STATUS) as BookingStatus[]).map((s) => (
              <Badge key={s} tone={STATUS[s].tone}>{STATUS[s].label}</Badge>
            ))}
          </div>
        </Card>

        <div className="min-w-0 space-y-5">
          {selected && (
            <Card
              title={selected.offer_name}
              action={
                <button type="button" aria-label="Fermer" onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-nude">
                  <X size={15} />
                </button>
              }
            >
              <BookingDetail booking={selected} onUpdate={update} onRefresh={refresh} defaultMeet={defaultMeet} />
            </Card>
          )}
          <Card title="Prochains rendez-vous">
            {upcoming.length ? (
              <ul className="divide-y divide-sand/60">
                {upcoming.map((b) => (
                  <li key={b.id}>
                    <button type="button" onClick={() => setSelected(b)} className="w-full py-2.5 text-left">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-espresso first-letter:uppercase">{fmtDateTime.format(new Date(b.starts_at))}</span>
                        <Badge tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Badge>
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-brown">{b.full_name} · {b.offer_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Aucun rendez-vous prévu dans les 60 prochains jours.</Empty>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

const missingFn = (e: unknown) => /could not find the function/i.test((e as Error)?.message ?? '');
const EMAIL_STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: 'envoyé', cls: 'text-[#3f6b3a]' },
  queued: { label: 'en cours d’envoi', cls: 'text-[#7a4f12]' },
  sending: { label: 'en cours d’envoi', cls: 'text-[#7a4f12]' },
  failed: { label: 'échec', cls: 'text-[#9b3b2a]' },
  skipped: { label: 'non envoyé (plus nécessaire)', cls: 'text-brown' },
};
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
const localTime = (iso: string, tz: string) => {
  try {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date(iso));
  } catch {
    return '';
  }
};

type Mode = null | 'confirm' | 'move' | 'cancel' | 'link';

function BookingDetail({
  booking: b,
  onUpdate,
  onRefresh,
  defaultMeet,
}: {
  booking: Booking;
  onUpdate: (b: Booking, s: BookingStatus | null, n: string | null) => Promise<void>;
  onRefresh: () => Promise<void>;
  defaultMeet: string;
}) {
  const [note, setNote] = useState(b.admin_note);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [meet, setMeet] = useState('');
  const [notify, setNotify] = useState(true);
  const [msg, setMsg] = useState('');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  useEffect(() => setNote(b.admin_note), [b.id, b.admin_note]);
  useEffect(() => {
    setMode(null);
    setError('');
    setFlash('');
  }, [b.id]);

  const open = (m: Mode) => {
    setError('');
    setFlash('');
    setNotify(true);
    setMsg('');
    setMeet(b.meet_url || defaultMeet);
    const p = dateToParis(new Date(b.starts_at));
    setDay(p.day);
    setTime(p.time);
    setMode(m);
  };

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      setMode(null);
      setFlash(done);
      await onRefresh();
    } catch (e) {
      setError(missingFn(e) ? 'Fonction indisponible : la mise à jour de la base (e-mails automatiques) n’est pas encore installée.' : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const act = async (s: BookingStatus | null, n: string | null) => {
    setBusy(true);
    try {
      await onUpdate(b, s, n);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () =>
    run(async () => {
      try {
        await rpc('lc_admin_confirm_booking', { p_id: b.id, p_meet_url: meet, p_notify: notify });
      } catch (e) {
        if (!missingFn(e)) throw e;
        await rpc('lc_admin_update_booking', { p_id: b.id, p_status: 'confirmed', p_note: null });
      }
    }, notify ? 'Rendez-vous confirmé : la cliente reçoit l’e-mail avec le lien de la visio.' : 'Rendez-vous confirmé (sans e-mail).');

  const cancel = () =>
    run(async () => {
      try {
        await rpc('lc_admin_cancel_booking', { p_id: b.id, p_message: msg.trim(), p_notify: notify });
      } catch (e) {
        if (!missingFn(e)) throw e;
        await rpc('lc_admin_update_booking', { p_id: b.id, p_status: 'cancelled', p_note: null });
      }
    }, notify ? 'Rendez-vous annulé : la cliente est prévenue par e-mail.' : 'Rendez-vous annulé (sans e-mail).');

  const move = () => {
    const d = parisToDate(day, time);
    if (!d) return setError('Indiquez une date et une heure.');
    return run(
      () => rpc('lc_admin_move_booking', { p_id: b.id, p_starts_at: d.toISOString(), p_message: msg.trim(), p_notify: notify }),
      notify ? 'Rendez-vous déplacé : la cliente reçoit le nouvel horaire par e-mail.' : 'Rendez-vous déplacé (sans e-mail).',
    );
  };

  const saveLink = () =>
    run(async () => {
      await rpc('lc_admin_save_meet_url', { p_id: b.id, p_meet_url: meet });
      if (notify && b.status === 'confirmed') await rpc('lc_admin_resend_booking_email', { p_id: b.id, p_kind: 'booking_confirmed' });
    }, notify && b.status === 'confirmed' ? 'Lien enregistré et confirmation renvoyée à la cliente.' : 'Lien enregistré.');

  const resend = (kind: 'booking_request' | 'booking_confirmed') =>
    run(() => rpc('lc_admin_resend_booking_email', { p_id: b.id, p_kind: kind }), 'E-mail renvoyé à la cliente.');

  const subject = encodeURIComponent(`Votre rendez-vous — ${b.offer_name}`);
  const when = fmtDateTime.format(new Date(b.starts_at));
  const tz = b.timezone && b.timezone !== 'Europe/Paris' ? b.timezone : '';
  const clientTime = tz ? localTime(b.starts_at, tz) : '';
  const showClientTime = clientTime && clientTime !== fmtTime.format(new Date(b.starts_at));
  const active = b.status === 'pending' || b.status === 'confirmed';
  const hasMailFeatures = b.emails !== undefined;

  const notifyBox = (label: string) => (
    <label className="flex items-start gap-2 text-[12.5px] text-espresso">
      <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 accent-[#3a2a22]" />
      <span>{label}</span>
    </label>
  );
  const messageBox = (
    <label className="block text-[12px] font-medium text-brown">
      Mot pour la cliente (facultatif, ajouté à l’e-mail)
      <textarea rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1500} className={`${inputCls} mt-1 resize-none`} />
    </label>
  );
  const meetInput = (
    <label className="block text-[12px] font-medium text-brown">
      Lien de la visio (Google Meet, Zoom…)
      <input value={meet} onChange={(e) => setMeet(e.target.value)} placeholder="https://meet.google.com/…" className={`${inputCls} mt-1`} inputMode="url" />
      <span className="mt-1 block font-normal text-brown/80">
        Sur meet.google.com : « Nouvelle réunion » → « Créer une réunion pour plus tard », puis collez le lien ici.
      </span>
    </label>
  );

  return (
    <div className="space-y-3 text-[13.5px] text-espresso">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Badge>
        <span className="first-letter:uppercase">{when}</span>
        <span className="text-brown">· {b.minutes} min</span>
      </div>
      {showClientTime && (
        <p className="flex items-center gap-1.5 text-[12.5px] text-brown">
          <Clock size={13} aria-hidden /> {clientTime} pour la cliente ({tz.split('/').pop()?.replace(/_/g, ' ')})
        </p>
      )}
      <div>
        <p className="font-medium">{b.full_name}</p>
        <a href={`mailto:${b.email}?subject=${subject}`} className="mt-1 flex items-center gap-1.5 text-brown hover:text-espresso"><Mail size={13} /> {b.email}</a>
        {b.phone && <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="mt-1 flex items-center gap-1.5 text-brown hover:text-espresso"><Phone size={13} /> {b.phone}</a>}
      </div>
      {b.message && <p className="whitespace-pre-wrap rounded-[12px] bg-cream p-3 text-[13px] leading-relaxed">{b.message}</p>}

      {hasMailFeatures && (
        <div className="space-y-1.5 rounded-[12px] border border-sand/70 p-3 text-[12.5px]">
          <p className="flex items-center gap-1.5">
            <span className="w-[62px] shrink-0 text-brown">Paiement</span>
            {(b.paid_cents ?? 0) > 0 ? (
              <span className="font-medium text-[#3f6b3a]">Réglé · {euros(b.paid_cents ?? 0)}</span>
            ) : (
              <span className="text-[#7a4f12]">Pas de paiement en ligne enregistré</span>
            )}
          </p>
          <p className="flex items-center gap-1.5">
            <span className="w-[62px] shrink-0 text-brown">Visio</span>
            {b.meet_url ? (
              <a href={b.meet_url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-caramel underline">{b.meet_url.replace(/^https?:\/\//, '')}</a>
            ) : (
              <span className="text-brown">pas encore de lien</span>
            )}
            {active && mode !== 'link' && (
              <button type="button" onClick={() => open('link')} className="ml-auto shrink-0 text-[12px] font-medium text-espresso underline">
                {b.meet_url ? 'Modifier' : 'Ajouter'}
              </button>
            )}
          </p>
        </div>
      )}

      {flash && (
        <p className="flex items-start gap-1.5 rounded-[10px] bg-[#e3ecdf] p-2.5 text-[12.5px] text-[#3f6b3a]">
          <Check size={14} className="mt-0.5 shrink-0" /> {flash}
        </p>
      )}
      {error && (
        <p className="flex items-start gap-1.5 rounded-[10px] bg-[#f4dcd6] p-2.5 text-[12.5px] text-[#9b3b2a]">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {mode === 'confirm' && (
        <div className="space-y-3 rounded-[12px] bg-cream p-3">
          {meetInput}
          {notifyBox('Envoyer la confirmation par e-mail (lien visio, ajout à l’agenda, rappel automatique la veille)')}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={confirm} className={btnCls}>{busy && <Loader2 size={14} className="animate-spin" />} Confirmer le rendez-vous</button>
            <button type="button" disabled={busy} onClick={() => setMode(null)} className={btnGhostCls}>Retour</button>
          </div>
        </div>
      )}
      {mode === 'link' && (
        <div className="space-y-3 rounded-[12px] bg-cream p-3">
          {meetInput}
          {b.status === 'confirmed' && notifyBox('Renvoyer la confirmation avec ce lien à la cliente')}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={saveLink} className={btnCls}>{busy && <Loader2 size={14} className="animate-spin" />} Enregistrer le lien</button>
            <button type="button" disabled={busy} onClick={() => setMode(null)} className={btnGhostCls}>Retour</button>
          </div>
        </div>
      )}
      {mode === 'move' && (
        <div className="space-y-3 rounded-[12px] bg-cream p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[12px] font-medium text-brown">
              Nouvelle date
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={`${inputCls} mt-1`} />
            </label>
            <label className="text-[12px] font-medium text-brown">
              Heure (Paris)
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} step={300} className={`${inputCls} mt-1`} />
            </label>
          </div>
          {messageBox}
          {notifyBox('Prévenir la cliente par e-mail du nouvel horaire')}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={move} className={btnCls}>{busy && <Loader2 size={14} className="animate-spin" />} Déplacer le rendez-vous</button>
            <button type="button" disabled={busy} onClick={() => setMode(null)} className={btnGhostCls}>Retour</button>
          </div>
        </div>
      )}
      {mode === 'cancel' && (
        <div className="space-y-3 rounded-[12px] bg-cream p-3">
          {messageBox}
          {notifyBox('Prévenir la cliente par e-mail (avec un lien pour réserver un autre créneau)')}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={cancel} className={btnCls}>{busy && <Loader2 size={14} className="animate-spin" />} Annuler le rendez-vous</button>
            <button type="button" disabled={busy} onClick={() => setMode(null)} className={btnGhostCls}>Retour</button>
          </div>
          <p className="text-[11.5px] text-brown">Annuler libère le créneau dans le calendrier du site.</p>
        </div>
      )}

      {mode === null && (
        <div className="flex flex-wrap gap-2">
          {b.status === 'pending' && <button type="button" disabled={busy} onClick={() => open('confirm')} className={btnCls}><Video size={14} /> Confirmer</button>}
          {active && hasMailFeatures && <button type="button" disabled={busy} onClick={() => open('move')} className={btnGhostCls}>Déplacer</button>}
          {b.status === 'confirmed' && <button type="button" disabled={busy} onClick={() => act('done', null)} className={btnGhostCls}>Terminé</button>}
          {active && <button type="button" disabled={busy} onClick={() => open('cancel')} className={btnGhostCls}>Annuler</button>}
          {!active && <button type="button" disabled={busy} onClick={() => act('pending', null)} className={btnGhostCls}>Remettre « à confirmer »</button>}
        </div>
      )}

      {hasMailFeatures && (
        <div className="border-t border-sand/60 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-brown">E-mails envoyés à la cliente</p>
          {b.emails && b.emails.length ? (
            <ul className="mt-1.5 space-y-1 text-[12.5px]">
              {b.emails.map((e, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-espresso">{EMAIL_LABEL[e.kind] ?? e.kind}</span>
                  <span className={EMAIL_STATUS[e.status]?.cls}>· {EMAIL_STATUS[e.status]?.label ?? e.status}</span>
                  <span className="text-brown/80">· {shortFmt.format(new Date(e.sent_at ?? e.created_at))}</span>
                  {e.status === 'failed' && e.error && <span className="w-full text-[11.5px] text-[#9b3b2a]">{e.error}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12.5px] text-brown">Aucun e-mail pour ce rendez-vous (réservé avant la mise en place des e-mails).</p>
          )}
          {active && mode === null && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
              <button type="button" disabled={busy} onClick={() => resend('booking_request')} className="font-medium text-espresso underline">Renvoyer le récapitulatif</button>
              {b.status === 'confirmed' && <button type="button" disabled={busy} onClick={() => resend('booking_confirmed')} className="font-medium text-espresso underline">Renvoyer la confirmation</button>}
            </div>
          )}
        </div>
      )}

      <label className="block text-[12px] font-medium text-brown">
        Note interne
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} mt-1 resize-none`} maxLength={2000} />
      </label>
      <button type="button" disabled={busy || note === b.admin_note} onClick={() => act(null, note)} className={btnGhostCls}>Enregistrer la note</button>
    </div>
  );
}
