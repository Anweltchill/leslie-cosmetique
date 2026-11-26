import { useCallback, useEffect, useState } from 'react';
import { Download, Eye, FileText, Loader2, RefreshCw } from 'lucide-react';
import { getOffer } from '@/data/offers';
import { Link } from '@/lib/router';
import { fetchGuides, type GuideFile } from '../api';
import { Card, Empty } from '../ui';
import { btnCls, btnGhostCls, euros } from '../format';

const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
const mo = (bytes: number) => `${(bytes / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;

/** Les PDF vendus sur le site : les relire ou les télécharger (liens privés valables 1 heure). */
export function Guides() {
  const [guides, setGuides] = useState<GuideFile[] | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setGuides(await fetchGuides());
      setLoadedAt(Date.now());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Les liens expirent au bout d'une heure : on les renouvelle avant.
  useEffect(() => {
    if (!loadedAt) return;
    const t = window.setTimeout(() => void load(), 50 * 60 * 1000);
    return () => window.clearTimeout(t);
  }, [loadedAt, load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif-lc text-[30px] leading-tight text-espresso">Guides</h1>
        <button type="button" onClick={() => void load()} className={btnGhostCls}><RefreshCw size={14} /> Actualiser</button>
      </div>
      <p className="max-w-[760px] text-[13.5px] leading-relaxed text-brown">
        Les fichiers PDF exactement tels que vos clientes les reçoivent après leur achat. Relisez-les ou téléchargez-les quand vous voulez.
      </p>

      {error && <p className="text-[14px] text-[#9b3b2a]">{error}</p>}

      {!guides ? (
        !error && <p className="flex items-center gap-2 text-[14px] text-brown"><Loader2 size={16} className="animate-spin" /> Chargement…</p>
      ) : guides.length === 0 ? (
        <Empty>Aucun guide n’est en vente pour l’instant.</Empty>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {guides.map((g) => {
            const offer = getOffer(g.slug);
            return (
              <Card key={g.slug} className="flex min-w-0 flex-col">
                <div className="flex gap-4">
                  {offer?.image ? (
                    <img src={offer.image} alt="" className="h-[92px] w-[92px] shrink-0 rounded-[12px] object-cover" />
                  ) : (
                    <span className="flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-[12px] bg-nude text-brown"><FileText size={28} /></span>
                  )}
                  <div className="min-w-0">
                    <p className="font-serif-lc text-[20px] leading-tight text-espresso">{offer?.shortName ?? g.name}</p>
                    <p className="mt-1 text-[13px] text-brown">{euros(g.price_cents)} · PDF{g.size ? ` · ${mo(g.size)}` : ''}</p>
                    {g.updated_at && <p className="mt-0.5 text-[12px] text-brown/80">Fichier mis à jour le {dayFmt.format(new Date(g.updated_at))}</p>}
                    <p className="mt-0.5 truncate text-[12px] text-brown/80" title={g.file_name}>{g.file_name}</p>
                  </div>
                </div>
                {g.view_url && g.download_url ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href={g.view_url} target="_blank" rel="noopener noreferrer" className={btnCls}><Eye size={14} /> Lire le guide</a>
                    <a href={g.download_url} className={btnGhostCls}><Download size={14} /> Télécharger</a>
                  </div>
                ) : (
                  <p className="mt-4 text-[13px] text-[#9b3b2a]">Fichier introuvable : prévenez votre prestataire.</p>
                )}
                {g.size && g.size > 30 * 1048576 && (
                  <p className="mt-2 text-[12px] text-brown">Fichier volumineux : l’ouverture peut prendre un moment sur téléphone.</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card title="Envoyer un guide à une cliente">
        <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-espresso">
          <li><strong>Paiement par carte</strong> : la cliente reçoit son guide automatiquement par e-mail, rien à faire.</li>
          <li>
            <strong>Paiement Mobile Money</strong> : dans <Link to="/admin/paiements" className="underline">Paiements</Link> → « Ajouter un paiement », choisissez le guide,
            indiquez l’e-mail de la cliente et laissez cochée « Envoyer automatiquement le guide par e-mail ».
          </li>
          <li>
            <strong>Lien perdu ou expiré</strong> : dans <Link to="/admin/emails" className="underline">E-mails</Link>, retrouvez l’e-mail « Lien du guide » de la cliente et
            cliquez sur « Renvoyer » : un nouveau lien valable 7 jours lui est envoyé.
          </li>
        </ul>
        <p className="mt-3 text-[12px] text-brown">Les liens « Lire » et « Télécharger » de cette page sont privés et valables 1 heure : ne les partagez pas.</p>
      </Card>
    </div>
  );
}
