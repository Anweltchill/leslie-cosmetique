import { useEffect, useState, type FormEvent } from 'react';
import { Check, Copy, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { calendarFeedUrl, rpc } from '../api';
import { Card } from '../ui';
import { btnCls, btnGhostCls, inputCls } from '../format';

export function Settings({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pwd, setPwd] = useState({ old: '', next: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    rpc<{ calendar_token: string }>('lc_admin_settings').then((s) => setToken(s.calendar_token)).catch(() => undefined);
  }, []);

  const feed = token ? calendarFeedUrl(token) : '';
  const webcal = feed.replace(/^https:/, 'webcal:');
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  const rotate = async () => {
    if (!window.confirm('Générer un nouveau lien ? L’ancien lien cessera de fonctionner dans les agendas où il a été ajouté.')) return;
    const r = await rpc<{ calendar_token: string }>('lc_admin_rotate_calendar_token');
    setToken(r.calendar_token);
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (pwd.next !== pwd.confirm) return setPwdMsg({ ok: false, text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
    setBusy(true);
    try {
      const r = await rpc<{ ok: boolean; error?: string }>('lc_admin_change_password', { p_old: pwd.old, p_new: pwd.next });
      setPwdMsg(r.ok ? { ok: true, text: 'Mot de passe modifié.' } : { ok: false, text: r.error ?? 'Échec.' });
      if (r.ok) setPwd({ old: '', next: '', confirm: '' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">Paramètres</h1>

      <Card title="Voir les rendez-vous dans votre agenda">
        <p className="text-[13.5px] leading-relaxed text-espresso">
          Abonnez votre agenda à ce lien : les réservations du site (à confirmer et confirmées) y apparaissent et se mettent à jour automatiquement.
        </p>
        {token ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input readOnly value={feed} className={`${inputCls} min-w-0 flex-1 font-mono text-[12px]`} aria-label="Lien d’abonnement à l’agenda" onFocus={(e) => e.target.select()} />
              <button type="button" onClick={copy} className={btnGhostCls}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copié' : 'Copier'}</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={google} target="_blank" rel="noopener noreferrer" className={btnCls}>Ajouter à Google Agenda</a>
              <a href={webcal} className={btnGhostCls}>Ajouter à Apple Calendrier (iPhone / Mac)</a>
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-[12.5px] text-brown">
              <li>Google Agenda met à jour les agendas abonnés toutes les quelques heures (délai fixé par Google).</li>
              <li>Ce lien est privé : ne le partagez pas. En cas de doute, générez-en un nouveau.</li>
            </ul>
            <button type="button" onClick={rotate} className={`${btnGhostCls} mt-3`}><RefreshCw size={14} /> Générer un nouveau lien</button>
          </>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-[13px] text-brown"><Loader2 size={14} className="animate-spin" /> Chargement…</p>
        )}
      </Card>

      <Card title="Mot de passe">
        <p className="mb-3 text-[13px] text-brown">Connecté en tant que <span className="font-medium text-espresso">{email}</span></p>
        <form onSubmit={changePassword} className="grid max-w-[420px] gap-3">
          <label className="text-[12px] font-medium text-brown">
            Mot de passe actuel
            <input required type="password" autoComplete="current-password" value={pwd.old} onChange={(e) => setPwd({ ...pwd, old: e.target.value })} className={`${inputCls} mt-1`} />
          </label>
          <label className="text-[12px] font-medium text-brown">
            Nouveau mot de passe (10 caractères minimum)
            <input required minLength={10} type="password" autoComplete="new-password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} className={`${inputCls} mt-1`} />
          </label>
          <label className="text-[12px] font-medium text-brown">
            Confirmer le nouveau mot de passe
            <input required minLength={10} type="password" autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} className={`${inputCls} mt-1`} />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className={btnCls}>Changer le mot de passe</button>
            {pwdMsg && <span className={`text-[13px] ${pwdMsg.ok ? 'text-[#3f6b3a]' : 'text-[#9b3b2a]'}`}>{pwdMsg.text}</span>}
          </div>
        </form>
      </Card>

      <button type="button" onClick={onLogout} className={btnGhostCls}><LogOut size={14} /> Se déconnecter</button>
    </div>
  );
}
