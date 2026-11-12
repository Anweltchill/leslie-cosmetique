/**
 * CONFIGURATION GLOBALE — Leslie Cosmétique
 * Toutes les variables {{...}} du cahier des charges sont regroupées ici.
 * Remplacez simplement les valeurs ci-dessous, aucun autre fichier à toucher.
 */
export const site = {
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
  links: {
    // {{LIEN_PAIEMENT_FORMATION_CAPILLAIRE}}
    payFormationCapillaire: '#lien-paiement-formation-capillaire',
    // {{LIEN_PAIEMENT_GUIDE}}
    payGuide: '#lien-paiement-guide',
    // {{LIEN_RESA_COACHING_FORMULATION}}
    resaCoachingFormulation: '#lien-resa-coaching-formulation',
    // {{LIEN_RESA_COACHING_CAPILLAIRE}}
    resaCoachingCapillaire: '#lien-resa-coaching-capillaire',
    // {{LIEN_RESA_LANCEMENT_MARQUE}}
    resaLancementMarque: '#lien-resa-lancement-marque',
  },
  // Calendrier de réservation des coachings (heures en UTC, affichées dans l'heure locale du visiteur)
  booking: {
    weekdays: [1, 2, 3, 4, 5, 6],
    slotsUtc: ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'],
    minDaysAhead: 1,
    maxDaysAhead: 60,
  },
  // Pré-commande : passer à true pour activer le mode pré-commande
  // sur la Formation Produits Capillaires. {{REMISE}} = texte de la réduction.
  preorder: {
    active: false,
    discount: '−20 %',
  },
  // Pop-up d'urgence (désactivé par défaut). {{DATE_SESSION}}
  urgency: {
    active: false,
    title: 'Une seule session ce mois-ci — places limitées',
    sessionDate: '28 novembre 2026',
  },
  // FAQ — réponses à compléter par Leslie {{À COMPLÉTER}}
  faq: {
    paiement: 'Réponse à compléter — moyens de paiement acceptés.',
    prerequis: 'Réponse à compléter — prérequis éventuels.',
    acces: "Réponse à compléter — durée d'accès aux formations.",
  },
} as const;
