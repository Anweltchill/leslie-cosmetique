import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/lib/router';
import { setAttribution, track } from '@/lib/track';

/** Liens toujours disponibles, même si la base n'a pas encore la table des liens de suivi. */
const BUILT_IN: Record<string, { source: string; destination: string }> = {
  insta: { source: 'instagram', destination: '/' },
  instagram: { source: 'instagram', destination: '/' },
  tiktok: { source: 'tiktok', destination: '/' },
  facebook: { source: 'facebook', destination: '/' },
  whatsapp: { source: 'whatsapp', destination: '/' },
};

/**
 * Lien de suivi : leslie.phoenixpro.fr/l/<code>.
 * Mémorise la source (Instagram, TikTok…) puis redirige vers la page prévue, sans que la visiteuse ne voie rien.
 */
export function LinkPage({ code }: { code: string }) {
  const { navigate } = useRouter();

  useEffect(() => {
    let done = false;
    const slug = code.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    const go = (source: string, destination: string) => {
      if (done) return;
      done = true;
      setAttribution(source, slug);
      track('link_visit', { path: `/l/${slug}`, name: slug });
      const dest = /^\/[A-Za-z0-9/_-]*$/.test(destination) ? destination : '/';
      navigate(dest + window.location.search.replace(/^\?$/, ''), { replace: true });
    };
    const fallback = () => {
      const b = BUILT_IN[slug];
      go(b?.source ?? slug, b?.destination ?? '/');
    };
    const timer = window.setTimeout(fallback, 2500);
    supabase
      .rpc('lc_resolve_link', { p_code: slug })
      .then(({ data, error }) => {
        window.clearTimeout(timer);
        const link = data as { source: string; destination: string } | null;
        if (!error && link?.destination) go(link.source, link.destination);
        else fallback();
      }, () => {
        window.clearTimeout(timer);
        fallback();
      });
    return () => window.clearTimeout(timer);
  }, [code, navigate]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-cream">
      <Loader2 size={22} className="animate-spin text-caramel" aria-label="Chargement" />
    </div>
  );
}
