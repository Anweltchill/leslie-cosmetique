/**
 * CONFIGURATION GLOBALE — Leslie Cosmétique
 * Toutes les variables {{...}} du cahier des charges sont regroupées ici.
 * Remplacez simplement les valeurs ci-dessous, aucun autre fichier à toucher.
 */
export const site = {
  /**
   * LIENS À RENSEIGNER
   * Remplacez chaque valeur par le lien fourni (https://…).
   * Tant qu'une valeur commence par « # », le bouton correspondant ne mène nulle part.
   */
  links: {
    // {{LIEN_PAIEMENT_FORMATION_LIVE}} — Formation cosmétique capillaire (en direct), 400 € — offre retirée, lien conservé
    payFormationLive: '#lien-paiement-formation-live',
    // {{LIEN_PAIEMENT_GUIDE_RECETTES}} — Guide de mes 10 meilleures recettes capillaires, 38 €
    payGuideRecettes: '#lien-paiement-guide-recettes',
    // {{LIEN_PAIEMENT_GUIDE_FORMULATION}} — Guide numérique de formulation, 48 € (ancien {{LIEN_PAIEMENT_GUIDE}})
    payGuideFormulation: '#lien-paiement-guide',
    // {{LIEN_RESA_COACHING_FORMULATION}} — Coaching Formulation, 60 €.
    // La réservation passe par le calendrier du site ; ce lien sert au bouton « Régler ma séance » affiché après la réservation.
    resaCoachingFormulation: '#lien-resa-coaching-formulation',
    // {{LIEN_RESA_LANCEMENT_MARQUE}} — Consultation Lancement de Marque, 79 € (même fonctionnement que ci-dessus)
    resaLancementMarque: '#lien-resa-lancement-marque',
    // {{LIEN_RESA_AUDIT}} — Audit (appel d'orientation), 30 €, bouton « Réserver mon audit »
    resaAudit: '#lien-resa-audit',
    // {{LIEN_CONTACT}} — bouton « Être prévenue de la prochaine session » une fois les inscriptions closes
    contact: '/contact',

    // Anciens liens, conservés pour les offres masquées (visible: false)
    // {{LIEN_PAIEMENT_FORMATION_CAPILLAIRE}}
    payFormationCapillaire: '#lien-paiement-formation-capillaire',
    // {{LIEN_RESA_COACHING_CAPILLAIRE}}
    resaCoachingCapillaire: '#lien-resa-coaching-capillaire',
  },
  // PAIEMENT MOBILE MONEY : le bouton « Payer par … sur WhatsApp » ouvre une conversation avec ce numéro.
  // {{NUMERO_WHATSAPP}} — format international, chiffres uniquement (ex. 2250700000000). Vide = section Mobile Money masquée.
  whatsapp: '',
  // Opérateurs proposés dans la fenêtre de paiement
  mobileMoney: ['Orange Money', 'MTN MoMo', 'Wave', 'Moov Money', 'Airtel Money', 'M-Pesa', 'Free Money', 'Autre opérateur'],
  name: 'Leslie Cosmétique',
  founder: 'Leslie Djoman',
  monogram: 'LC',
  // {{NOM_DOMAINE}} — sous-domaine provisoire (à changer si un domaine dédié est acheté, ainsi que public/sitemap.xml et public/robots.txt)
  url: 'https://leslie.phoenixpro.fr',
  // {{EMAIL_PRO}}
  email: 'contact@leslie-cosmetique.com',
  // {{LIENS}} réseaux sociaux
  social: {
    tiktok: 'https://www.tiktok.com/@lesliecosmetique',
    instagram: 'https://www.instagram.com/lesliecosmetique',
  },
  // Calendrier de réservation des coachings (heures en UTC, affichées dans l'heure locale du visiteur)
  booking: {
    weekdays: [1, 2, 3, 4, 5, 6],
    slotsUtc: ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'],
    minDaysAhead: 1,
    maxDaysAhead: 60,
  },
  // Pré-commande : passer à true pour activer le mode pré-commande
  // sur l'ancienne Formation Produits Capillaires (masquée). {{REMISE}} = texte de la réduction.
  preorder: {
    active: false,
    discount: '−20 %',
  },
  // PROMOTION (prix barrés sur toutes les offres + bandeau défilant en haut du site).
  // Prix payé = prix de l'offre (inchangé). Prix barré = prix ÷ (1 − remise), arrondi à l'euro.
  // Pour tout retirer : passer `active` à false.
  promo: {
    active: true,
    percent: 30,
    banner: 'Offre Black Friday — −30 % sur toutes les offres et tous les services',
  },
  // Pop-up d'information sur la formation en direct — désactivé (formation retirée du site).
  urgency: {
    active: false,
  },
  // FAQ — réponses à compléter par Leslie {{À COMPLÉTER}}
  faq: {
    paiement: 'Par carte bancaire, via le paiement sécurisé Stripe. Pour les guides, le téléchargement est disponible dès le paiement validé.',
    prerequis: 'Réponse à compléter — prérequis éventuels.',
    acces: "Réponse à compléter — durée d'accès aux formations.",
  },
} as const;

/** Vrai si le lien a été renseigné (n'est plus un emplacement « #… »). */
export const isLinkSet = (link: string) => !link.startsWith('#');
