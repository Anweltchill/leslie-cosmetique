import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, AlertTriangle, Archive, Check, Copy, CreditCard, Link2, Loader2, MessageCircle, Plus, Smartphone, Sparkles } from 'lucide-react';
import { site } from '@/data/site';
import { visibleOffers, offerPath } from '@/data/offers';
import { rpc } from '../api';
import { Card, Empty, Kpi } from '../ui';
import { btnCls, euros, inputCls, num } from '../format';

/* ───────── Types renvoyés par lc_admin_funnel / lc_admin_links ───────── */
type StepKey = 'visit' | 'offer' | 'intent' | 'choice' | 'method' | 'checkout' | 'paid';
interface Funnel {
  steps: { key: StepKey; visitors: number }[];
  methods: { card: number; mobile: number; checkout: number; paid: number; sales: number; revenue_cents: number };
  booking: { select_offer: number; slot: number; submit: number; pay_open: number; paid: number };
  by_offer: { slug: string; name: string; viewers: number; intents: number; choosers: number; mobile: number; checkouts: number; sales: number; revenue_cents: number }[];
  by_source: { source: string; label: string; visitors: number; offer_viewers: number; intents: number; choosers: number; checkouts: number; sales: number; revenue_cents: number }[];
  by_device: { device: string; visitors: number; intents: number; checkouts: number }[];
  daily: { day: string; instagram: number; tiktok: number; other: number }[];
}
interface TrackedLink {
  code: string; name: string; source: string; destination: string; archived: boolean; created_at: string;
  clicks: number; visitors: number; offer_viewers: number; intents: number; checkouts: number; sales: number; revenue_cents: number;
}

const PERIODS = [
  { id: '7', label: '7 jours', days: 7 },
  { id: '30', label: '30 jours', days: 30 },
  { id: '90', label: '3 mois', days: 90 },
  { id: '365', label: '12 mois', days: 365 },
] as const;

const STEPS: Record<StepKey, { label: string; hint: string; advice: string }> = {
  visit: { label: 'Visite du site', hint: 'Personnes arrivées sur le site', advice: '' },
  offer: {
    label: 'A consulté une offre',
    hint: 'Page d’un guide ou d’un coaching ouverte',
    advice: 'Peu de visiteuses ouvrent une offre : mettez les offres plus en avant (lien direct vers une offre dans la bio, stories avec lien vers le guide).',
  },
  intent: {
    label: 'A cliqué pour acheter / réserver',
    hint: '« Obtenir le guide », choix d’une séance…',
    advice: 'Les visiteuses regardent les offres mais ne cliquent pas : retravaillez le prix affiché, les visuels, les avis et les bénéfices concrets en haut de page.',
  },
  choice: {
    label: 'A ouvert le paiement',
    hint: 'Fenêtre « Comment souhaitez-vous payer ? »',
    advice: 'Beaucoup commencent sans aller jusqu’au paiement : pour les séances, le calendrier ou le formulaire freine peut-être (peu de créneaux, trop de champs).',
  },
  method: {
    label: 'A choisi un moyen de paiement',
    hint: 'Carte bancaire ou Mobile Money',
    advice: 'La fenêtre de paiement s’ouvre mais aucun moyen n’est choisi : hésitation sur le prix, ou moyen de paiement attendu absent.',
  },
  checkout: {
    label: 'Page de paiement Stripe ouverte',
    hint: 'Choix « carte bancaire »',
    advice: '',
  },
  paid: {
    label: 'Paiement par carte réussi',
    hint: 'Vente encaissée (Stripe)',
    advice: 'Des paiements par carte sont abandonnés sur la page Stripe : carte refusée, paiement 3D Secure non validé, ou hésitation au dernier moment.',
  },
};

const SOURCE_OPTIONS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'E-mail / newsletter' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'autre', label: 'Autre' },
];
const SOURCE_COLOR: Record<string, string> = { instagram: '#C13584', tiktok: '#111111', facebook: '#1877F2', whatsapp: '#1f8f4e', google: '#4285F4', direct: '#96633F' };
const DEVICE_LABEL: Record<string, string> = { mobile: 'Mobile', tablet: 'Tablette', desktop: 'Ordinateur', inconnu: 'Inconnu' };

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const fmtPct = (v: number) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const linkUrl = (code: string) => `${site.url}/l/${code}`;

const DESTINATIONS = [
  { path: '/', label: 'Accueil' },
  { path: '/formations', label: 'Formations et guides' },
  { path: '/coachings', label: 'Coachings' },
  ...visibleOffers.map((o) => ({ path: offerPath(o), label: `Offre : ${o.shortName}` })),
  { path: '/reserver', label: 'Réserver un appel' },
];
const destLabel = (p: string) => DESTINATIONS.find((d) => d.path === p)?.label ?? p;

function range(days: number) {
  const to = new Date();
  to.setHours(24, 0, 0, 0);
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { from, to };
}

export function Acquisition() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(PERIODS[1]);
  const [source, setSource] = useState('');
  const [data, setData] = useState<Funnel | null>(null);
  const [links, setLinks] = useState<TrackedLink[] | null>(null);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const { from, to } = range(period.days);
    try {
      const [f, l] = await Promise.all([
        rpc<Funnel>('lc_admin_funnel', { p_from: from.toISOString(), p_to: to.toISOString(), p_source: source }),
        rpc<TrackedLink[]>('lc_admin_links', { p_from: from.toISOString(), p_to: to.toISOString() }),
      ]);
      setData(f);
      setLinks(l);
    } catch (e) {
      const msg = (e as Error).message;
      if (/could not find the function/i.test(msg)) setMissing(true);
      else setError(msg);
    }
  }, [period, source]);

  useEffect(() => {
    void load();
  }, [load]);

  if (missing) {
    return (
      <div className="space-y-5">
        <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">Acquisition</h1>
        <Card>
          <p className="flex items-start gap-2 text-[13.5px] leading-relaxed text-espresso">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-caramel" aria-hidden />
            Le suivi Instagram / TikTok et le tunnel de conversion ne sont pas encore activés dans la base de données. Ils apparaîtront ici dès que le script de mise à jour aura été exécuté.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">Acquisition</h1>
          <p className="text-[13px] text-brown">D’où viennent les visiteuses, et où elles s’arrêtent avant d’acheter.</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Période">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                period.id === p.id ? 'bg-espresso text-white-warm' : 'border border-sand text-espresso hover:bg-nude'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-[14px] text-[#9b3b2a]">{error}</p>}
      {!data ? (
        <p className="flex items-center gap-2 text-[14px] text-brown"><Loader2 size={16} className="animate-spin" /> Chargement…</p>
      ) : (
        <>
          <SourceFilter data={data} source={source} onChange={setSource} />
          <Kpis data={data} />
          <FunnelCard data={data} sourceLabel={data.by_source.find((s) => s.source === source)?.label} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <SourcesCard data={data} active={source} onPick={setSource} />
            <PaymentCard data={data} />
          </div>
          <LinksCard links={links ?? []} onChange={load} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2">
            <DailyCard data={data} />
            <BookingCard data={data} />
          </div>
          <OffersCard data={data} />
          <DevicesCard data={data} />
          <p className="text-[12px] leading-relaxed text-brown">
            Chaque visiteuse est comptée une fois par étape (identifiant anonyme, sans cookie publicitaire). La source est mémorisée 30 jours : une personne venue d’Instagram qui revient plus tard en tapant l’adresse reste attribuée à Instagram. Les ventes Mobile Money se règlent sur WhatsApp et ne remontent pas automatiquement : saisissez-les dans Paiements.
          </p>
        </>
      )}
    </div>
  );
}

/* ───────── Filtre par source ───────── */
function SourceFilter({ data, source, onChange }: { data: Funnel; source: string; onChange: (s: string) => void }) {
  const options = data.by_source.filter((s) => s.source !== 'inconnu');
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Source">
      <span className="mr-1 text-[12px] font-medium uppercase tracking-[0.14em] text-brown">Source</span>
      {[{ source: '', label: 'Toutes' }, ...options].map((s) => (
        <button
          key={s.source || 'all'}
          type="button"
          onClick={() => onChange(s.source)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
            source === s.source ? 'bg-espresso text-white-warm' : 'border border-sand bg-white-warm text-espresso hover:bg-nude'
          }`}
        >
          {s.source && <span className="h-2 w-2 rounded-full" style={{ background: SOURCE_COLOR[s.source] ?? '#B58B6A' }} aria-hidden />}
          {s.label}
        </button>
      ))}
    </div>
  );
}

/* ───────── Indicateurs clés ───────── */
function Kpis({ data }: { data: Funnel }) {
  const visit = data.steps[0]?.visitors ?? 0;
  const abandoned = Math.max(0, data.methods.checkout - data.methods.paid);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Kpi tone="dark" label="Visiteuses" value={num(visit)} hint="Sur la période et la source choisies" />
      <Kpi label="Ventes par carte" value={num(data.methods.sales)} hint={euros(data.methods.revenue_cents)} />
      <Kpi label="Taux de conversion" value={fmtPct(pct(data.methods.paid, visit))} hint="Visiteuses → paiement réussi" />
      <Kpi label="Paiements carte abandonnés" value={num(abandoned)} hint="Page Stripe ouverte, sans paiement" />
      <Kpi label="Demandes Mobile Money" value={num(data.methods.mobile)} hint="Redirigées vers WhatsApp" />
    </div>
  );
}

/* ───────── Tunnel de conversion ───────── */
function FunnelCard({ data, sourceLabel }: { data: Funnel; sourceLabel?: string }) {
  const steps = data.steps;
  const top = Math.max(1, steps[0]?.visitors ?? 0);
  // Plus forte perte entre deux étapes (hors « page Stripe », qui dépend du choix carte / Mobile Money)
  const leak = useMemo(() => {
    let best: { i: number; lost: number; rate: number } | null = null;
    for (let i = 1; i < steps.length; i++) {
      if (steps[i].key === 'checkout') continue;
      const prev = steps[i].key === 'paid' ? steps.find((s) => s.key === 'checkout')! : steps[i - 1];
      if (prev.visitors < 3) continue;
      const lost = prev.visitors - steps[i].visitors;
      const rate = lost / prev.visitors;
      if (lost > 0 && (!best || rate > best.rate)) best = { i, lost, rate };
    }
    return best;
  }, [steps]);

  return (
    <Card title={`Tunnel de conversion${sourceLabel ? ` · ${sourceLabel}` : ''}`}>
      <ol className="space-y-2.5">
        {steps.map((s, i) => {
          const prev = i === 0 ? null : s.key === 'paid' ? steps.find((x) => x.key === 'checkout')! : steps[i - 1];
          const keep = prev ? pct(s.visitors, prev.visitors) : 100;
          const width = Math.max(2, (s.visitors / top) * 100);
          const isLeak = leak?.i === i;
          return (
            <li key={s.key} className="grid gap-1.5 md:grid-cols-[230px_minmax(0,1fr)_200px] md:items-center md:gap-4">
              <div>
                <p className="text-[13.5px] font-medium text-espresso">
                  <span className="mr-1.5 text-caramel">{i + 1}.</span>
                  {STEPS[s.key].label}
                </p>
                <p className="text-[11.5px] text-brown">{STEPS[s.key].hint}</p>
              </div>
              <div className="relative h-9 overflow-hidden rounded-[10px] bg-cream">
                <div
                  className={`flex h-full items-center rounded-[10px] px-3 text-[13px] font-semibold transition-all duration-500 ${isLeak ? 'bg-[#c8873e] text-white-warm' : i === steps.length - 1 ? 'bg-[#3f6b3a] text-white-warm' : 'bg-espresso text-white-warm'}`}
                  style={{ width: `${width}%`, minWidth: '3.2rem' }}
                >
                  {num(s.visitors)}
                </div>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap text-[12px] md:justify-end">
                {prev ? (
                  <>
                    <span className="font-medium text-espresso">{fmtPct(keep)}</span>
                    <span className="text-brown">{s.key === 'paid' ? 'de la page Stripe' : 'de l’étape précédente'}</span>
                  </>
                ) : (
                  <span className="text-brown">Point de départ</span>
                )}
                {isLeak && <AlertTriangle size={14} className="shrink-0 text-[#c8873e]" aria-label="Point de blocage" />}
              </div>
            </li>
          );
        })}
      </ol>
      {leak ? (
        <div className="mt-5 flex gap-3 rounded-[14px] border border-[#e6c79a] bg-[#fbf1e2] p-4">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-[#c8873e]" aria-hidden />
          <div className="text-[13px] leading-relaxed text-espresso">
            <p className="font-medium">
              Principal point de blocage : « {STEPS[steps[leak.i].key].label} ». {num(leak.lost)} visiteuse{leak.lost > 1 ? 's' : ''} ({fmtPct(Math.round(leak.rate * 1000) / 10)}) s’arrête{leak.lost > 1 ? 'nt' : ''} à cette étape.
            </p>
            {STEPS[steps[leak.i].key].advice && <p className="mt-1 text-brown">{STEPS[steps[leak.i].key].advice}</p>}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[12.5px] text-brown">Pas encore assez de visites pour repérer un point de blocage fiable.</p>
      )}
    </Card>
  );
}

/* ───────── Sources ───────── */
function SourcesCard({ data, active, onPick }: { data: Funnel; active: string; onPick: (s: string) => void }) {
  const rows = data.by_source;
  const max = Math.max(1, ...rows.map((r) => r.visitors));
  return (
    <Card title="Résultats par source">
      {rows.length ? (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-brown">
                <th className="px-1 pb-2 font-medium">Source</th>
                <th className="px-1 pb-2 text-right font-medium">Visiteuses</th>
                <th className="px-1 pb-2 text-right font-medium">Offres vues</th>
                <th className="px-1 pb-2 text-right font-medium">Intention</th>
                <th className="px-1 pb-2 text-right font-medium">Ventes</th>
                <th className="px-1 pb-2 text-right font-medium">CA</th>
                <th className="px-1 pb-2 text-right font-medium">Conv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/60">
              {rows.map((r) => (
                <tr key={r.source} className={active === r.source ? 'bg-nude/60' : ''}>
                  <td className="px-1 py-2">
                    <button type="button" onClick={() => onPick(active === r.source ? '' : r.source)} className="group flex w-full items-center gap-2 text-left">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SOURCE_COLOR[r.source] ?? '#B58B6A' }} aria-hidden />
                      <span className="flex-1">
                        <span className="font-medium text-espresso group-hover:underline">{r.label === 'inconnu' ? 'Inconnue (ventes avant le suivi)' : r.label}</span>
                        <span className="mt-1 block h-1 rounded-full bg-sand/50">
                          <span className="block h-1 rounded-full" style={{ width: `${(r.visitors / max) * 100}%`, background: SOURCE_COLOR[r.source] ?? '#B58B6A' }} />
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-1 py-2 text-right tabular-nums">{num(r.visitors)}</td>
                  <td className="px-1 py-2 text-right tabular-nums">{num(r.offer_viewers)}</td>
                  <td className="px-1 py-2 text-right tabular-nums">{num(r.intents)}</td>
                  <td className="px-1 py-2 text-right tabular-nums font-medium">{num(r.sales)}</td>
                  <td className="px-1 py-2 text-right tabular-nums">{euros(r.revenue_cents)}</td>
                  <td className="px-1 py-2 text-right tabular-nums text-caramel">{r.visitors ? fmtPct(pct(r.sales, r.visitors)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Pas encore de visites sur cette période.</Empty>
      )}
      <p className="mt-3 text-[11.5px] text-brown">Cliquez sur une source pour afficher son tunnel de conversion.</p>
    </Card>
  );
}

/* ───────── Moyens de paiement ───────── */
function PaymentCard({ data }: { data: Funnel }) {
  const m = data.methods;
  const total = m.card + m.mobile;
  const abandoned = Math.max(0, m.checkout - m.paid);
  return (
    <Card title="Moyens de paiement">
      {total ? (
        <>
          <div className="flex h-3 overflow-hidden rounded-full bg-sand/50" aria-hidden>
            <div className="bg-espresso" style={{ width: `${pct(m.card, total)}%` }} />
            <div className="bg-[#1f8f4e]" style={{ width: `${pct(m.mobile, total)}%` }} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[14px] border border-sand/70 p-4">
              <p className="flex items-center gap-2 text-[13px] font-medium text-espresso"><CreditCard size={15} aria-hidden /> Carte bancaire</p>
              <p className="mt-2 font-serif-lc text-[28px] leading-none text-espresso">{num(m.card)}</p>
              <p className="text-[11.5px] text-brown">{fmtPct(pct(m.card, total))} des choix</p>
              <ul className="mt-3 space-y-1 text-[12.5px] text-espresso">
                <li className="flex justify-between"><span className="text-brown">Page Stripe ouverte</span>{num(m.checkout)}</li>
                <li className="flex justify-between"><span className="text-brown">Paiement réussi</span><span className="font-medium text-[#3f6b3a]">{num(m.paid)}</span></li>
                <li className="flex justify-between"><span className="text-brown">Abandon sur Stripe</span><span className={abandoned ? 'font-medium text-[#9b3b2a]' : ''}>{num(abandoned)}</span></li>
              </ul>
            </div>
            <div className="rounded-[14px] border border-sand/70 p-4">
              <p className="flex items-center gap-2 text-[13px] font-medium text-espresso"><Smartphone size={15} aria-hidden /> Mobile Money</p>
              <p className="mt-2 font-serif-lc text-[28px] leading-none text-espresso">{num(m.mobile)}</p>
              <p className="text-[11.5px] text-brown">{fmtPct(pct(m.mobile, total))} des choix</p>
              <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-snug text-brown">
                <MessageCircle size={13} className="mt-0.5 shrink-0 text-[#1f8f4e]" aria-hidden />
                Conversations WhatsApp ouvertes. Pensez à saisir ces ventes dans Paiements une fois réglées.
              </p>
            </div>
          </div>
        </>
      ) : (
        <Empty>Aucun moyen de paiement choisi sur cette période.</Empty>
      )}
    </Card>
  );
}

/* ───────── Liens de suivi ───────── */
function LinksCard({ links, onChange }: { links: TrackedLink[]; onChange: () => Promise<void> | void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [source, setSource] = useState('instagram');
  const [dest, setDest] = useState('/');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const effectiveCode = codeTouched ? code : slugify(name);
  const active = links.filter((l) => !l.archived);
  const archived = links.filter((l) => l.archived);

  const copy = async (c: string) => {
    try {
      await navigator.clipboard.writeText(linkUrl(c));
      setCopied(c);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      window.prompt('Copiez le lien :', linkUrl(c));
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(effectiveCode)) {
      setError('Code : 2 à 40 caractères, lettres minuscules, chiffres et tirets.');
      return;
    }
    if (links.some((l) => l.code === effectiveCode && !l.archived)) {
      setError('Ce code existe déjà. Choisissez-en un autre.');
      return;
    }
    setBusy(true);
    try {
      await rpc('lc_admin_save_link', { p_code: effectiveCode, p_name: name.trim() || effectiveCode, p_source: source, p_destination: dest });
      setName('');
      setCode('');
      setCodeTouched(false);
      await onChange();
      void copy(effectiveCode);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const archive = async (c: string) => {
    if (!window.confirm(`Désactiver le lien ${linkUrl(c)} ? Il redirigera vers l’accueil.`)) return;
    await rpc('lc_admin_archive_link', { p_code: c });
    await onChange();
  };

  return (
    <Card title="Liens de suivi (Instagram, TikTok…)">
      <p className="-mt-1 mb-4 text-[12.5px] leading-relaxed text-brown">
        Mettez ces liens dans votre bio, vos stories ou vos descriptions : chaque visite, clic et vente est rattaché au lien utilisé. Créez un lien par usage (bio Instagram, story du jour, vidéo TikTok…) pour savoir ce qui vend le mieux.
      </p>

      {active.length ? (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-brown">
                <th className="px-1 pb-2 font-medium">Lien</th>
                <th className="px-1 pb-2 text-right font-medium">Clics</th>
                <th className="px-1 pb-2 text-right font-medium">Visiteuses</th>
                <th className="px-1 pb-2 text-right font-medium">Intention</th>
                <th className="px-1 pb-2 text-right font-medium">Ventes</th>
                <th className="px-1 pb-2 text-right font-medium">CA</th>
                <th className="px-1 pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/60">
              {active.map((l) => (
                <tr key={l.code}>
                  <td className="px-1 py-2.5">
                    <p className="flex items-center gap-2 font-medium text-espresso">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SOURCE_COLOR[l.source] ?? '#B58B6A' }} aria-hidden />
                      {l.name || l.code}
                    </p>
                    <p className="mt-0.5 text-[12px] text-brown">
                      <span className="font-mono text-[11.5px] text-caramel">{linkUrl(l.code).replace(/^https:\/\//, '')}</span> → {destLabel(l.destination)}
                    </p>
                  </td>
                  <td className="px-1 py-2.5 text-right tabular-nums">{num(l.clicks)}</td>
                  <td className="px-1 py-2.5 text-right tabular-nums">{num(l.visitors)}</td>
                  <td className="px-1 py-2.5 text-right tabular-nums">{num(l.intents)}</td>
                  <td className="px-1 py-2.5 text-right tabular-nums font-medium">{num(l.sales)}</td>
                  <td className="px-1 py-2.5 text-right tabular-nums">{euros(l.revenue_cents)}</td>
                  <td className="px-1 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => copy(l.code)} className="inline-flex items-center gap-1 rounded-full border border-sand px-2.5 py-1 text-[12px] font-medium text-espresso hover:bg-nude">
                        {copied === l.code ? <Check size={12} /> : <Copy size={12} />} {copied === l.code ? 'Copié' : 'Copier'}
                      </button>
                      <button type="button" onClick={() => archive(l.code)} aria-label={`Désactiver ${l.code}`} className="flex h-7 w-7 items-center justify-center rounded-full text-brown hover:bg-nude hover:text-espresso">
                        <Archive size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucun lien de suivi pour l’instant.</Empty>
      )}

      <form onSubmit={save} className="mt-5 grid gap-3 rounded-[14px] border border-sand/70 bg-cream/60 p-4 md:grid-cols-[1.4fr_1fr_1fr_1.3fr_auto] md:items-end">
        <label className="block text-[12px] font-medium text-brown">
          Nom du lien
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Ex. Story guide recettes" className={`${inputCls} mt-1`} />
        </label>
        <label className="block text-[12px] font-medium text-brown">
          Code (fin du lien)
          <input
            value={effectiveCode}
            onChange={(e) => {
              setCodeTouched(true);
              setCode(slugify(e.target.value));
            }}
            maxLength={40}
            placeholder="story-guide"
            className={`${inputCls} mt-1 font-mono`}
          />
        </label>
        <label className="block text-[12px] font-medium text-brown">
          Réseau
          <select value={source} onChange={(e) => setSource(e.target.value)} className={`${inputCls} mt-1`}>
            {SOURCE_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-[12px] font-medium text-brown">
          Page d’arrivée
          <select value={dest} onChange={(e) => setDest(e.target.value)} className={`${inputCls} mt-1`}>
            {DESTINATIONS.map((d) => (
              <option key={d.path} value={d.path}>{d.label}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy || !effectiveCode} className={btnCls}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Créer
        </button>
        <p className="flex flex-wrap items-center gap-1.5 text-[12px] text-brown md:col-span-5">
          <Link2 size={13} aria-hidden /> Lien obtenu : <span className="font-mono text-[11.5px] text-espresso">{linkUrl(effectiveCode || 'code')}</span>
        </p>
        {error && <p className="text-[12.5px] text-[#9b3b2a] md:col-span-5">{error}</p>}
      </form>

      {archived.length > 0 && (
        <div className="mt-4">
          <button type="button" onClick={() => setShowArchived((v) => !v)} className="text-[12px] text-brown underline-offset-2 hover:underline">
            {showArchived ? 'Masquer' : 'Voir'} les liens désactivés ({archived.length})
          </button>
          {showArchived && (
            <ul className="mt-2 space-y-1 text-[12.5px] text-brown">
              {archived.map((l) => (
                <li key={l.code}>
                  {l.name || l.code} · <span className="font-mono">/l/{l.code}</span> · {num(l.clicks)} clics, {num(l.sales)} vente{l.sales > 1 ? 's' : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

/* ───────── Évolution Instagram / TikTok ───────── */
function DailyCard({ data }: { data: Funnel }) {
  const series = [
    { key: 'instagram', label: 'Instagram', color: SOURCE_COLOR.instagram },
    { key: 'tiktok', label: 'TikTok', color: SOURCE_COLOR.tiktok },
    { key: 'other', label: 'Autres sources', color: '#B58B6A' },
  ] as const;
  const days = data.daily;
  const max = Math.max(1, ...days.flatMap((d) => [d.instagram, d.tiktok, d.other]));
  const W = 600;
  const H = 170;
  const x = (i: number) => (days.length <= 1 ? W / 2 : 8 + (i * (W - 16)) / (days.length - 1));
  const y = (v: number) => 10 + (H - 34) * (1 - v / max);
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  const labelEvery = Math.max(1, Math.ceil(days.length / 6));
  return (
    <Card title="Visiteuses par jour et par réseau">
      <div className="mb-2 flex flex-wrap gap-3 text-[12px] text-brown">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full" style={{ background: s.color }} aria-hidden /> {s.label} ({num(days.reduce((t, d) => t + d[s.key], 0))})
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Visiteuses par jour : Instagram, TikTok et autres sources">
        {[0.5, 1].map((g) => (
          <line key={g} x1={8} x2={W - 8} y1={y(max * g)} y2={y(max * g)} stroke="#EADBC8" strokeWidth="1" />
        ))}
        {series.map((s) => (
          <path key={s.key} d={days.map((d, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(d[s.key])}`).join(' ')} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" />
        ))}
        {days.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.day} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#6B4A38">
              {fmt.format(new Date(`${d.day}T12:00:00`))}
            </text>
          ) : null,
        )}
      </svg>
    </Card>
  );
}

/* ───────── Réservations de séances ───────── */
function BookingCard({ data }: { data: Funnel }) {
  const b = data.booking;
  const rows = [
    { label: 'Séance choisie', value: b.select_offer },
    { label: 'Créneau choisi', value: b.slot },
    { label: 'Coordonnées envoyées', value: b.submit },
    { label: 'Paiement ouvert', value: b.pay_open },
    { label: 'Séance payée par carte', value: b.paid },
  ];
  const top = Math.max(1, b.select_offer);
  return (
    <Card title="Réservations de séances">
      {b.select_offer ? (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.label} className="grid grid-cols-[150px_1fr_52px] items-center gap-3 text-[12.5px]">
              <span className="text-espresso">{r.label}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-cream">
                <span className="block h-2.5 rounded-full bg-caramel" style={{ width: `${(r.value / top) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums text-espresso">
                {num(r.value)}
                {i > 0 && rows[i - 1].value > 0 && <span className="block text-[10.5px] text-brown">{fmtPct(pct(r.value, rows[i - 1].value))}</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Aucune réservation commencée sur cette période.</Empty>
      )}
    </Card>
  );
}

/* ───────── Offres ───────── */
function OffersCard({ data }: { data: Funnel }) {
  const rows = data.by_offer.filter((o) => o.name);
  return (
    <Card title="Tunnel par offre">
      {rows.length ? (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[680px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-brown">
                <th className="px-1 pb-2 font-medium">Offre</th>
                <th className="px-1 pb-2 text-right font-medium">Vues</th>
                <th className="px-1 pb-2 text-right font-medium">Intention</th>
                <th className="px-1 pb-2 text-right font-medium">Paiement ouvert</th>
                <th className="px-1 pb-2 text-right font-medium">Mobile Money</th>
                <th className="px-1 pb-2 text-right font-medium">Page Stripe</th>
                <th className="px-1 pb-2 text-right font-medium">Ventes</th>
                <th className="px-1 pb-2 text-right font-medium">CA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/60">
              {rows.map((o) => (
                <tr key={o.slug}>
                  <td className="px-1 py-2 text-espresso">{o.name}</td>
                  <td className="px-1 py-2 text-right tabular-nums">{num(o.viewers)}</td>
                  <td className="px-1 py-2 text-right tabular-nums">{num(o.intents)}</td>
                  <td className="px-1 py-2 text-right tabular-nums">{num(o.choosers)}</td>
                  <td className="px-1 py-2 text-right tabular-nums">{num(o.mobile)}</td>
                  <td className="px-1 py-2 text-right tabular-nums">{num(o.checkouts)}</td>
                  <td className="px-1 py-2 text-right tabular-nums font-medium">{num(o.sales)}</td>
                  <td className="px-1 py-2 text-right tabular-nums">{euros(o.revenue_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Aucune offre consultée sur cette période.</Empty>
      )}
    </Card>
  );
}

/* ───────── Appareils ───────── */
function DevicesCard({ data }: { data: Funnel }) {
  if (!data.by_device.length) return null;
  return (
    <Card title="Appareils">
      <div className="grid gap-3 sm:grid-cols-3">
        {data.by_device.map((d) => (
          <div key={d.device} className="rounded-[14px] border border-sand/70 p-4">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-brown">{DEVICE_LABEL[d.device] ?? d.device}</p>
            <p className="mt-1 font-serif-lc text-[26px] leading-none text-espresso">{num(d.visitors)}</p>
            <p className="mt-2 text-[12px] text-brown">
              {num(d.intents)} intention{d.intents > 1 ? 's' : ''} · {num(d.checkouts)} page{d.checkouts > 1 ? 's' : ''} Stripe
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
