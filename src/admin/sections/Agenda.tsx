import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Loader2, Mail, Phone, X } from 'lucide-react';
import { Link } from '@/lib/router';
import { rpc, type Booking, type BookingStatus } from '../api';
import { Badge, Card, Empty } from '../ui';
import { btnCls, btnGhostCls, fmtDateTime, fmtTime, inputCls } from '../format';

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
    } catch (e) {
      setError((e as Error).message);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

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
    const next = { ...b, status: status ?? b.status, admin_note: note ?? b.admin_note };
    setSelected(next);
    await load();
    onChange?.();
  };

  const today = dayKey(new Date());
  const lastRow = cells.slice(35).every((d) => d.getMonth() !== month.getMonth()) ? 35 : 42;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">Agenda</h1>
        <Link to="/admin/parametres" className={btnGhostCls}>
          <CalendarPlus size={15} aria-hidden /> Ajouter à Google Agenda / iPhone
        </Link>
      </div>
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
              <BookingDetail booking={selected} onUpdate={update} />
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

function BookingDetail({ booking: b, onUpdate }: { booking: Booking; onUpdate: (b: Booking, s: BookingStatus | null, n: string | null) => Promise<void> }) {
  const [note, setNote] = useState(b.admin_note);
  const [busy, setBusy] = useState(false);
  useEffect(() => setNote(b.admin_note), [b.id, b.admin_note]);

  const act = async (s: BookingStatus | null, n: string | null) => {
    setBusy(true);
    try {
      await onUpdate(b, s, n);
    } finally {
      setBusy(false);
    }
  };

  const subject = encodeURIComponent(`Votre rendez-vous — ${b.offer_name}`);
  const when = fmtDateTime.format(new Date(b.starts_at));

  return (
    <div className="space-y-3 text-[13.5px] text-espresso">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS[b.status].tone}>{STATUS[b.status].label}</Badge>
        <span className="first-letter:uppercase">{when}</span>
        <span className="text-brown">· {b.minutes} min</span>
      </div>
      <div>
        <p className="font-medium">{b.full_name}</p>
        <a href={`mailto:${b.email}?subject=${subject}`} className="mt-1 flex items-center gap-1.5 text-brown hover:text-espresso"><Mail size={13} /> {b.email}</a>
        {b.phone && <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="mt-1 flex items-center gap-1.5 text-brown hover:text-espresso"><Phone size={13} /> {b.phone}</a>}
      </div>
      {b.message && <p className="whitespace-pre-wrap rounded-[12px] bg-cream p-3 text-[13px] leading-relaxed">{b.message}</p>}
      <div className="flex flex-wrap gap-2">
        {b.status !== 'confirmed' && <button type="button" disabled={busy} onClick={() => act('confirmed', null)} className={btnCls}>Confirmer</button>}
        {b.status !== 'done' && b.status !== 'cancelled' && <button type="button" disabled={busy} onClick={() => act('done', null)} className={btnGhostCls}>Terminé</button>}
        {b.status !== 'cancelled' && <button type="button" disabled={busy} onClick={() => act('cancelled', null)} className={btnGhostCls}>Annuler</button>}
        {b.status !== 'pending' && <button type="button" disabled={busy} onClick={() => act('pending', null)} className={btnGhostCls}>Remettre « à confirmer »</button>}
      </div>
      <p className="text-[11.5px] text-brown">Annuler libère le créneau dans le calendrier du site.</p>
      <label className="block text-[12px] font-medium text-brown">
        Note interne
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} mt-1 resize-none`} maxLength={2000} />
      </label>
      <button type="button" disabled={busy || note === b.admin_note} onClick={() => act(null, note)} className={btnGhostCls}>Enregistrer la note</button>
    </div>
  );
}
