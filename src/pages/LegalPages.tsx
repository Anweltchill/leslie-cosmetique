import type { ReactNode } from 'react';
import { useSeo } from '@/lib/seo';
import { site } from '@/data/site';
import { Reveal } from '@/components/Reveal';

function LegalLayout({ title, path, children }: { title: string; path: string; children: ReactNode }) {
  useSeo({ title, description: `${title} — ${site.name}.`, path });
  return (
    <article className="mx-auto max-w-[760px] px-5 pb-12 pt-32 md:pb-16 md:pt-36">
      <Reveal>
        <p className="label-lc">{site.name}</p>
        <h1 className="mt-3 font-serif-lc text-[32px] leading-tight text-espresso md:text-[40px]">{title}</h1>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="prose-lc mt-7 space-y-5 text-[14.5px] leading-[1.75] text-espresso [&_h2]:mt-8 [&_h2]:font-serif-lc [&_h2]:text-[22px] [&_h2]:text-espresso [&_strong]:font-medium [&_strong]:text-espresso">
          {children}
        </div>
      </Reveal>
    </article>
  );
}

const Mail = () => <a href={`mailto:${site.email}`} className="link-line text-brown">{site.email}</a>;

export function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" path="/mentions-legales">
      <h2>Éditrice du site</h2>
      <p>
        Le site <strong>{site.url.replace('https://', '')}</strong> est édité par <strong>{site.founder}</strong>, entrepreneure individuelle,
        sous le nom commercial <strong>{site.name}</strong> : formulation de cosmétiques naturels, guides numériques et accompagnements en ligne.
      </p>
      <p>
        Contact : <Mail />. Les informations d’immatriculation de l’éditrice sont communiquées sur simple demande à cette adresse.
      </p>
      <p>Directrice de la publication : {site.founder}.</p>
      <h2>Hébergement</h2>
      <p>
        Site hébergé par <strong>Netlify, Inc.</strong>, San Francisco, Californie, États-Unis (www.netlify.com).
        Données des réservations, des questions et des commandes hébergées par <strong>Supabase, Inc.</strong> (supabase.com).
      </p>
      <h2>Paiements</h2>
      <p>
        Les paiements par carte bancaire sont traités par <strong>Stripe Payments Europe, Ltd.</strong> (Dublin, Irlande), prestataire de
        paiement agréé. {site.name} n’a jamais accès à vos données bancaires.
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>
        L’ensemble des contenus du site et des guides (textes, recettes, formules, photos, vidéos, logo et monogramme LC) est la propriété
        exclusive de {site.name}, sauf mention contraire. Toute reproduction, diffusion ou revente, même partielle, est interdite sans
        autorisation écrite préalable. Les guides achetés sont réservés à un usage strictement personnel.
      </p>
      <h2>Responsabilité</h2>
      <p>
        Les recettes et conseils sont partagés à titre informatif, pour une fabrication en petite quantité et un usage personnel. Ils ne
        remplacent pas un avis médical. Effectuez toujours un test de tolérance cutanée avant la première utilisation. Toute mise sur le
        marché d’un produit cosmétique nécessite des évaluations et contrôles réglementaires supplémentaires.
      </p>
    </LegalLayout>
  );
}

export function CgvPage() {
  return (
    <LegalLayout title="Conditions générales de vente" path="/cgv">
      <h2>Objet</h2>
      <p>
        Les présentes conditions régissent la vente à distance, sur le site {site.url.replace('https://', '')}, des guides numériques et des
        accompagnements individuels en visio (coachings, consultation, audit) proposés par {site.name}. Toute commande vaut acceptation
        des présentes conditions.
      </p>
      <h2>Prix</h2>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises, sur la page de chaque offre. Le prix applicable est celui affiché au
        moment de la commande. Les prix barrés correspondent au prix habituel en dehors des opérations promotionnelles.
      </p>
      <h2>Paiement</h2>
      <p>
        <strong>Carte bancaire</strong> (Visa, Mastercard, CB…) via la plateforme de paiement sécurisée Stripe : le paiement est débité au
        moment de la commande.
      </p>
      <p>
        <strong>Mobile Money</strong> (Orange Money, MTN MoMo, Wave, Moov Money, Airtel Money, M-Pesa, Free Money…) : la commande est
        finalisée sur WhatsApp, où les instructions de paiement vous sont transmises. Le guide ou la séance sont délivrés après réception
        du paiement.
      </p>
      <h2>Guides numériques</h2>
      <p>
        Les guides sont des fichiers PDF. Après confirmation du paiement, un lien de téléchargement vous est envoyé par e-mail (et
        s’affiche aussitôt à l’écran en cas de paiement par carte) ; il reste actif 7 jours. Le fichier téléchargé vous appartient sans limite de durée. En cas de difficulté, écrivez à <Mail /> : le guide
        vous sera renvoyé par e-mail.
      </p>
      <h2>Coachings en visio</h2>
      <p>
        Les séances (Coaching Formulation, Consultation Lancement de Marque, Audit d’orientation) se déroulent en visioconférence, sur le
        créneau choisi dans le calendrier du site. Un récapitulatif est envoyé par e-mail dès la réservation, puis le rendez-vous est
        confirmé par e-mail avec le lien de connexion ; un rappel est envoyé avant la séance.
      </p>
      <p>
        Toute demande de report ou d’annulation doit être adressée par e-mail au plus tard 48 h avant la séance : la séance est alors
        reportée ou remboursée. En deçà de 48 h, ou en cas d’absence, la séance reste due, sauf cas de force majeure.
      </p>
      <h2>Droit de rétractation</h2>
      <p>
        Pour les guides numériques, fournis immédiatement après le paiement, vous demandez l’accès au contenu dès la commande et
        reconnaissez ainsi renoncer à votre droit de rétractation, conformément à l’article L.221-28 du Code de la consommation.
      </p>
      <p>
        Pour les séances, vous disposez d’un délai de 14 jours après la commande pour vous rétracter, tant que la séance n’a pas eu lieu.
        Si vous réservez une séance avant la fin de ce délai, vous demandez expressément qu’elle soit réalisée à la date choisie.
      </p>
      <h2>Réclamations</h2>
      <p>
        Pour toute question ou réclamation relative à une commande : <Mail />. En cas de litige, vous pouvez recourir gratuitement à un
        médiateur de la consommation ou à la plateforme européenne de règlement en ligne des litiges.
      </p>
    </LegalLayout>
  );
}

export function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" path="/confidentialite">
      <h2>Responsable du traitement</h2>
      <p>
        {site.founder} ({site.name}) — <Mail />.
      </p>
      <h2>Données collectées</h2>
      <p>
        <strong>Réservation d’une séance</strong> : nom, e-mail, téléphone (facultatif), message, créneau choisi et fuseau horaire, pour
        organiser votre rendez-vous et vous envoyer les e-mails qui s’y rapportent (récapitulatif, confirmation, rappel, changement).
      </p>
      <p>
        <strong>Question envoyée via la bulle « Une question ? »</strong> : nom, e-mail et message, pour vous répondre.
      </p>
      <p>
        <strong>Commande</strong> : nom, e-mail, offre achetée et montant, pour délivrer le guide ou la séance et tenir la comptabilité. Les
        données bancaires sont traitées uniquement par Stripe et ne nous sont jamais transmises. Pour le Mobile Money, l’échange a lieu sur
        WhatsApp.
      </p>
      <h2>Mesure d’audience</h2>
      <p>
        Pour améliorer le site, des statistiques de fréquentation anonymes sont produites : pages vues, offres consultées, étapes de commande
        et site ou réseau d’origine (Instagram, TikTok…). Elles reposent sur un identifiant aléatoire enregistré dans votre navigateur, sans
        cookie publicitaire ni croisement avec d’autres sites. Cet identifiant est renouvelé au plus tard tous les 13 mois. Aucune mesure
        n’est effectuée si votre navigateur indique « Ne pas me suivre ».
      </p>
      <h2>Destinataires et hébergement</h2>
      <p>
        Les données sont réservées à {site.name}. Elles sont hébergées par Supabase (base de données), Netlify (site), Stripe (paiements)
        et Resend (envoi des e-mails), qui agissent en tant que sous-traitants. Elles ne sont jamais vendues ni cédées.
      </p>
      <h2>Durée de conservation</h2>
      <p>
        Réservations, questions et coordonnées : 3 ans à compter du dernier échange. Données de commande : durée légale de conservation
        des pièces comptables (10 ans). Statistiques de fréquentation : 25 mois au maximum.
      </p>
      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement, d’opposition et de limitation sur les données
        vous concernant. Pour les exercer : <Mail />. Vous pouvez également adresser une réclamation à la CNIL (www.cnil.fr).
      </p>
    </LegalLayout>
  );
}
