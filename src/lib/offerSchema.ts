import { site } from '@/data/site';
import { offerPath, type Offer } from '@/data/offers';

const minutes = (duration?: string) => {
  if (!duration) return undefined;
  const h = duration.match(/(\d+)\s*h/);
  const m = duration.match(/(\d+)\s*min/);
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0) || undefined;
};

/** Données structurées schema.org d'une offre (prix, durée, dates de session). */
export function offerJsonLd(o: Offer, enrollmentOpen = true): Record<string, unknown> {
  const url = `${site.url}${offerPath(o)}`;
  const provider = { '@type': 'Organization', name: site.name, url: site.url };
  const description = o.hook ?? o.tagline;
  const image = `${site.url}${o.image}`;
  const baseOffer: Record<string, unknown> = {
    '@type': 'Offer',
    price: o.price,
    priceCurrency: 'EUR',
    url,
  };

  if (o.enrollment) {
    const e = o.enrollment;
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: o.name,
      description,
      image,
      url,
      inLanguage: 'fr',
      provider,
      offers: {
        ...baseOffer,
        category: 'Paid',
        availability: enrollmentOpen ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
        validThrough: e.closesAt,
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        startDate: e.startDate,
        endDate: e.endDate,
        courseSchedule: {
          '@type': 'Schedule',
          startDate: e.startDate,
          endDate: e.endDate,
          repeatFrequency: 'Daily',
          repeatCount: 3,
          duration: `PT${e.hoursPerDay}H`,
        },
        location: { '@type': 'VirtualLocation', url },
      },
    };
  }

  if (o.kind === 'formation') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: o.name,
      description,
      image,
      url,
      brand: { '@type': 'Brand', name: site.name },
      offers: { ...baseOffer, availability: 'https://schema.org/InStock' },
    };
  }

  const mins = minutes(o.duration);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: o.name,
    description,
    image,
    url,
    provider,
    areaServed: 'Francophonie',
    offers: {
      ...baseOffer,
      ...(mins ? { eligibleDuration: { '@type': 'QuantitativeValue', value: mins, unitCode: 'MIN' } } : {}),
    },
  };
}
