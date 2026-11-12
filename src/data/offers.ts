import { site } from './site';

export type OfferKind = 'formation' | 'coaching';

export interface Offer {
  slug: string;
  kind: OfferKind;
  name: string;
  shortName: string;
  price: number;
  duration?: string;
  format: string;
  tagline: string;
  hook: string;
  paragraphs: string[];
  outcomes: string[];
  cta: string;
  link: string;
  image: string;
  imageAlt: string;
  badge?: string;
  faq: { q: string; a: string }[];
  related: string[];
}

export const offers: Offer[] = [
  {
    slug: 'formation-produits-capillaires',
    kind: 'formation',
    name: 'Formation Produits Capillaires',
    shortName: 'Produits Capillaires',
    price: 350,
    format: 'Cours pré-enregistrés + démonstrations pratiques, à ton rythme',
    tagline: 'Je veux apprendre à formuler mes propres soins capillaires.',
    hook: 'Apprends à formuler des soins capillaires cohérents, stables et adaptés à tes cheveux.',
    paragraphs: [
      "Apprends à concevoir tes produits capillaires de manière autonome : comprendre le rôle des ingrédients, construire une formule équilibrée, réaliser tes émulsions de type crèmes, laits, masques, après-shampoings, adapter tes soins aux différents besoins du cheveu et développer des produits cohérents et stables dans la durée.",
      "La formation est conçue pour te permettre d'avancer à ton rythme grâce à des cours pré-enregistrés et des démonstrations pratiques.",
    ],
    outcomes: [
      'Comprendre le rôle des ingrédients',
      'Construire une formule équilibrée',
      'Réaliser crèmes, laits, masques et après-shampoings',
      'Adapter tes soins aux besoins du cheveu',
      'Développer des produits stables dans la durée',
    ],
    cta: 'Accéder à la formation',
    link: site.links.payFormationCapillaire,
    image: '/offer-hair-training.webp',
    imageAlt: "Boucles naturelles hydratées d'une femme noire, avec un pot de masque capillaire crémeux",
    badge: 'La plus complète',
    faq: [
      { q: "Puis-je suivre la formation depuis l'Afrique ?", a: "Oui. La formation est 100 % en ligne et accessible depuis l'Afrique francophone comme depuis la diaspora." },
      { q: 'Faut-il un prérequis ?', a: site.faq.prerequis },
      { q: "Combien de temps ai-je accès à la formation ?", a: site.faq.acces },
    ],
    related: ['guide-formulation', 'coaching-conseils-capillaires'],
  },
  {
    slug: 'guide-formulation',
    kind: 'formation',
    name: 'Guide de formation sur la formulation',
    shortName: 'Guide de formulation',
    price: 48,
    format: 'Guide numérique',
    tagline: 'Je veux apprendre à formuler mes propres produits cosmétiques.',
    hook: 'Les connaissances essentielles de la formulation, réunies dans un guide clair et pratique.',
    paragraphs: [
      'Apprends à concevoir tes produits cosmétiques de manière autonome : comprendre le rôle des matières premières, connaître leurs dosages et leurs conditions d\'utilisation, construire des formules équilibrées et maîtriser les différentes techniques de formulation.',
      'À travers ce guide, découvre comment formuler des émulsions de type crèmes et laits, des produits nettoyants comme les shampoings et les gels douche, ainsi que des produits 100 % corps gras tels que les baumes.',
      "Ce guide a été conçu pour te transmettre les connaissances essentielles en formulation cosmétique et t'aider à développer tes propres produits de manière réfléchie et autonome.",
    ],
    outcomes: [
      'Comprendre le rôle des matières premières',
      'Connaître dosages et conditions d\'utilisation',
      'Formuler des émulsions (crèmes, laits)',
      'Formuler des nettoyants (shampoings, gels douche)',
      'Formuler des produits 100 % corps gras (baumes)',
    ],
    cta: 'Obtenir le guide',
    link: site.links.payGuide,
    image: '/offer-guide.webp',
    imageAlt: 'Guide de formulation ouvert sur une table en bois, avec balance de précision, bécher, beurre de karité et flacon d\'huile',
    faq: [
      { q: 'Le guide est-il accessible partout dans le monde ?', a: 'Oui, il est 100 % en ligne et accessible depuis toute la francophonie.' },
      { q: 'Quels sont les moyens de paiement ?', a: site.faq.paiement },
      { q: "Combien de temps ai-je accès au guide ?", a: site.faq.acces },
    ],
    related: ['formation-produits-capillaires', 'coaching-formulation'],
  },
  {
    slug: 'coaching-formulation',
    kind: 'coaching',
    name: 'Coaching Formulation',
    shortName: 'Formulation',
    price: 70,
    duration: '1 h',
    format: 'Coaching individuel en visio',
    tagline: "J'ai besoin d'être accompagnée dans mes formulations.",
    hook: 'Un regard de professionnelle sur tes formules, pour repartir avec des réponses concrètes.',
    paragraphs: [
      'Tu formules déjà tes produits, mais tu rencontres des difficultés ? Une texture qui ne correspond pas au résultat souhaité, une émulsion qui se déstabilise, des ingrédients difficiles à choisir ou simplement besoin d\'un regard de professionnelle sur ta formule ?',
      "Le coaching formulation est un accompagnement personnalisé pour t'aider à comprendre tes erreurs, améliorer tes formulations et gagner progressivement en autonomie.",
    ],
    outcomes: [
      'Comprendre tes erreurs de formulation',
      'Améliorer tes textures et émulsions',
      'Choisir les bons ingrédients',
      'Gagner progressivement en autonomie',
    ],
    cta: 'Réserver mon coaching',
    link: site.links.resaCoachingFormulation,
    image: '/offer-coaching-formulation.webp',
    imageAlt: "Mains d'une femme noire mélangeant une émulsion crémeuse dans un bécher",
    faq: [
      { q: 'Comment se déroule le coaching ?', a: 'En visio, pendant 1 heure, à un créneau qui te convient.' },
      { q: "Est-ce accessible depuis l'Afrique ?", a: 'Oui, la visio fonctionne partout avec une connexion internet.' },
      { q: 'Puis-je préparer mes questions à l\'avance ?', a: 'Oui, et c\'est même recommandé pour profiter au maximum de l\'heure ensemble.' },
    ],
    related: ['formation-produits-capillaires', 'coaching-conseils-capillaires'],
  },
  {
    slug: 'coaching-conseils-capillaires',
    kind: 'coaching',
    name: 'Coaching Conseils capillaires',
    shortName: 'Conseils capillaires',
    price: 65,
    duration: '1 h',
    format: 'Coaching individuel en visio',
    tagline: "J'ai besoin de conseils adaptés à mes problématiques capillaires.",
    hook: 'Construis enfin une routine capillaire efficace, pensée pour ta fibre.',
    paragraphs: [
      'Tu rencontres des difficultés avec tes cheveux ? Sécheresse, casse, chute, manque de volume, difficulté à retenir l\'hydratation ou simplement du mal à trouver une routine capillaire adaptée à tes besoins ?',
      "Le coaching capillaire est un accompagnement personnalisé pour t'aider à mieux comprendre les besoins de tes cheveux, identifier les causes possibles de tes difficultés et choisir les soins et ingrédients les plus adaptés à ta fibre capillaire.",
      "L'objectif ? T'aider à construire une routine capillaire efficace, adaptée à tes besoins, et à prendre soin de tes cheveux en toute autonomie.",
    ],
    outcomes: [
      'Comprendre les besoins de tes cheveux',
      'Identifier les causes de tes difficultés',
      'Choisir soins et ingrédients adaptés à ta fibre',
      'Construire une routine efficace et autonome',
    ],
    cta: 'Réserver mon coaching',
    link: site.links.resaCoachingCapillaire,
    image: '/offer-coaching-hair.webp',
    imageAlt: 'Femme noire aux cheveux crépus naturels appliquant un soin devant un miroir, lumière dorée',
    faq: [
      { q: 'Comment se déroule le coaching ?', a: 'En visio, pendant 1 heure, à un créneau qui te convient.' },
      { q: 'Le coaching convient-il aux cheveux crépus ?', a: 'Oui, tout à fait : les conseils sont adaptés à ta fibre capillaire, quelle qu\'elle soit.' },
      { q: "Est-ce accessible depuis l'étranger ?", a: 'Oui, la visio fonctionne partout avec une connexion internet.' },
    ],
    related: ['coaching-formulation', 'formation-produits-capillaires'],
  },
  {
    slug: 'consultation-lancement-marque',
    kind: 'coaching',
    name: 'Consultation Lancement de Marque',
    shortName: 'Lancement de marque',
    price: 110,
    duration: '1 h',
    format: 'Consultation individuelle en visio',
    tagline: "J'ai une idée de marque cosmétique et je ne sais pas par où commencer.",
    hook: 'De l\'idée au lancement : repars avec une vision claire de ton projet.',
    paragraphs: [
      'Cette consultation te permet de faire le point sur ton projet et de comprendre concrètement les différentes étapes nécessaires pour passer de l\'idée au lancement à la vente de produit.',
      'Nous échangeons sur ton concept, ta cible, les produits que tu souhaites développer et l\'état d\'avancement de ton projet. Si tu possèdes déjà une formule ou un prototype, nous pouvons également faire le point sur les prochaines étapes à envisager.',
      "L'objectif : repartir avec une vision beaucoup plus claire de ton projet et des prochaines étapes à entreprendre.",
      "Besoin d'une formulation sur mesure ? Si ton projet nécessite le développement d'une formule sur mesure, cette prestation peut également t'être proposée à l'issue de la consultation.",
    ],
    outcomes: [
      'Clarifier concept, cible et produits',
      'Comprendre les étapes de l\'idée à la vente',
      'Faire le point sur ta formule ou ton prototype',
      'Repartir avec des prochaines étapes concrètes',
    ],
    cta: 'Réserver ma consultation',
    link: site.links.resaLancementMarque,
    image: '/offer-brand-launch.webp',
    imageAlt: "Entrepreneuse noire élégante présentant une gamme de flacons ambrés et pots minimalistes dans un atelier lumineux",
    faq: [
      { q: 'Comment se déroule la consultation ?', a: 'En visio, pendant 1 heure, à un créneau qui te convient.' },
      { q: 'Je n\'ai encore rien démarré, est-ce pour moi ?', a: 'Oui : la consultation sert justement à poser les bases et à ordonner les étapes.' },
      { q: 'Proposez-vous la formulation sur mesure ?', a: 'Oui, elle peut t\'être proposée à l\'issue de la consultation si ton projet le nécessite.' },
    ],
    related: ['coaching-formulation', 'guide-formulation'],
  },
];

export const formations = offers.filter((o) => o.kind === 'formation');
export const coachings = offers.filter((o) => o.kind === 'coaching');

export const getOffer = (slug: string) => offers.find((o) => o.slug === slug);
export const offerPath = (o: Offer) => `/offres/${o.slug}`;
export const formatPrice = (n: number) => `${n} €`;
