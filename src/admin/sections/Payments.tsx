import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { visibleOffers } from '@/data/offers';
import { rpc, type Payment, type Payments as PaymentsData } from '../api';
import { Badge, Card, Chart, Empty, Kpi, Split } from '../ui';
import { btnCls, btnGhostCls, euros, fmtDate, inputCls, num } from '../format';

const STATUS: Record<Payment['status'], { label: string; tone: 'green' | 'gold' | 'red' | 'grey' }> = {
  paid: { label: 'Payé', tone: 'green' },
  pending: { label: 'En attente', tone: 'gold' },
  refunded: { label: 'Remboursé', tone: 'grey' },
  failed: { label: 'Échoué', tone: 'red' },
};
const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

export function Payments() {
  const [data, setData] = useState<PaymentsData | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await rpc<PaymentsData>('lc_admin_payments'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="text-[14px] text-[#9b3b2a]">{error}</p>;
  if (!data) return <p className="flex items-center gap-2 text-[14px] text-brown"><Loader2 size={16} className="animate-spin" /> Chargement…</p>;

  // Projection : rythme du mois en cours appliqué au mois entier.
  const start = new Date(data.month_start).getTime();
  const end = new Date(data.month_end).getTime();
  const elapsed = Math.min(1, Math.max(0.03, (Date.now() - start) / (end - start)));
  const projection = Math.round(data.month_cents / elapsed / 100) * 100;
  const avg = data.sales ? Math.round(data.total_cents / data.sales) : 0;
  const delta = data.prev_month_cents ? Math.round(((data.month_cents - data.prev_month_cents) / data.prev_month_cents) * 100) : null;

  const setStatus = async (p: Payment, status: Payment['status']) => {
    await rpc('lc_admin_update_payment', { p_id: p.id, p_status: status });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">Paiements & chiffre d’affaires</h1>
        <button type="button" onClick={() => setAdding((a) => !a)} className={btnCls}>
          {adding ? <X size={15} aria-hidden /> : <Plus size={15} aria-hidden />} {adding ? 'Fermer' : 'Ajouter un paiement'}
        </button>
      </div>
      <p className="rounded-[14px] border border-sand/70 bg-cream px-4 py-3 text-[13px] text-brown">
        Les paiements par carte (Stripe) s’ajoutent ici automatiquement, avec le nom et l’e-mail de la cliente. Vous pouvez aussi saisir à la main un paiement reçu autrement (virement, espèces…).
      </p>
      {adding && <AddPayment onDone={() => { setAdding(false); void load(); }} />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi tone="dark" label="CA ce mois-ci" value={euros(data.month_cents)} hint={`${num(data.month_sales)} vente${data.month_sales > 1 ? 's' : ''}${delta !== null ? ` · ${delta >= 0 ? '+' : ''}${delta} % vs mois dernier` : ''}`} />
        <Kpi label="Projection fin de mois" value={euros(projection)} hint="Au rythme actuel du mois" />
        <Kpi label="CA total encaissé" value={euros(data.total_cents)} hint={`${num(data.sales)} vente${data.sales > 1 ? 's' : ''} au total`} />
        <Kpi label="Panier moyen" value={data.sales ? euros(avg) : '—'} hint="CA total / nombre de ventes" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Chiffre d’affaires par mois">
          <Chart type="bars" format={euros} points={data.monthly.map((m) => ({ label: monthShort.format(new Date(m.month)), value: m.revenue_cents }))} />
        </Card>
        <Card title="Par offre">
          <Split format={euros} rows={data.by_offer.map((o) => ({ label: `${o.name} (${o.sales})`, value: o.revenue_cents }))} />
        </Card>
      </div>

      <Card title="Tous les paiements">
        {!data.rows.length ? (
          <Empty>Aucun paiement enregistré pour le moment.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-brown">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium">Offre</th>
                  <th className="pb-2 font-medium">Moyen</th>
                  <th className="pb-2 text-right font-medium">Montant</th>
                  <th className="pb-2 text-right font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/60">
                {data.rows.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3 text-brown">{fmtDate.format(new Date(p.paid_at))}</td>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-espresso">{p.customer_name || '—'}</p>
                      {p.customer_email && <p className="text-brown">{p.customer_email}</p>}
                    </td>
                    <td className="py-2.5 pr-3 text-espresso">{p.offer_name || '—'}{p.note && <p className="text-[12px] text-brown">{p.note}</p>}</td>
                    <td className="py-2.5 pr-3 text-brown">{p.provider === 'stripe' ? 'Stripe' : 'Manuel'}</td>
                    <td className="py-2.5 text-right font-medium tabular-nums text-espresso">{euros(p.amount_cents)}</td>
                    <td className="py-2.5 text-right">
                      {p.provider === 'manuel' ? (
                        <select
                          value={p.status}
                          onChange={(e) => void setStatus(p, e.target.value as Payment['status'])}
                          className="rounded-full border border-sand bg-white-warm px-2 py-1 text-[12px]"
                          aria-label="Statut du paiement"
                        >
                          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      ) : (
                        <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function AddPayment({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ offer: visibleOffers[0]?.slug ?? '', amount: String(visibleOffers[0]?.price ?? ''), name: '', email: '', date: new Date().toISOString().slice(0, 10), note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const cents = Math.round(Number(form.amount.replace(',', '.')) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return setError('Montant invalide.');
    setBusy(true);
    setError('');
    try {
      await rpc('lc_admin_add_payment', {
        p_offer_slug: form.offer,
        p_amount_cents: cents,
        p_customer_name: form.name.trim(),
        p_customer_email: form.email.trim(),
        p_paid_at: new Date(`${form.date}T12:00:00`).toISOString(),
        p_note: form.note.trim(),
      });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Nouveau paiement (saisie manuelle)">
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
        <label className="text-[12px] font-medium text-brown">
          Offre
          <select
            value={form.offer}
            onChange={(e) => {
              const o = visibleOffers.find((x) => x.slug === e.target.value);
              setForm({ ...form, offer: e.target.value, amount: o ? String(o.price) : form.amount });
            }}
            className={`${inputCls} mt-1`}
          >
            {visibleOffers.map((o) => <option key={o.slug} value={o.slug}>{o.shortName}</option>)}
          </select>
        </label>
        <label className="text-[12px] font-medium text-brown">
          Montant (€)
          <input required inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={`${inputCls} mt-1`} />
        </label>
        <label className="text-[12px] font-medium text-brown">
          Date
          <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`${inputCls} mt-1`} />
        </label>
        <label className="text-[12px] font-medium text-brown">
          Nom du client
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputCls} mt-1`} />
        </label>
        <label className="text-[12px] font-medium text-brown">
          E-mail du client
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${inputCls} mt-1`} />
        </label>
        <label className="text-[12px] font-medium text-brown">
          Note (moyen de paiement…)
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={`${inputCls} mt-1`} />
        </label>
        <div className="flex items-center gap-3 md:col-span-3">
          <button type="submit" disabled={busy} className={btnCls}>{busy && <Loader2 size={14} className="animate-spin" />} Enregistrer le paiement</button>
          <button type="button" onClick={onDone} className={btnGhostCls}>Annuler</button>
          {error && <span className="text-[13px] text-[#9b3b2a]">{error}</span>}
        </div>
      </form>
    </Card>
  );
}
