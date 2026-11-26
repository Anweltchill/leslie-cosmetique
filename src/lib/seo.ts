import { useEffect } from 'react';
import { site } from '@/data/site';

interface SeoOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
}

const ensure = (selector: string, create: () => HTMLMetaElement | HTMLLinkElement) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el as HTMLMetaElement;
};

export function useSeo({ title, description, path, image }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title === site.name ? `${site.name} — Cosmétique naturelle` : `${title} | ${site.name}`;
    document.title = fullTitle;
    const url = `${site.url}${path}`;
    const img = `${site.url}${image ?? '/og-image.webp'}`;

    const meta = (attr: 'name' | 'property', key: string, content: string) => {
      ensure(`meta[${attr}="${key}"]`, () => {
        const m = document.createElement('meta');
        m.setAttribute(attr, key);
        return m;
      }).setAttribute('content', content);
    };

    meta('name', 'description', description);
    meta('property', 'og:type', 'website');
    meta('property', 'og:site_name', site.name);
    meta('property', 'og:title', fullTitle);
    meta('property', 'og:description', description);
    meta('property', 'og:url', url);
    meta('property', 'og:image', img);
    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:title', fullTitle);
    meta('name', 'twitter:description', description);
    meta('name', 'twitter:image', img);

    const canonical = ensure('link[rel="canonical"]', () => {
      const l = document.createElement('link');
      l.rel = 'canonical';
      return l;
    });
    canonical.setAttribute('href', url);
  }, [title, description, path, image]);
}

export function injectJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: site.name,
    founder: { '@type': 'Person', name: site.founder },
    description:
      'Formations et guides en formulation cosmétique naturelle, coachings personnalisés : formulation, lancement de marque et audit d’orientation.',
    url: site.url,
    email: site.email,
    image: `${site.url}/og-image.webp`,
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/** Données structurées propres à une page (remplacées à chaque changement, retirées en quittant la page). */
export function useJsonLd(id: string, data: Record<string, unknown> | null) {
  const json = data ? JSON.stringify(data) : '';
  useEffect(() => {
    if (!json) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.ld = id;
    script.textContent = json;
    document.head.appendChild(script);
    return () => script.remove();
  }, [id, json]);
}

/** Page à ne pas référencer (paiement, confirmation). */
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}
