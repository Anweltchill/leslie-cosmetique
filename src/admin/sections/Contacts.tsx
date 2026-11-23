import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import { rpc, type Contact } from '../api';
import { Card, Empty } from '../ui';
import { btnGhostCls, euros, fmtDate, inputCls, num } from '../format';

function toCsv(rows: Contact[]) {
  const esc = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Nom', 'E-mail', 'Téléphone', 'Réservations', 'Questions', 'Paiements', 'Total (€)', 'Premier contact', 'Dernière activité'];
  const lines = rows.map((c) =>
    [c.name, c.email, c.phone, c.bookings, c.questions, c.payments, (c.total_cents / 100).toFixed(2).replace('.', ','), fmtDate.format(new Date(c.first_at)), fmtDate.format(new Date(c.last_at))]
      .map(esc)
      .join(';'),
  );
  return '﻿' + [head.map(esc).join(';'), ...lines].join('\r\n');
}

export function Contacts() {
  const [rows, setRows] = useState<Contact[] | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    rpc<Contact[]>('lc_admin_contacts').then(setRows).catch((e: Error) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter((c) => !s || `${c.name ?? ''} ${c.email} ${c.phone ?? ''}`.toLowerCase().includes(s));
  }, [rows, q]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `contacts-leslie-cosmetique-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">Contacts</h1>
        <button type="button" onClick={exportCsv} disabled={!filtered.length} className={btnGhostCls}>
          <Download size={15} aria-hidden /> Exporter (Excel / CSV)
        </button>
      </div>
      <p className="text-[13px] text-brown">Toutes les personnes ayant réservé, posé une question ou payé, regroupées par adresse e-mail.</p>
      {error && <p className="text-[14px] text-[#9b3b2a]">{error}</p>}
      <Card>
        <label className="relative mb-4 block max-w-[360px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom, un e-mail, un téléphone…" className={`${inputCls} pl-9`} aria-label="Rechercher un contact" />
        </label>
        {!rows ? (
          <p className="flex items-center gap-2 text-[14px] text-brown"><Loader2 size={16} className="animate-spin" /> Chargement…</p>
        ) : !filtered.length ? (
          <Empty>{rows.length ? 'Aucun contact ne correspond à la recherche.' : 'Aucun contact pour le moment. Ils apparaîtront dès la première réservation, question ou vente.'}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-brown">
                  <th className="pb-2 font-medium">Contact</th>
                  <th className="pb-2 font-medium">Téléphone</th>
                  <th className="pb-2 text-right font-medium">Réserv.</th>
                  <th className="pb-2 text-right font-medium">Questions</th>
                  <th className="pb-2 text-right font-medium">Achats</th>
                  <th className="pb-2 text-right font-medium">Total payé</th>
                  <th className="pb-2 text-right font-medium">Dernière activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/60">
                {filtered.map((c) => (
                  <tr key={c.email}>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-espresso">{c.name || '—'}</p>
                      <a href={`mailto:${c.email}`} className="text-brown hover:text-espresso">{c.email}</a>
                    </td>
                    <td className="py-2.5 pr-3 text-espresso">{c.phone ? <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a> : '—'}</td>
                    <td className="py-2.5 text-right tabular-nums">{num(c.bookings)}</td>
                    <td className="py-2.5 text-right tabular-nums">{num(c.questions)}</td>
                    <td className="py-2.5 text-right tabular-nums">{num(c.payments)}</td>
                    <td className="py-2.5 text-right font-medium tabular-nums">{euros(c.total_cents)}</td>
                    <td className="py-2.5 text-right text-brown">{fmtDate.format(new Date(c.last_at))}</td>
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
