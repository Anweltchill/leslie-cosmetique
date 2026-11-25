import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarOff, CalendarPlus, Check, Loader2, Plus, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { rpc } from '../api';
import { Badge, Card, Empty } from '../ui';
import { btnCls, btnGhostCls, inputCls } from '../format';

/* Disponibilités de Leslie : horaires récurrents par jour, dates ponctuelles et réglages des réservations.
   Toutes les heures sont en heure de Paris. */

interface Rule { offer_slug: string | null; weekday: number; start_time: string }
interface DateRow { offer_slug: string | null; day: string; start_time: string | null; kind: 'open' | 'block'; note: string }
interface Settings { open_from: string | null; max_days_ahead: number; min_hours_notice: number }
interface State { settings: Settings; rules: Rule[]; dates: DateRow[] }

const OFFERS = [
  { slug: 'coaching-formulation', label: 'Coaching Formulation', minutes: 60 },
  { slug: 'consultation-lancement-marque', label: 'Lancement de marque', minutes: 60 },
  { slug: 'audit-orientation', label: 'Audit d’orientation', minutes: 30 },
] as const;
const ALL = '';
const offerLabel = (slug: string | null) => OFFERS.find((o) => o.slug === slug)?.label ?? 'Toutes les séances';
const minutesOf = (slug: string | null) => OFFERS.find((o) => o.slug === slug)?.minutes ?? 60;

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const TZ = 'Europe/Paris';
const dayLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
const timeShort = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const dateOnly = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const endTime = (t: string, minutes: number) => {
  const [h, m] = t.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const fmtT = (t: string) => t.replace(':', ' h ');
const todayParis = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

export function Availability() {
  const [state, setState] = useState<State | null>(null);
  const [saved, setSaved] = useState<string>('');
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState(false);
  const [tab, setTab] = useState<string>(OFFERS[0].slug);

  const load = useCallback(async () => {
    setError('');
    try {
      const d = await rpc<State>('lc_admin_availability');
      setState(d);
      setSaved(JSON.stringify(d));
    } catch (e) {
      const msg = (e as Error).message;
      if (/could not find the function/i.test(msg)) setMissing(true);
      else setError(msg);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = state !== null && JSON.stringify(state) !== saved;

  const save = async () => {
    if (!state) return;
    setSaving(true);
    setError('');
    try {
      const d = await rpc<State>('lc_admin_save_availability', {
        p_settings: state.settings,
        p_rules: state.rules,
        p_dates: state.dates,
      });
      setState(d);
      setSaved(JSON.stringify(d));
      setOkMsg(true);
      window.setTimeout(() => setOkMsg(false), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (missing) {
    return (
      <Card title="Disponibilités">
        <p className="flex items-start gap-2 text-[13.5px] leading-relaxed text-espresso">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-caramel" aria-hidden />
          La gestion des disponibilités n’est pas encore activée dans la base de données. Elle apparaîtra ici dès que le script de mise à jour aura été exécuté.
        </p>
      </Card>
    );
  }
  if (error && !state) return <p className="text-[14px] text-[#9b3b2a]">{error}</p>;
  if (!state) return <p className="flex items-center gap-2 text-[14px] text-brown"><Loader2 size={16} className="animate-spin" /> Chargement…</p>;

  const set = (patch: Partial<State>) => setState({ ...state, ...patch });
  const tabSlug = tab === ALL ? null : tab;

  return (
    <div className="space-y-5 pb-20">
      <Card title="Réglages des réservations">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-[12.5px] font-medium text-brown">
            Réservations possibles à partir du
            <input
              type="date"
              value={state.settings.open_from ?? ''}
              onChange={(e) => set({ settings: { ...state.settings, open_from: e.target.value || null } })}
              className={`${inputCls} mt-1`}
            />
            <span className="mt-1 block text-[11.5px] font-normal">Laisser vide pour ouvrir tout de suite.</span>
          </label>
          <label className="block text-[12.5px] font-medium text-brown">
            Réservations ouvertes sur
            <select
              value={state.settings.max_days_ahead}
              onChange={(e) => set({ settings: { ...state.settings, max_days_ahead: Number(e.target.value) } })}
              className={`${inputCls} mt-1`}
            >
              {[7, 14, 21, 30, 45, 60, 90].map((n) => (
                <option key={n} value={n}>{n === 30 ? '1 mois (30 jours)' : n === 60 ? '2 mois (60 jours)' : n === 90 ? '3 mois (90 jours)' : `${n} jours`}</option>
              ))}
            </select>
          </label>
          <label className="block text-[12.5px] font-medium text-brown">
            Délai minimum avant un rendez-vous
            <select
              value={state.settings.min_hours_notice}
              onChange={(e) => set({ settings: { ...state.settings, min_hours_notice: Number(e.target.value) } })}
              className={`${inputCls} mt-1`}
            >
              {[2, 6, 12, 24, 48, 72].map((n) => (
                <option key={n} value={n}>{n < 24 ? `${n} heures` : n === 24 ? '24 heures (la veille)' : `${n / 24} jours`}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card title="Mes horaires chaque semaine">
        <p className="-mt-1 mb-4 text-[12.5px] text-brown">
          Heures de début des séances, en heure de Paris. Elles se répètent chaque semaine. Les personnes voient les horaires convertis dans leur heure locale.
        </p>
        <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Séance">
          {[...OFFERS.map((o) => ({ slug: o.slug as string, label: o.label })), { slug: ALL, label: 'Toutes les séances' }].map((o) => {
            const count = state.rules.filter((r) => (r.offer_slug ?? ALL) === o.slug).length;
            return (
              <button
                key={o.slug || 'all'}
                type="button"
                role="tab"
                aria-selected={tab === o.slug}
                onClick={() => setTab(o.slug)}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                  tab === o.slug ? 'bg-espresso text-white-warm' : 'border border-sand text-espresso hover:bg-nude'
                }`}
              >
                {o.label} <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
        {tab === ALL && (
          <p className="mb-3 rounded-[10px] bg-nude px-3 py-2 text-[12px] text-brown">
            Les horaires ajoutés ici sont proposés pour toutes les séances (coaching, consultation et audit).
          </p>
        )}
        <WeekEditor
          rules={state.rules.filter((r) => (r.offer_slug ?? ALL) === tab)}
          minutes={minutesOf(tabSlug)}
          onChange={(rows) =>
            set({ rules: [...state.rules.filter((r) => (r.offer_slug ?? ALL) !== tab), ...rows.map((r) => ({ ...r, offer_slug: tabSlug }))] })
          }
        />
      </Card>

      <Card title="Dates ponctuelles">
        <p className="-mt-1 mb-4 text-[12.5px] text-brown">
          Bloquez un jour (vacances, imprévu) ou un créneau précis, ou ajoutez un créneau exceptionnel en plus de vos horaires habituels.
        </p>
        <DatesEditor dates={state.dates} onChange={(dates) => set({ dates })} />
      </Card>

      <Preview savedKey={saved} />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-cream/95 px-4 py-3 backdrop-blur lg:left-[250px]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-end gap-3 md:px-4">
          {error && <span className="mr-auto text-[12.5px] text-[#9b3b2a]">{error}</span>}
          {okMsg && !dirty && (
            <span className="mr-auto flex items-center gap-1.5 text-[13px] text-[#3f6b3a]"><Check size={15} /> Disponibilités enregistrées : le site est à jour.</span>
          )}
          {dirty && <span className="mr-auto text-[12.5px] text-brown">Modifications non enregistrées</span>}
          <button type="button" disabled={!dirty || saving} onClick={() => setState(JSON.parse(saved))} className={btnGhostCls}>
            Annuler
          </button>
          <button type="button" disabled={!dirty || saving} onClick={save} className={btnCls}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Horaires récurrents d'une séance ───────── */
function WeekEditor({ rules, minutes, onChange }: { rules: Rule[]; minutes: number; onChange: (r: Rule[]) => void }) {
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const add = (weekday: number) => {
    const t = drafts[weekday];
    if (!t || rules.some((r) => r.weekday === weekday && r.start_time === t)) return;
    onChange([...rules, { offer_slug: null, weekday, start_time: t }]);
    setDrafts({ ...drafts, [weekday]: '' });
  };
  const copyToAll = (weekday: number) => {
    const times = rules.filter((r) => r.weekday === weekday).map((r) => r.start_time);
    const others = [1, 2, 3, 4, 5, 6, 7].filter((d) => d !== weekday && rules.some((r) => r.weekday === d));
    const targets = others.length ? others : [1, 2, 3, 4, 5, 6, 7].filter((d) => d !== weekday);
    const keep = rules.filter((r) => !targets.includes(r.weekday));
    onChange([...keep, ...targets.flatMap((d) => times.map((t) => ({ offer_slug: null, weekday: d, start_time: t })))]);
  };

  return (
    <div className="divide-y divide-sand/60 rounded-[14px] border border-sand/70">
      {DAYS.map((label, i) => {
        const weekday = i + 1;
        const times = rules.filter((r) => r.weekday === weekday).map((r) => r.start_time).sort();
        return (
          <div key={weekday} className="grid gap-2 px-3 py-3 md:grid-cols-[110px_1fr_auto] md:items-center md:px-4">
            <p className={`text-[13.5px] font-medium ${times.length ? 'text-espresso' : 'text-brown/60'}`}>{label}</p>
            <div className="flex flex-wrap gap-1.5">
              {times.length === 0 && <span className="text-[12.5px] text-brown/60">Indisponible</span>}
              {times.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-nude py-1 pl-3 pr-1 text-[12.5px] font-medium text-espresso">
                  {fmtT(t)} – {fmtT(endTime(t, minutes))}
                  <button
                    type="button"
                    aria-label={`Retirer ${t} le ${label}`}
                    onClick={() => onChange(rules.filter((r) => !(r.weekday === weekday && r.start_time === t)))}
                    className="flex h-5 w-5 items-center justify-center rounded-full text-brown hover:bg-sand hover:text-espresso"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="time"
                step={300}
                value={drafts[weekday] ?? ''}
                onChange={(e) => setDrafts({ ...drafts, [weekday]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && add(weekday)}
                aria-label={`Heure à ajouter le ${label}`}
                className="w-[112px] rounded-[10px] border border-sand bg-white-warm px-2.5 py-1.5 text-[13px] text-espresso focus:border-caramel focus:outline-none"
              />
              <button type="button" onClick={() => add(weekday)} disabled={!drafts[weekday]} className={`${btnGhostCls} px-3 py-1.5`}>
                <Plus size={13} /> Ajouter
              </button>
              {times.length > 0 && (
                <button type="button" onClick={() => copyToAll(weekday)} className="text-[11.5px] text-brown underline-offset-2 hover:text-espresso hover:underline">
                  {[1, 2, 3, 4, 5, 6, 7].some((d) => d !== weekday && rules.some((r) => r.weekday === d))
                    ? 'Mêmes horaires sur mes autres jours'
                    : 'Mêmes horaires tous les jours'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────── Dates ponctuelles (blocages et créneaux en plus) ───────── */
function DatesEditor({ dates, onChange }: { dates: DateRow[]; onChange: (d: DateRow[]) => void }) {
  const [kind, setKind] = useState<'block-day' | 'block-slot' | 'open'>('block-day');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [offer, setOffer] = useState<string>(ALL);
  const [note, setNote] = useState('');
  const needsTime = kind !== 'block-day';
  const canAdd = Boolean(day && day >= todayParis() && (!needsTime || time));

  const add = () => {
    if (!canAdd) return;
    const row: DateRow = {
      offer_slug: offer === ALL ? null : offer,
      day,
      start_time: needsTime ? time : null,
      kind: kind === 'open' ? 'open' : 'block',
      note: note.trim(),
    };
    onChange([...dates, row].sort((a, b) => (a.day + (a.start_time ?? '')).localeCompare(b.day + (b.start_time ?? ''))));
    setTime('');
    setNote('');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-[14px] border border-sand/70 bg-cream/60 p-4 md:grid-cols-[1.2fr_1fr_0.8fr_1.2fr_auto] md:items-end">
        <label className="block text-[12px] font-medium text-brown">
          Type
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={`${inputCls} mt-1`}>
            <option value="block-day">Bloquer une journée</option>
            <option value="block-slot">Bloquer un créneau</option>
            <option value="open">Ajouter un créneau</option>
          </select>
        </label>
        <label className="block text-[12px] font-medium text-brown">
          Date
          <input type="date" min={todayParis()} value={day} onChange={(e) => setDay(e.target.value)} className={`${inputCls} mt-1`} />
        </label>
        <label className={`block text-[12px] font-medium text-brown ${needsTime ? '' : 'opacity-40'}`}>
          Heure
          <input type="time" step={300} disabled={!needsTime} value={time} onChange={(e) => setTime(e.target.value)} className={`${inputCls} mt-1`} />
        </label>
        <label className="block text-[12px] font-medium text-brown">
          Séance
          <select value={offer} onChange={(e) => setOffer(e.target.value)} className={`${inputCls} mt-1`}>
            <option value={ALL}>Toutes les séances</option>
            {OFFERS.map((o) => (
              <option key={o.slug} value={o.slug}>{o.label}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={add} disabled={!canAdd} className={btnCls}>
          <Plus size={14} /> Ajouter
        </button>
        <label className="block text-[12px] font-medium text-brown md:col-span-5">
          Note (facultatif, visible uniquement ici)
          <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="Ex. vacances, salon professionnel…" className={`${inputCls} mt-1`} />
        </label>
      </div>

      {dates.length ? (
        <ul className="divide-y divide-sand/60 rounded-[14px] border border-sand/70">
          {dates.map((d, i) => (
            <li key={`${d.day}-${d.start_time}-${d.offer_slug}-${i}`} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
              {d.kind === 'block' ? (
                <Badge tone="red"><CalendarOff size={12} className="mr-1 inline" aria-hidden />Indisponible</Badge>
              ) : (
                <Badge tone="green"><CalendarPlus size={12} className="mr-1 inline" aria-hidden />Créneau en plus</Badge>
              )}
              <span className="text-[13.5px] font-medium text-espresso first-letter:uppercase">{dateOnly.format(new Date(`${d.day}T00:00:00Z`))}</span>
              <span className="text-[13px] text-brown">{d.start_time ? `à ${fmtT(d.start_time)}` : 'toute la journée'}</span>
              <span className="text-[12.5px] text-brown">· {offerLabel(d.offer_slug)}</span>
              {d.note && <span className="text-[12.5px] italic text-brown">· {d.note}</span>}
              <button
                type="button"
                aria-label="Supprimer"
                onClick={() => onChange(dates.filter((_, j) => j !== i))}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-brown hover:bg-nude hover:text-espresso"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Aucune date ponctuelle à venir.</Empty>
      )}
    </div>
  );
}

/* ───────── Aperçu : ce que voient les visiteurs (après enregistrement) ───────── */
function Preview({ savedKey }: { savedKey: string }) {
  const [offer, setOffer] = useState<string>(OFFERS[0].slug);
  const [slots, setSlots] = useState<Date[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    const from = new Date();
    const to = new Date(from.getTime() + 92 * 86400000);
    supabase
      .rpc('lc_get_available_slots', { p_offer_slug: offer, p_from: from.toISOString(), p_to: to.toISOString() })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = Array.isArray(data) ? (data as (string | { lc_get_available_slots: string })[]) : [];
        setSlots(rows.map((r) => new Date(typeof r === 'string' ? r : r.lc_get_available_slots)));
      });
    return () => {
      cancelled = true;
    };
  }, [offer, savedKey]);

  const byDay = useMemo(() => {
    const m = new Map<string, Date[]>();
    for (const s of slots ?? []) {
      const k = dayLong.format(s);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return [...m.entries()].slice(0, 10);
  }, [slots]);

  return (
    <Card
      title="Aperçu des créneaux proposés sur le site"
      action={
        <select value={offer} onChange={(e) => setOffer(e.target.value)} className="rounded-full border border-sand bg-white-warm px-3 py-1.5 text-[12.5px] text-espresso focus:border-caramel focus:outline-none" aria-label="Séance">
          {OFFERS.map((o) => (
            <option key={o.slug} value={o.slug}>{o.label}</option>
          ))}
        </select>
      }
    >
      {slots === null ? (
        <p className="flex items-center gap-2 text-[13px] text-brown"><Loader2 size={14} className="animate-spin" /> Chargement…</p>
      ) : byDay.length ? (
        <>
          <ul className="space-y-2">
            {byDay.map(([label, list]) => (
              <li key={label} className="flex flex-wrap items-center gap-2">
                <span className="w-[190px] text-[13px] font-medium text-espresso first-letter:uppercase">{label}</span>
                {list.map((s) => (
                  <span key={s.toISOString()} className="rounded-full border border-sand bg-white-warm px-2.5 py-0.5 text-[12.5px] text-espresso">{timeShort.format(s)}</span>
                ))}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11.5px] text-brown">
            {slots.length} créneau{slots.length > 1 ? 'x' : ''} libre{slots.length > 1 ? 's' : ''} au total (heure de Paris). Les créneaux déjà réservés n’apparaissent pas. L’aperçu se met à jour après « Enregistrer ».
          </p>
        </>
      ) : (
        <Empty>Aucun créneau proposé pour cette séance avec les réglages enregistrés.</Empty>
      )}
    </Card>
  );
}
