import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Check, Copy, Loader2, LogOut, RefreshCw, Send } from 'lucide-react';
import { calendarFeedUrl, EMAIL_LABEL, rpc, type MailSettings } from '../api';
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

      <MailCard />

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

const STATUS_TXT: Record<string, { label: string; cls: string }> = {
  sent: { label: 'envoyé', cls: 'text-[#3f6b3a]' },
  queued: { label: 'en attente', cls: 'text-[#7a4f12]' },
  sending: { label: 'en cours', cls: 'text-[#7a4f12]' },
  failed: { label: 'échec', cls: 'text-[#9b3b2a]' },
  skipped: { label: 'non envoyé', cls: 'text-brown' },
};
const sentFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-2.5 text-[13.5px] text-espresso">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 accent-[#3a2a22]" />
      <span>
        {label}
        {hint && <span className="block text-[12px] text-brown">{hint}</span>}
      </span>
    </label>
  );
}

/** E-mails automatiques : réglages, aperçu et suivi des derniers envois. */
function MailCard() {
  const [cfg, setCfg] = useState<MailSettings | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [previewTo, setPreviewTo] = useState('');
  const [previewMsg, setPreviewMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () =>
    rpc<MailSettings>('lc_admin_mail_settings')
      .then(setCfg)
      .catch((e: Error) => /could not find the function/i.test(e.message) && setMissing(true));
  useEffect(() => {
    void load();
  }, []);

  if (missing) {
    return (
      <Card title="E-mails automatiques">
        <p className="text-[13.5px] text-brown">La mise à jour de la base qui active les e-mails automatiques n’est pas encore installée.</p>
      </Card>
    );
  }
  if (!cfg) {
    return (
      <Card title="E-mails automatiques">
        <p className="flex items-center gap-2 text-[13px] text-brown"><Loader2 size={14} className="animate-spin" /> Chargement…</p>
      </Card>
    );
  }

  const set = (patch: Partial<MailSettings>) => setCfg({ ...cfg, ...patch });
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await rpc('lc_admin_save_mail_settings', {
        p_enabled: cfg.enabled,
        p_notify_to: cfg.notify_to.trim(),
        p_notify_bookings: cfg.notify_bookings,
        p_notify_sales: cfg.notify_sales,
        p_reminders: cfg.reminders,
        p_meet_url: cfg.meet_url.trim(),
      });
      setMsg({ ok: true, text: 'Réglages enregistrés.' });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };
  const preview = async (e: FormEvent) => {
    e.preventDefault();
    setPreviewMsg(null);
    try {
      const r = await rpc<{ count: number }>('lc_admin_mail_preview', { p_to: previewTo.trim() });
      setPreviewMsg({ ok: true, text: `${r.count} e-mails d’aperçu en route vers ${previewTo.trim()} (arrivée sous une minute, pensez aux spams).` });
      setTimeout(() => void load(), 15000);
    } catch (err) {
      setPreviewMsg({ ok: false, text: (err as Error).message });
    }
  };

  return (
    <Card title="E-mails automatiques">
      <p className="text-[13.5px] leading-relaxed text-espresso">
        Les clientes reçoivent automatiquement : le récapitulatif de leur réservation (avec les moyens de paiement), la confirmation avec le
        lien de la visio quand vous cliquez sur « Confirmer », un rappel la veille, les changements d’horaire ou annulations, le reçu de
        paiement de la séance et le lien de téléchargement de leur guide. Leurs réponses arrivent sur l’adresse ci-dessous.
      </p>
      <form onSubmit={save} className="mt-4 grid max-w-[560px] gap-3.5">
        <Toggle checked={cfg.enabled} onChange={(v) => set({ enabled: v })} label="E-mails automatiques activés" hint="Décochez pour tout suspendre (aucun e-mail ne part, ni aux clientes ni à vous)." />
        <label className="text-[12px] font-medium text-brown">
          Votre adresse (alertes et réponses des clientes)
          <input type="email" required value={cfg.notify_to} onChange={(e) => set({ notify_to: e.target.value })} className={`${inputCls} mt-1`} />
        </label>
        <label className="text-[12px] font-medium text-brown">
          Lien de visio par défaut (proposé à chaque confirmation)
          <input value={cfg.meet_url} onChange={(e) => set({ meet_url: e.target.value })} placeholder="https://meet.google.com/…" inputMode="url" className={`${inputCls} mt-1`} />
          <span className="mt-1 block font-normal text-brown/80">Facultatif : un lien Google Meet permanent, modifiable rendez-vous par rendez-vous.</span>
        </label>
        <Toggle checked={cfg.notify_bookings} onChange={(v) => set({ notify_bookings: v })} label="Me prévenir à chaque nouvelle réservation" />
        <Toggle checked={cfg.notify_sales} onChange={(v) => set({ notify_sales: v })} label="Me prévenir à chaque vente en ligne (guides, séances)" />
        <Toggle checked={cfg.reminders} onChange={(v) => set({ reminders: v })} label="Rappel automatique aux clientes avant le rendez-vous" hint="Envoyé dans les 24 h qui précèdent une séance confirmée." />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy} className={btnCls}>{busy && <Loader2 size={14} className="animate-spin" />} Enregistrer</button>
          {msg && <span className={`text-[13px] ${msg.ok ? 'text-[#3f6b3a]' : 'text-[#9b3b2a]'}`}>{msg.text}</span>}
        </div>
      </form>

      <form onSubmit={preview} className="mt-6 max-w-[560px] border-t border-sand/60 pt-4">
        <p className="text-[13.5px] font-medium text-espresso">Voir les e-mails</p>
        <p className="mt-0.5 text-[12.5px] text-brown">Recevez un exemplaire de chaque e-mail (avec une cliente fictive) pour voir ce que reçoivent vos clientes.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input type="email" required value={previewTo} onChange={(e) => setPreviewTo(e.target.value)} placeholder="votre@adresse.com" aria-label="Adresse pour l’aperçu" className={`${inputCls} min-w-0 flex-1`} />
          <button type="submit" className={btnGhostCls}><Send size={14} /> Envoyer l’aperçu</button>
        </div>
        {previewMsg && <p className={`mt-2 text-[12.5px] ${previewMsg.ok ? 'text-[#3f6b3a]' : 'text-[#9b3b2a]'}`}>{previewMsg.text}</p>}
      </form>

      <div className="mt-6 border-t border-sand/60 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13.5px] font-medium text-espresso">Derniers envois</p>
          <button type="button" onClick={() => void load()} className="text-[12px] font-medium text-espresso underline">Actualiser</button>
        </div>
        {cfg.recent.length ? (
          <ul className="mt-2 divide-y divide-sand/50 text-[12.5px]">
            {cfg.recent.map((r, i) => (
              <li key={i} className="py-1.5">
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-medium text-espresso">{EMAIL_LABEL[r.kind] ?? r.kind}</span>
                  <span className="text-brown">→ {r.to_email}</span>
                  <span className={STATUS_TXT[r.status]?.cls}>· {STATUS_TXT[r.status]?.label ?? r.status}</span>
                  <span className="ml-auto text-brown/80">{sentFmt.format(new Date(r.sent_at ?? r.created_at))}</span>
                </div>
                {r.status === 'failed' && r.error && (
                  <p className="mt-0.5 flex items-start gap-1 text-[11.5px] text-[#9b3b2a]"><AlertCircle size={12} className="mt-0.5 shrink-0" /> {r.error}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[12.5px] text-brown">Aucun e-mail envoyé pour l’instant.</p>
        )}
      </div>
    </Card>
  );
}
