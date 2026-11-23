import { site, isLinkSet } from './site';

export type OfferKind = 'formation' | 'coaching';

/** Élément de liste : texte simple, ou texte précédé d'un intitulé en gras. */
export type ListItem = string | { lead: string; text: string };
/** Bloc de contenu : paragraphe, ou liste à puces. */
export type Block = string | { items: ListItem[] };

export interface Enrollment {
  /** Fin des inscriptions, heure de Paris (ISO 8601 avec décalage). */
  closesAt: string;
  closesLabel: string;
  datesLabel: string;
  /** Dates ISO de la session (données structurées). */
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  closedCta: string;
  closedLink: string;
}

export interface Offer {
  slug: string;
  kind: OfferKind;
  /** false = offre masquée partout (réversible). Son URL redirige vers la page de sa famille. */
  visible: boolean;
  name: string;
  shortName: string;
  price: number;
  priceNote?: string;
  duration?: string;
  /** Pastille de durée affichée sur les coachings (« 1 h en visio », « 30 min »). */
  durationLabel?: string;
  /** Pastille courte du format (« Guide numérique PDF », « À distance, en direct »…). */
  channel: string;
  format: string;
  tagline: string;
  hook?: string;
  paragraphs: Block[];
  outcomesTitle?: string;
  outcomesIntro?: string;
  outcomes: string[];
  /** Blocs complémentaires affichés sous « En détail ». */
  sections?: { title: string; paragraphs: string[] }[];
  /** Informations pratiques (bloc d'infos). */
  practical?: { label: string; value: string }[];
  /** Programme en modules (accordéon). */
  modules?: { title: string; text: string }[];
  /** Galerie « En images » de la page détail (vidéos .mp4 ou images), affichées à la même hauteur. */
  gallery?: { src: string; poster?: string; alt: string; ratio: string }[];
  /** Encadré « Informations complémentaires » en bas de page. */
  notes?: { title: string; paragraphs: string[] };
  /** Compte à rebours des inscriptions. */
  enrollment?: Enrollment;
  cta: string;
  link: string;
  /** Coachings : réservation via le calendrier du site, ou via le lien externe `link`. */
  booking?: 'calendar' | 'link';
  image: string;
  imageAlt: string;
  badge?: string;
  faq: { q: string; a: string }[];
  related: string[];
}

const allOffers: Offer[] = [
  /* ───────────── FORMATIONS ───────────── */
  {
    slug: 'formation-cosmetique-capillaire',
    kind: 'formation',
    // Retirée du site (formation en direct abandonnée). Repasser à true pour la réafficher.
    visible: false,
    name: 'Formation cosmétique capillaire (en direct)',
    shortName: 'Formation capillaire en direct',
    price: 400,
    priceNote: 'par personne',
    channel: 'À distance, en direct',
    format: 'Formation à distance, en direct — 3 jours, 3 h par jour',
    tagline: 'Apprenez à formuler vos propres soins capillaires',
    hook: 'Une formation complète en 9 modules pour apprendre à concevoir vos laits, crèmes, masques et soins capillaires émulsionnés.',
    paragraphs: [
      "Découvrez les 9 modules de formation conçus pour vous accompagner progressivement dans l'apprentissage de la formulation de soins capillaires émulsionnés.",
      "De la compréhension des besoins du cheveu à la création de vos propres formules, cette formation vous permettra d'acquérir les connaissances et les compétences techniques nécessaires pour formuler avec méthode et autonomie.",
    ],
    outcomesIntro: 'Vous aurez acquis les connaissances et les bases techniques nécessaires pour :',
    outcomes: [
      'Comprendre les caractéristiques et les besoins des cheveux texturés.',
      'Identifier le rôle des différentes matières premières cosmétiques.',
      'Construire une formule à partir d’un cahier des charges.',
      'Maîtriser les calculs et les pourcentages d’une formulation.',
      'Fabriquer vos propres laits, crèmes, masques et autres soins capillaires émulsionnés.',
      'Adapter vos formulations aux besoins spécifiques des cheveux.',
      'Réaliser les premiers contrôles et identifier les éventuels problèmes de stabilité.',
    ],
    practical: [
      { label: 'Tarif', value: '400 € par personne' },
      { label: 'Format', value: 'Formation à distance, en direct' },
      { label: 'Durée', value: '3 jours — 3 h par jour' },
      { label: 'Dates', value: '26, 27 et 28 décembre' },
      { label: 'Fin des inscriptions', value: '23 décembre' },
    ],
    modules: [
      {
        title: 'Comprendre la structure et les besoins des cheveux texturés',
        text: 'Découvrez la structure du cheveu, ses caractéristiques et ses besoins spécifiques afin de mieux comprendre comment choisir et adapter les soins capillaires (laits, crèmes, masques…) en fonction du profil capillaire.',
      },
      {
        title: 'Découvrir les différents soins capillaires émulsionnés',
        text: 'Apprenez à différencier les laits, crèmes, masques et après-shampooings, à comprendre leurs spécificités et à identifier leurs fonctions dans une routine capillaire.',
      },
      {
        title: 'Comprendre les émulsions cosmétiques',
        text: "Découvrez le principe d'une émulsion, son fonctionnement et le rôle des émulsifiants dans la création de soins capillaires.",
      },
      {
        title: "Comprendre les différentes phases d'une émulsion",
        text: 'Apprenez à identifier les phases aqueuses, huileuses et de refroidissement, ainsi que le rôle des différentes matières premières qui les composent.',
      },
      {
        title: 'Comprendre le rôle du pH en cosmétique',
        text: "Découvrez l'importance du pH dans les formulations cosmétiques, son influence sur les produits et les méthodes permettant de le mesurer et de l'ajuster correctement.",
      },
      {
        title: 'Apprendre à construire une formule cosmétique',
        text: "Apprenez à construire une formule cosmétique étape par étape, en partant de la définition d'un cahier des charges jusqu'à l'organisation complète de votre formulation. Vous apprendrez également à maîtriser le principe des 100 %, à calculer les quantités de chaque ingrédient, à ajuster la quantité d'eau restante et à vérifier la cohérence de votre formule avant de passer à la fabrication.",
      },
      {
        title: "Maîtriser le mode opératoire de fabrication d'une émulsion",
        text: 'Apprenez à fabriquer vos soins capillaires émulsionnés en respectant les différentes étapes du processus de fabrication. Découvrez comment préparer les matières premières, organiser les phases de votre formule, maîtriser les températures de chauffe, réaliser une émulsion et incorporer les ingrédients sensibles à la chaleur.',
      },
      {
        title: 'Adapter sa formulation au profil capillaire',
        text: "Apprenez à concevoir des soins capillaires personnalisés en fonction des caractéristiques et des besoins spécifiques des cheveux. L'objectif est de vous permettre de formuler des soins ciblés plutôt que d'utiliser une formule identique pour tous les profils capillaires.",
      },
      {
        title: "Contrôler et analyser la stabilité d'une émulsion",
        text: "Apprenez à réaliser les principaux contrôles permettant d'évaluer la qualité et la stabilité de vos préparations cosmétiques. Découvrez comment observer l'évolution d'une émulsion, identifier les signes d'instabilité (déphasage, modification de texture, variation du pH…) et comprendre les facteurs susceptibles d'influencer sa stabilité.",
      },
    ],
    sections: [
      {
        title: 'Un support de formation complet inclus',
        paragraphs: [
          "À l'issue de la formation, vous recevrez un support pédagogique complet, comprenant l'ensemble des contenus théoriques abordés ainsi que les vidéos des démonstrations pratiques présentées pendant les séances.",
          'Vous pourrez ainsi revenir sur les notions étudiées, revoir les différentes étapes de fabrication et consulter les ressources à votre rythme pour vous accompagner dans vos futures formulations capillaires.',
        ],
      },
    ],
    notes: {
      title: 'Informations complémentaires',
      paragraphs: [
        'Cette formation est destinée aux personnes souhaitant acquérir des connaissances et des compétences pratiques en formulation de soins capillaires.',
        "Elle ne délivre ni diplôme ni certification professionnelle reconnue par l'État.",
        "L'objectif est de vous transmettre une méthodologie de formulation et de vous permettre de développer vos compétences en toute autonomie.",
      ],
    },
    enrollment: {
      closesAt: '2026-12-23T23:59:59+01:00',
      closesLabel: '23 décembre',
      datesLabel: '26, 27 et 28 décembre',
      startDate: '2026-12-26',
      endDate: '2026-12-28',
      hoursPerDay: 3,
      closedCta: 'Être prévenue de la prochaine session',
      closedLink: site.links.contact,
    },
    cta: "Je m'inscris",
    link: site.links.payFormationLive,
    image: '/offre-1-formation-live.webp',
    imageAlt: "Boucles naturelles hydratées d'une femme noire, avec un pot de masque capillaire crémeux",
    badge: 'La plus complète',
    faq: [
      {
        q: 'Quand a lieu la formation ?',
        a: 'Les 26, 27 et 28 décembre, à distance et en direct, 3 h par jour. Les inscriptions sont ouvertes jusqu’au 23 décembre.',
      },
      {
        q: "Puis-je suivre la formation depuis l'Afrique ?",
        a: "Oui. La formation se déroule à distance, en direct : vous pouvez la suivre depuis l'Afrique francophone comme depuis la diaspora.",
      },
      {
        q: 'Que vais-je recevoir après la formation ?',
        a: "Un support pédagogique complet, comprenant l'ensemble des contenus théoriques abordés ainsi que les vidéos des démonstrations pratiques présentées pendant les séances.",
      },
      {
        q: 'La formation délivre-t-elle un diplôme ?',
        a: "Non. Elle ne délivre ni diplôme ni certification professionnelle reconnue par l'État.",
      },
      { q: 'Faut-il un prérequis ?', a: site.faq.prerequis },
    ],
    related: ['guide-recettes-capillaires', 'guide-formulation'],
  },
  {
    slug: 'guide-recettes-capillaires',
    kind: 'formation',
    visible: true,
    name: 'Le guide de mes 10 meilleures recettes capillaires',
    shortName: 'Guide de 10 recettes capillaires',
    price: 38,
    channel: 'Guide numérique PDF',
    format: 'Guide numérique PDF, accessible après achat',
    tagline: 'Pour répondre à vos problématiques de cheveux',
    hook: "Découvrez une sélection de 10 recettes capillaires que j'ai développées, expérimentées et améliorées au fil de mes expériences en formulation cosmétique.",
    paragraphs: [
      'Ce guide a été conçu pour vous aider à fabriquer vos propres soins et à répondre à vos différentes problématiques capillaires :',
      {
        items: [
          "La sécheresse et le manque d'hydratation",
          'La casse et la fragilité des cheveux',
          'La chute de cheveux et les besoins liés à la repousse',
          "Les démangeaisons et l'inconfort du cuir chevelu",
        ],
      },
    ],
    outcomesTitle: 'Que contient le guide ?',
    outcomesIntro: 'Pour chaque recette, vous retrouverez :',
    outcomes: [
      'La présentation du soin et ses bienfaits attendus.',
      'La liste des ingrédients et leurs quantités précises.',
      'Le mode opératoire détaillé, étape par étape, pour la réalisation de chaque recette.',
      "Les conseils d'utilisation et les précautions.",
    ],
    cta: 'Obtenir le guide',
    link: site.links.payGuideRecettes,
    // Visuels de Leslie (Drive, 22/11 à 21 h 16) : IMG-20261122-WA0013 en image d'offre (recadrée en 4:3),
    // VID-20261122-WA0014 et IMG-20261122-WA0015 dans la galerie.
    image: '/offre-2-guide-recettes.webp',
    imageAlt: 'Avant et après : repousse des cheveux au niveau des tempes',
    gallery: [
      { src: '/videos/offre-2-guide-recettes-galerie-1.mp4', poster: '/videos/offre-2-guide-recettes-galerie-1.webp', alt: 'Vidéo : la ligne des cheveux, en deux temps', ratio: '9 / 16' },
      { src: '/offre-2-guide-recettes-galerie-2.webp', alt: 'Avant et après : repousse des cheveux sur les tempes', ratio: '1 / 1' },
    ],
    faq: [
      { q: 'Sous quel format se présente le guide ?', a: 'Un guide numérique PDF, accessible après achat.' },
      { q: 'Le guide est-il accessible partout dans le monde ?', a: 'Oui, il est 100 % en ligne et accessible depuis toute la francophonie.' },
      { q: 'Quels sont les moyens de paiement ?', a: site.faq.paiement },
    ],
    related: ['guide-formulation', 'audit-orientation'],
  },
  {
    slug: 'guide-formulation',
    kind: 'formation',
    visible: true,
    name: 'Guide numérique : Apprendre à formuler ses propres produits cosmétiques',
    shortName: 'Guide de formulation',
    price: 48,
    channel: 'Guide numérique',
    format: 'Guide numérique complet et illustré',
    tagline: 'Apprenez à créer vos propres produits cosmétiques, à votre rythme et en toute autonomie.',
    hook: "Ce guide numérique complet et illustré a été conçu pour vous accompagner pas à pas dans l'apprentissage de la formulation cosmétique, même si vous débutez.",
    paragraphs: [
      "Découvrez comment sélectionner les matières premières, comprendre leurs fonctions, maîtriser leurs dosages et leurs conditions d'utilisation, et construire des formules équilibrées en fonction du produit que vous souhaitez réaliser.",
      'À travers ce guide, vous apprendrez à formuler différentes catégories de produits cosmétiques :',
      {
        items: [
          {
            lead: 'Les émulsions (crèmes et laits)',
            text: 'comprendre leur fonctionnement, choisir les émulsifiants, les huiles végétales, les agents de texture et les actifs adaptés, et apprendre à construire une formule.',
          },
          {
            lead: 'Les produits nettoyants (notamment les shampoings)',
            text: "découvrir les différentes familles de tensioactifs, comprendre leurs propriétés, leurs concentrations d'utilisation et apprendre à concevoir des formules nettoyantes adaptées.",
          },
          {
            lead: 'Les produits 100 % corps gras (baumes)',
            text: 'comprendre leur composition, sélectionner les matières premières et apprendre à formuler des soins sans phase aqueuse.',
          },
        ],
      },
      "Bien plus qu'un simple document théorique, ce guide a été pensé pour rendre l'apprentissage de la formulation cosmétique à la fois clair et passionnant.",
    ],
    outcomes: [
      'Sélectionner les matières premières',
      'Comprendre leurs fonctions',
      "Maîtriser leurs dosages et leurs conditions d'utilisation",
      'Construire des formules équilibrées',
    ],
    cta: 'Obtenir le guide',
    link: site.links.payGuideFormulation,
    // Visuels de Leslie (Drive, 23/11 à 8 h 47) : IMG-20261123-WA0009 en image d'offre,
    // WA0011 et WA0010 dans la colonne « Ce que vous allez obtenir ».
    image: '/offre-3-guide-formulation.webp',
    imageAlt: 'Flacon de shampoing, pot de crème et pot de gommage faits maison, posés sur une serviette en lin',
    gallery: [
      { src: '/offre-3-guide-formulation-galerie-1.webp', alt: 'Main tenant un pot de crème onctueuse faite maison', ratio: '4 / 3' },
      { src: '/offre-3-guide-formulation-galerie-2.webp', alt: 'Shampoing maison versé dans un bol en verre', ratio: '4 / 3' },
    ],
    faq: [
      { q: 'Le guide est-il adapté si je débute ?', a: "Oui, il a été conçu pour vous accompagner pas à pas dans l'apprentissage de la formulation cosmétique, même si vous débutez." },
      { q: 'Le guide est-il accessible partout dans le monde ?', a: 'Oui, il est 100 % en ligne et accessible depuis toute la francophonie.' },
      { q: 'Quels sont les moyens de paiement ?', a: site.faq.paiement },
      { q: 'Combien de temps ai-je accès au guide ?', a: site.faq.acces },
    ],
    related: ['guide-recettes-capillaires', 'coaching-formulation'],
  },

  /* ───────────── COACHINGS ───────────── */
  {
    slug: 'coaching-formulation',
    kind: 'coaching',
    visible: true,
    name: 'Coaching Formulation',
    shortName: 'Coaching Formulation',
    price: 60,
    duration: '1 h',
    durationLabel: '1 h en visio',
    channel: 'Coaching individuel en visio',
    format: 'Coaching individuel en visio',
    tagline: "Vous avez besoin d'être accompagnée dans vos formulations ?",
    hook: "Vous formulez déjà vos propres produits cosmétiques, mais vous rencontrez des difficultés ? Une texture qui ne correspond pas au résultat souhaité, une émulsion qui se déstabilise, des ingrédients difficiles à choisir ou simplement besoin d'un regard professionnel sur votre formule ?",
    paragraphs: [
      'Le coaching en formulation cosmétique est un accompagnement personnalisé conçu pour vous aider à identifier vos erreurs, comprendre les difficultés rencontrées, améliorer vos formulations et gagner progressivement en autonomie.',
    ],
    outcomes: [
      'Identifier vos erreurs',
      'Comprendre les difficultés rencontrées',
      'Améliorer vos formulations',
      'Gagner progressivement en autonomie',
    ],
    cta: 'Réserver mon coaching',
    link: site.links.resaCoachingFormulation,
    booking: 'calendar',
    image: '/offre-4-coaching-formulation.webp',
    // Image de Leslie (Drive, 23/11 à 8 h 55) : « image00001 (1).png »
    imageAlt: 'Femme noire souriante à son bureau d’atelier, entourée de pots de crème, flacons, balance et carnet de formules',
    faq: [
      { q: 'Comment se déroule le coaching ?', a: 'En visio, pendant 1 heure, à un créneau qui vous convient.' },
      { q: "Est-ce accessible depuis l'Afrique ?", a: 'Oui, la visio fonctionne partout avec une connexion internet.' },
      { q: "Puis-je préparer mes questions à l'avance ?", a: "Oui, et c'est même recommandé pour profiter au maximum de l'heure ensemble." },
    ],
    related: ['guide-formulation', 'audit-orientation'],
  },
  {
    slug: 'consultation-lancement-marque',
    kind: 'coaching',
    visible: true,
    name: 'Consultation Lancement de Marque',
    shortName: 'Lancement de marque',
    price: 79,
    duration: '1 h',
    durationLabel: '1 h en visio',
    channel: 'Consultation individuelle en visio',
    format: 'Consultation individuelle en visio',
    tagline: 'Vous avez un projet de marque cosmétique et vous ne savez pas par où commencer ?',
    hook: 'Cette consultation vous permet de faire le point sur votre projet et de comprendre concrètement les différentes étapes nécessaires pour passer de votre idée à la commercialisation de vos produits cosmétiques.',
    paragraphs: [
      "Nous échangerons sur votre concept, votre clientèle cible, les produits que vous souhaitez développer et l'état d'avancement de votre projet.",
      "Si vous disposez déjà d'une formule ou d'un prototype, nous pourrons également faire le point sur les prochaines étapes à envisager.",
      "L'objectif ? Vous permettre de repartir avec une vision plus claire de votre projet, des démarches à entreprendre et des étapes à suivre pour avancer sereinement vers le lancement de votre marque.",
    ],
    outcomes: [
      'Faire le point sur votre projet',
      'Comprendre les étapes, de votre idée à la commercialisation',
      'Échanger sur votre concept, votre clientèle cible et vos produits',
      'Repartir avec une vision plus claire des étapes à suivre',
    ],
    sections: [
      {
        title: "Besoin d'une formulation sur mesure ?",
        paragraphs: [
          'Si votre projet nécessite le développement d’une formule cosmétique personnalisée, cette prestation pourra également vous être proposée à l’issue de notre consultation, en fonction de vos besoins et de vos objectifs.',
        ],
      },
    ],
    cta: 'Réserver ma consultation',
    link: site.links.resaLancementMarque,
    booking: 'calendar',
    // Visuels de Leslie (Drive, 23/11 à 9 h 03) : IMG-20261123-WA0014 en image d'offre, WA0013 dans la colonne des visuels.
    image: '/offre-5-lancement-marque.webp',
    imageAlt: "Ordinateur affiché « Lancement de marque cosmétique », carnet de projet de marque et premiers produits sur un bureau en bois",
    gallery: [
      { src: '/offre-5-lancement-marque-galerie-1.webp', alt: 'Gamme de soins capillaires étiquetés : après-shampoing, shampoing, lait, brume, sérum et baume', ratio: '3 / 2' },
    ],
    faq: [
      { q: 'Comment se déroule la consultation ?', a: 'En visio, pendant 1 heure, à un créneau qui vous convient.' },
      { q: "Je n'ai encore rien démarré, est-ce pour moi ?", a: 'Oui : la consultation sert justement à poser les bases et à ordonner les étapes.' },
      { q: 'Proposez-vous la formulation sur mesure ?', a: "Oui, elle peut vous être proposée à l'issue de la consultation si votre projet le nécessite." },
    ],
    related: ['coaching-formulation', 'audit-orientation'],
  },
  {
    slug: 'audit-orientation',
    kind: 'coaching',
    visible: true,
    name: "Audit (appel d'orientation)",
    shortName: 'Audit d’orientation',
    price: 30,
    duration: '30 min',
    durationLabel: '30 min',
    channel: "Appel d'orientation",
    format: "Appel d'orientation de 30 min",
    tagline: 'Vous ne savez pas quel accompagnement choisir ?',
    hook: 'Vous souhaitez apprendre à formuler vos propres cosmétiques, améliorer vos recettes ou concrétiser un projet, mais vous ne savez pas quelle prestation correspond le mieux à vos besoins ?',
    paragraphs: [
      'Expliquez-moi brièvement votre situation et vos objectifs. Je pourrai vous orienter vers la formation, le guide ou l’accompagnement le plus adapté à votre projet.',
    ],
    outcomes: [
      'Expliquer votre situation et vos objectifs',
      'Être orientée vers la formation, le guide ou l’accompagnement le plus adapté à votre projet',
    ],
    cta: 'Réserver mon audit',
    link: site.links.resaAudit,
    booking: 'link',
    image: '/offre-6-audit.webp',
    imageAlt: 'Femme noire souriante prenant des notes devant son ordinateur portable, dans un intérieur aux tons crème',
    faq: [
      { q: "Comment se déroule l'audit ?", a: "C'est un appel d'orientation de 30 minutes : vous m'expliquez brièvement votre situation et vos objectifs." },
      { q: "Que se passe-t-il à l'issue de l'audit ?", a: 'Je vous oriente vers la formation, le guide ou l’accompagnement le plus adapté à votre projet.' },
    ],
    related: ['coaching-formulation', 'consultation-lancement-marque'],
  },

  /* ───────────── OFFRES MASQUÉES (visible: false) ───────────── */
  {
    slug: 'formation-produits-capillaires',
    kind: 'formation',
    visible: false,
    name: 'Formation Produits Capillaires',
    shortName: 'Produits Capillaires',
    price: 350,
    channel: '100 % en ligne',
    format: 'Cours pré-enregistrés + démonstrations pratiques, à votre rythme',
    tagline: 'Je veux apprendre à formuler mes propres soins capillaires.',
    hook: 'Apprenez à formuler des soins capillaires cohérents, stables et adaptés à vos cheveux.',
    paragraphs: [
      'Apprenez à concevoir vos produits capillaires de manière autonome : comprendre le rôle des ingrédients, construire une formule équilibrée, réaliser vos émulsions de type crèmes, laits, masques, après-shampoings, adapter vos soins aux différents besoins du cheveu et développer des produits cohérents et stables dans la durée.',
      "La formation est conçue pour vous permettre d'avancer à votre rythme grâce à des cours pré-enregistrés et des démonstrations pratiques.",
    ],
    outcomes: [
      'Comprendre le rôle des ingrédients',
      'Construire une formule équilibrée',
      'Réaliser crèmes, laits, masques et après-shampoings',
      'Adapter vos soins aux besoins du cheveu',
      'Développer des produits stables dans la durée',
    ],
    cta: 'Accéder à la formation',
    link: site.links.payFormationCapillaire,
    image: '/offre-1-formation-live.webp',
    imageAlt: "Boucles naturelles hydratées d'une femme noire, avec un pot de masque capillaire crémeux",
    faq: [],
    related: [],
  },
  {
    slug: 'coaching-conseils-capillaires',
    kind: 'coaching',
    visible: false,
    name: 'Coaching Conseils capillaires',
    shortName: 'Conseils capillaires',
    price: 65,
    duration: '1 h',
    durationLabel: '1 h en visio',
    channel: 'Coaching individuel en visio',
    format: 'Coaching individuel en visio',
    tagline: "J'ai besoin de conseils adaptés à mes problématiques capillaires.",
    hook: 'Construisez enfin une routine capillaire efficace, pensée pour votre fibre.',
    paragraphs: [
      "Vous rencontrez des difficultés avec vos cheveux ? Sécheresse, casse, chute, manque de volume, difficulté à retenir l'hydratation ou simplement du mal à trouver une routine capillaire adaptée à vos besoins ?",
      'Le coaching capillaire est un accompagnement personnalisé pour vous aider à mieux comprendre les besoins de vos cheveux, identifier les causes possibles de vos difficultés et choisir les soins et ingrédients les plus adaptés à votre fibre capillaire.',
    ],
    outcomes: [
      'Comprendre les besoins de vos cheveux',
      'Identifier les causes de vos difficultés',
      'Choisir soins et ingrédients adaptés à votre fibre',
      'Construire une routine efficace et autonome',
    ],
    cta: 'Réserver mon coaching',
    link: site.links.resaCoachingCapillaire,
    booking: 'calendar',
    image: '/offre-2-guide-recettes.webp',
    imageAlt: 'Femme noire aux cheveux crépus naturels appliquant un soin devant un miroir, lumière dorée',
    faq: [],
    related: [],
  },
];

/** Toutes les offres, y compris masquées (pour les redirections). */
export const offers = allOffers;
export const visibleOffers = allOffers.filter((o) => o.visible);

export const formations = visibleOffers.filter((o) => o.kind === 'formation');
export const coachings = visibleOffers.filter((o) => o.kind === 'coaching');

export const getOffer = (slug: string) => allOffers.find((o) => o.slug === slug);
export const getVisibleOffer = (slug: string) => visibleOffers.find((o) => o.slug === slug);
export const offerPath = (o: Offer) => `/offres/${o.slug}`;
export const formatPrice = (n: number) => `${n} €`;
export const familyPath = (o: Offer) => (o.kind === 'coaching' ? '/coachings' : '/formations');

export const liveTraining = allOffers.find((o) => o.visible && o.enrollment);
export const auditOffer = getVisibleOffer('audit-orientation');

/** Coaching réservable via le calendrier du site (sinon via le lien externe). */
export const usesCalendar = (o: Offer) => o.kind === 'coaching' && o.booking === 'calendar';

/**
 * Lien de réservation d'un coaching, hors de sa page détail :
 * calendrier du site, lien externe s'il est renseigné, sinon la page détail de l'offre.
 */
export const bookingHref = (o: Offer) => {
  if (usesCalendar(o)) return `/reserver/${o.slug}`;
  return isLinkSet(o.link) ? o.link : offerPath(o);
};
