import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getOffer } from '@/data/offers';
import { rpc, type Overview as OverviewData } from '../api';
import { Card, Chart, Kpi, Split } from '../ui';
import { euros, fmtDay, num } from '../format';

const PERIODS = [
  { id: '7', label: '7 jours', days: 7 },
  { id: '30', label: '30 jours', days: 30 },
  { id: '90', label: '3 mois', days: 90 },
  { id: '365', label: '12 mois', days: 365 },
] as const;

const METRICS = [
  { id: 'visitors', label: 'Visiteurs' },
  { id: 'page_views', label: 'Pages vues' },
  { id: 'offer_clicks', label: 'Intérêt pour les offres' },
  { id: 'bookings', label: 'Réservations' },
  { id: 'questions', label: 'Questions' },
  { id: 'revenue_cents', label: 'Chiffre d’affaires' },
] as const;
type MetricId = (typeof METRICS)[number]['id'];

const DEVICE_LABEL: Record<string, string> = { mobile: 'Mobile', tablet: 'Tablette', desktop: 'Ordinateur', inconnu: 'Inconnu' };
const PAGE_LABEL: Record<string, string> = {
  '/': 'Accueil',
  '/formations': 'Formations',
  '/coachings': 'Coachings',
  '/a-propos': 'À propos',
  '/contact': 'Contact',
  '/reserver': 'Réservation',
};

function pageLabel(path: string) {
  if (PAGE_LABEL[path]) return PAGE_LABEL[path];
  const m = /^\/(offres|reserver)\/(.+)$/.exec(path);
  const offer = m ? getOffer(m[2]) : undefined;
  if (offer) return m![1] === 'offres' ? `Offre : ${offer.shortName}` : `Réservation : ${offer.shortName}`;
  return path;
}

function range(days: number) {
  const to = new Date();
  to.setHours(24, 0, 0, 0); // fin de journée
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { from, to };
}

export function Overview() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(PERIODS[1]);
  const [metric, setMetric] = useState<MetricId>('visitors');
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    const { from, to } = range(period.days);
    rpc<OverviewData>('lc_admin_overview', { p_from: from.toISOString(), p_to: to.toISOString() })
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [period]);

  const points = useMemo(
    () => (data?.daily ?? []).map((d) => ({ label: fmtDay.format(new Date(`${d.day}T12:00:00`)), value: d[metric] })),
    [data, metric],
  );

  if (error) return <p className="text-[14px] text-[#9b3b2a]">{error}</p>;
  if (!data) return <p className="flex items-center gap-2 text-[14px] text-brown"><Loader2 size={16} className="animate-spin" /> Chargement…</p>;

  const conversions = data.bookings + data.sales;
  const rate = data.visitors ? `${((conversions / data.visitors) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : '—';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">Vue d’ensemble</h1>
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi tone="dark" label="Visiteurs uniques" value={num(data.visitors)} hint={`${num(data.visits)} visites · ${num(data.page_views)} pages vues`} />
        <Kpi label="Vues des offres" value={num(data.offer_views)} hint={`${num(data.offer_clicks)} clics sur les cartes d’offres`} />
        <Kpi label="Clics d’achat / réservation" value={num(data.buy_clicks)} hint="Boutons « Obtenir », « Je m’inscris », « Réserver »" />
        <Kpi label="Questions posées" value={num(data.questions)} hint="Via la bulle « Une question ? »" />
        <Kpi label="Réservations" value={num(data.bookings)} hint="Demandes envoyées via le calendrier" />
        <Kpi label="Ventes" value={num(data.sales)} hint="Paiements encaissés" />
        <Kpi label="Chiffre d’affaires" value={euros(data.revenue_cents)} hint={`Sur ${period.label}`} />
        <Kpi label="Taux de conversion" value={rate} hint="(réservations + ventes) / visiteurs" />
      </div>

      <Card
        title="Évolution"
        action={
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricId)}
            className="rounded-full border border-sand bg-white-warm px-3 py-1.5 text-[12.5px] text-espresso focus:border-caramel focus:outline-none"
            aria-label="Indicateur affiché"
          >
            {METRICS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        }
      >
        <Chart points={points} format={metric === 'revenue_cents' ? euros : num} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Offres les plus regardées">
          {data.top_offers.length ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-brown">
                  <th className="pb-2 font-medium">Offre</th>
                  <th className="pb-2 text-right font-medium">Vues</th>
                  <th className="pb-2 text-right font-medium">Clics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/60">
                {data.top_offers.map((o) => (
                  <tr key={o.slug}>
                    <td className="py-2 pr-3 text-espresso">{o.name}</td>
                    <td className="py-2 text-right tabular-nums text-espresso">{num(o.views)}</td>
                    <td className="py-2 text-right tabular-nums text-espresso">{num(o.clicks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Split rows={[]} />
          )}
        </Card>
        <Card title="D’où viennent les visiteurs">
          <Split rows={data.sources.map((s) => ({ label: s.source, value: s.visitors }))} />
        </Card>
        <Card title="Pages les plus vues">
          <Split rows={data.top_pages.map((p) => ({ label: pageLabel(p.path), value: p.views }))} />
        </Card>
        <Card title="Appareils">
          <Split rows={data.devices.map((d) => ({ label: DEVICE_LABEL[d.device] ?? d.device, value: d.visitors }))} />
        </Card>
      </div>
      <p className="text-[12px] text-brown">
        Mesure d’audience anonyme (sans cookie publicitaire). Les visites des robots, des personnes ayant activé « Ne pas me suivre » et de l’espace admin ne sont pas comptées.
      </p>
    </div>
  );
}
