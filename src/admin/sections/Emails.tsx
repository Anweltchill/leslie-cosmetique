import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Check, Loader2, RefreshCw, RotateCcw, Search, Send, X } from 'lucide-react';
import { getOffer } from '@/data/offers';
import { Link } from '@/lib/router';
import { EMAIL_LABEL, rpc, type EmailRow, type EmailsData, type EmailStatus } from '../api';
import { Badge, Card, Empty } from '../ui';
import { btnCls, btnGhostCls, euros, inputCls } from '../format';

type Filter = 'all' | 'sent' | 'failed' | 'pending' | 'skipped';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'sent', label: 'Envoyés' },
  { key: 'failed', label: 'En erreur' },
  { key: 'pending', label: 'En attente' },
  { key: 'skipped', label: 'Non envoyés' },
];

const STATUS: Record<EmailStatus, { label: string; tone: 'green' | 'red' | 'gold' | 'grey' }> = {
  sent: { label: 'Envoyé', tone: 'green' },
  failed: { label: 'Erreur', tone: 'red' },
  queued: { label: 'En attente', tone: 'gold' },
  sending: { label: 'En cours', tone: 'gold' },
  skipped: { label: 'Non envoyé', tone: 'grey' },
};

const FOR_LESLIE = new Set(['booking_new', 'sale_new']);
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
const rdvFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

const label = (e: EmailRow) => (e.kind === 'preview' && e.preview_of ? `Aperçu · ${EMAIL_LABEL[e.preview_of]}` : EMAIL_LABEL[e.kind] ?? e.kind);

/** Ce qui explique un statut, en clair. */
function statusHelp(e: EmailRow) {
  if (e.status === 'failed') return e.error || 'Envoi refusé.';
  if (e.status === 'skipped') return e.error ? `Plus nécessaire : ${e.error}.` : 'Plus nécessaire.';
  if (e.status === 'queued' && e.error) return `Nouvel essai automatique prévu (${e.error}).`;
  return '';
}

export function Emails({ onChange }: { onChange?: () => void }) {
  const [filter, setFilter] = useState<Filter>(() => (new URLSearchParams(window.location.search).get('statut') as Filter) || 'all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<EmailsData | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<number>();

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await rpc<EmailsData>('lc_admin_emails', { p_status: filter, p_search: query || null, p_limit: 300 }));
    } catch (e) {
      setError(/could not find the function/i.test((e as Error).message) ? 'La mise à jour de la base pour cet onglet n’est pas encore installée.' : (e as Error).message);
    }
  }, [filter, query]);

  useEffect(() => {
    void load();
  }, [load]);

  // Tant qu'un e-mail est en attente, on rafraîchit la liste toute seule.
  useEffect(() => {
    window.clearTimeout(timer.current);
    if (data?.items.some((e) => e.status === 'queued' || e.status === 'sending')) {
      timer.current = window.setTimeout(() => void load(), 5000);
    }
    return () => window.clearTimeout(timer.current);
  }, [data, load]);

  const submitSearch = (ev: FormEvent) => {
    ev.preventDefault();
    setQuery(search.trim());
  };

  const afterResend = async () => {
    await load();
    onChange?.();
  };

  const c = data?.counts;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">E-mails</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/parametres" className={btnGhostCls}>Réglages des e-mails</Link>
          <button type="button" onClick={() => void load()} className={btnGhostCls}><RefreshCw size={14} /> Actualiser</button>
        </div>
      </div>
      <p className="max-w-[760px] text-[13.5px] leading-relaxed text-brown">
        Tous les e-mails envoyés par le site, à vos clientes et à vous. En cas d’erreur, la raison s’affiche en rouge : vous pouvez renvoyer
        l’e-mail, à la même adresse ou à une adresse corrigée.
      </p>

      {c && c.failed > 0 && filter !== 'failed' && (
        <button
          type="button"
          onClick={() => setFilter('failed')}
          className="flex w-full items-center gap-2 rounded-[14px] border border-[#e3b4a6] bg-[#f8e6e1] px-4 py-3 text-left text-[13.5px] text-[#9b3b2a]"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{c.failed} e-mail{c.failed > 1 ? 's' : ''} en erreur. Cliquez pour les voir et les renvoyer.</span>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const n = c ? c[f.key] : null;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                filter === f.key ? 'bg-espresso text-white-warm' : 'border border-sand text-espresso hover:bg-nude'
              } ${f.key === 'failed' && n ? (filter === f.key ? '' : 'border-[#e3b4a6] text-[#9b3b2a]') : ''}`}
            >
              {f.label}
              {n !== null && <span className="ml-1.5 opacity-70">{n}</span>}
            </button>
          );
        })}
        <form onSubmit={submitSearch} className="ml-auto flex min-w-0 flex-1 basis-[240px] items-center gap-2 sm:max-w-[340px]">
          <div className="relative min-w-0 flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, e-mail ou objet"
              aria-label="Rechercher un e-mail"
              className={`${inputCls} pl-8`}
            />
          </div>
          {query && (
            <button type="button" aria-label="Effacer la recherche" onClick={() => { setSearch(''); setQuery(''); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand hover:bg-nude">
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {error && <p className="text-[14px] text-[#9b3b2a]">{error}</p>}

      <Card className="min-w-0">
        {!data ? (
          !error && <p className="flex items-center gap-2 text-[14px] text-brown"><Loader2 size={16} className="animate-spin" /> Chargement…</p>
        ) : data.items.length === 0 ? (
          <Empty>{query ? 'Aucun e-mail ne correspond à cette recherche.' : filter === 'failed' ? 'Aucun e-mail en erreur.' : 'Aucun e-mail pour l’instant.'}</Empty>
        ) : (
          <ul className="divide-y divide-sand/60">
            {data.items.map((e) => (
              <EmailItem key={e.id} email={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} onResent={afterResend} />
            ))}
          </ul>
        )}
        {data && data.items.length >= 300 && <p className="mt-3 text-[12px] text-brown">Les 300 e-mails les plus récents sont affichés : utilisez la recherche pour retrouver un envoi plus ancien.</p>}
      </Card>
    </div>
  );
}

function EmailItem({ email: e, open, onToggle, onResent }: { email: EmailRow; open: boolean; onToggle: () => void; onResent: () => Promise<void> }) {
  const [to, setTo] = useState(e.to_email);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const st = STATUS[e.status];
  const help = statusHelp(e);
  const offer = e.offer_slug ? getOffer(e.offer_slug) : undefined;
  const canResend = e.status !== 'queued' && e.status !== 'sending';

  const resend = async (ev?: FormEvent) => {
    ev?.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await rpc<{ to: string }>('lc_admin_resend_email', { p_id: e.id, p_to: to.trim() === e.to_email ? null : to.trim() });
      setMsg({ ok: true, text: `Renvoyé à ${r.to} : l’envoi apparaît en haut de la liste.` });
      await onResent();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <div className="min-w-0 flex-1 basis-[260px]">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-medium text-espresso">
            {label(e)}
            <span className="text-[11px] font-normal uppercase tracking-[0.12em] text-brown/70">{FOR_LESLIE.has(e.kind) ? 'pour vous' : e.kind === 'preview' ? 'aperçu' : 'pour la cliente'}</span>
            {e.is_resend && <span className="text-[11px] font-normal text-caramel">· renvoi</span>}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-brown">
            → {e.to_email}
            {e.client_name && !FOR_LESLIE.has(e.kind) && e.kind !== 'preview' ? ` · ${e.client_name}` : ''}
            {e.client_name && FOR_LESLIE.has(e.kind) ? ` · cliente : ${e.client_name}` : ''}
          </p>
          {(offer || e.booking_starts_at || e.payment_cents) && (
            <p className="mt-0.5 text-[12px] text-brown/80">
              {offer?.shortName}
              {e.booking_starts_at ? ` · rendez-vous ${rdvFmt.format(new Date(e.booking_starts_at))}` : ''}
              {e.payment_cents ? ` · ${euros(e.payment_cents)}` : ''}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[12px] text-brown/80">{dateFmt.format(new Date(e.sent_at ?? e.created_at))}</span>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
      </div>

      {help && (
        <p className={`mt-1.5 flex items-start gap-1.5 text-[12.5px] ${e.status === 'failed' ? 'text-[#9b3b2a]' : 'text-brown'}`}>
          {e.status === 'failed' && <AlertCircle size={13} className="mt-0.5 shrink-0" />}
          <span>{help}{e.status === 'failed' && e.resent ? ' (déjà renvoyé)' : ''}</span>
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
        {e.subject && <span className="min-w-0 flex-1 truncate text-brown/80">Objet : {e.subject}</span>}
        {canResend && (
          <button type="button" onClick={onToggle} className="inline-flex items-center gap-1 font-medium text-espresso underline">
            <RotateCcw size={12} /> {e.status === 'failed' ? 'Renvoyer' : 'Renvoyer cet e-mail'}
          </button>
        )}
      </div>

      {open && canResend && (
        <form onSubmit={resend} className="mt-2.5 space-y-2.5 rounded-[12px] bg-cream p-3">
          <label className="block text-[12px] font-medium text-brown">
            Adresse (corrigez-la si la cliente s’est trompée)
            <input type="email" required value={to} onChange={(ev) => setTo(ev.target.value)} className={`${inputCls} mt-1`} />
          </label>
          {e.kind === 'guide_link' && <p className="text-[12px] text-brown">Un nouveau lien de téléchargement, valable 7 jours, est créé à l’envoi.</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={busy} className={btnCls}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Renvoyer</button>
            <button type="button" onClick={onToggle} className={btnGhostCls}>Annuler</button>
          </div>
          {msg && (
            <p className={`flex items-start gap-1.5 text-[12.5px] ${msg.ok ? 'text-[#3f6b3a]' : 'text-[#9b3b2a]'}`}>
              {msg.ok ? <Check size={13} className="mt-0.5 shrink-0" /> : <AlertCircle size={13} className="mt-0.5 shrink-0" />} {msg.text}
            </p>
          )}
        </form>
      )}
    </li>
  );
}
