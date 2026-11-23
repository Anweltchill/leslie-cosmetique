import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { rpc, type Question, type QuestionStatus } from '../api';
import { Badge, Card, Empty } from '../ui';
import { btnCls, btnGhostCls, fmtDateTime, inputCls } from '../format';

const STATUS: Record<QuestionStatus, { label: string; tone: 'gold' | 'dark' | 'green' | 'grey' }> = {
  new: { label: 'Nouvelle', tone: 'gold' },
  in_progress: { label: 'En cours', tone: 'dark' },
  answered: { label: 'Répondue', tone: 'green' },
  archived: { label: 'Archivée', tone: 'grey' },
};
const FILTERS: { id: QuestionStatus | 'open' | 'all'; label: string }[] = [
  { id: 'open', label: 'À traiter' },
  { id: 'answered', label: 'Répondues' },
  { id: 'archived', label: 'Archivées' },
  { id: 'all', label: 'Toutes' },
];

export function Support({ onChange }: { onChange?: () => void }) {
  const [rows, setRows] = useState<Question[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setRows(await rpc<Question[]>('lc_admin_questions'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const list = useMemo(
    () => (rows ?? []).filter((q) => (filter === 'all' ? true : filter === 'open' ? q.status === 'new' || q.status === 'in_progress' : q.status === filter)),
    [rows, filter],
  );
  const count = (id: (typeof FILTERS)[number]['id']) =>
    (rows ?? []).filter((q) => (id === 'all' ? true : id === 'open' ? q.status === 'new' || q.status === 'in_progress' : q.status === id)).length;
  const selected = (rows ?? []).find((q) => q.id === selectedId) ?? null;

  const update = async (q: Question, status: QuestionStatus | null, note: string | null) => {
    await rpc('lc_admin_update_question', { p_id: q.id, p_status: status, p_note: note });
    await load();
    onChange?.();
  };

  return (
    <div className="space-y-5">
      <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">Support</h1>
      <p className="text-[13px] text-brown">Les questions posées depuis la bulle « Une question ? » du site.</p>
      {error && <p className="text-[14px] text-[#9b3b2a]">{error}</p>}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtre">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${filter === f.id ? 'bg-espresso text-white-warm' : 'border border-sand text-espresso hover:bg-nude'}`}
          >
            {f.label} {rows && <span className="opacity-70">({count(f.id)})</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          {!rows ? (
            <p className="flex items-center gap-2 text-[14px] text-brown"><Loader2 size={16} className="animate-spin" /> Chargement…</p>
          ) : !list.length ? (
            <Empty>Aucune question ici pour le moment.</Empty>
          ) : (
            <ul className="divide-y divide-sand/60">
              {list.map((q) => (
                <li key={q.id}>
                  <button type="button" onClick={() => setSelectedId(q.id)} className={`w-full rounded-[10px] px-2 py-3 text-left transition-colors ${selectedId === q.id ? 'bg-cream' : 'hover:bg-cream/60'}`}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-medium text-espresso">{q.full_name}</span>
                      <Badge tone={STATUS[q.status].tone}>{STATUS[q.status].label}</Badge>
                    </span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-brown">{q.message}</span>
                    <span className="mt-0.5 block text-[11.5px] text-brown/80 first-letter:uppercase">{fmtDateTime.format(new Date(q.created_at))}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>{selected ? <QuestionDetail key={selected.id} q={selected} onUpdate={update} /> : <Empty>Sélectionnez une question pour la lire et y répondre.</Empty>}</Card>
      </div>
    </div>
  );
}

function QuestionDetail({ q, onUpdate }: { q: Question; onUpdate: (q: Question, s: QuestionStatus | null, n: string | null) => Promise<void> }) {
  const [note, setNote] = useState(q.admin_note);
  const [busy, setBusy] = useState(false);
  const act = async (s: QuestionStatus | null, n: string | null) => {
    setBusy(true);
    try {
      await onUpdate(q, s, n);
    } finally {
      setBusy(false);
    }
  };
  const quoted = q.message.split('\n').map((l) => `> ${l}`).join('\n');
  const mailto = `mailto:${q.email}?subject=${encodeURIComponent('Votre question — Leslie Cosmétique')}&body=${encodeURIComponent(`Bonjour ${q.full_name},\n\n\n\n${quoted}`)}`;

  return (
    <div className="space-y-3 text-[13.5px] text-espresso">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-serif-lc text-[20px] leading-tight">{q.full_name}</p>
          <p className="text-brown">{q.email}</p>
        </div>
        <Badge tone={STATUS[q.status].tone}>{STATUS[q.status].label}</Badge>
      </div>
      <p className="text-[12px] text-brown first-letter:uppercase">
        {fmtDateTime.format(new Date(q.created_at))}{q.page ? ` · depuis la page ${q.page}` : ''}
      </p>
      <p className="whitespace-pre-wrap rounded-[12px] bg-cream p-3.5 leading-relaxed">{q.message}</p>
      <div className="flex flex-wrap gap-2">
        <a href={mailto} onClick={() => q.status === 'new' && act('in_progress', null)} className={btnCls}>
          <Mail size={14} aria-hidden /> Répondre par e-mail
        </a>
        {q.status !== 'answered' && <button type="button" disabled={busy} onClick={() => act('answered', null)} className={btnGhostCls}>Marquer comme répondue</button>}
        {q.status !== 'archived' && <button type="button" disabled={busy} onClick={() => act('archived', null)} className={btnGhostCls}>Archiver</button>}
        {(q.status === 'answered' || q.status === 'archived') && <button type="button" disabled={busy} onClick={() => act('in_progress', null)} className={btnGhostCls}>Rouvrir</button>}
      </div>
      <label className="block text-[12px] font-medium text-brown">
        Note interne
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} mt-1 resize-none`} maxLength={3000} />
      </label>
      <button type="button" disabled={busy || note === q.admin_note} onClick={() => act(null, note)} className={btnGhostCls}>Enregistrer la note</button>
    </div>
  );
}
