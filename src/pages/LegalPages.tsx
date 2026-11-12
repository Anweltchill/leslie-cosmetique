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

export function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" path="/mentions-legales">
      <h2>Éditrice du site</h2>
      <p>
        <strong>{site.name}</strong> — {site.founder}, entrepreneure individuelle. Formulatrice en cosmétique naturelle et formatrice.
        Contact : <a href={`mailto:${site.email}`} className="link-line text-brown">{site.email}</a>.
      </p>
      <p>Adresse du siège, numéro SIRET et informations d'immatriculation : à compléter par l'éditrice.</p>
      <h2>Hébergement</h2>
      <p>Ce site est hébergé par un prestataire professionnel. Coordonnées de l'hébergeur : à compléter.</p>
      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des contenus du site (textes, visuels, logo, monogramme LC) est la propriété exclusive de {site.name}.
        Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.
      </p>
      <h2>Liens externes</h2>
      <p>
        Les achats et réservations s'effectuent via des plateformes tierces sécurisées (paiement et agenda en ligne).
        {site.name} ne saurait être tenue responsable du contenu ou du fonctionnement de ces services externes.
      </p>
    </LegalLayout>
  );
}

export function CgvPage() {
  return (
    <LegalLayout title="Conditions générales de vente" path="/cgv">
      <h2>Objet</h2>
      <p>
        Les présentes conditions régissent la vente à distance des formations en ligne, guides numériques et consultations
        individuelles (coachings en visio) proposés par {site.name}.
      </p>
      <h2>Prix et paiement</h2>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises. Le paiement s'effectue via une plateforme de paiement
        sécurisée externe, au moment de la commande. Moyens de paiement acceptés : à compléter.
      </p>
      <h2>Accès aux formations et guides</h2>
      <p>
        Après confirmation du paiement, l'accès aux contenus numériques est délivré selon les modalités précisées lors de
        l'achat. Durée d'accès : à compléter.
      </p>
      <h2>Coachings en visio</h2>
      <p>
        Les coachings sont réalisés en visioconférence, sur créneau réservé via l'agenda en ligne. Toute demande de report
        ou d'annulation doit être adressée par e-mail au plus tard 48 h avant la séance.
      </p>
      <h2>Droit de rétractation</h2>
      <p>
        Conformément à la réglementation applicable aux contenus numériques fournis immédiatement avec accord exprès du
        consommateur, le droit de rétractation ne s'applique pas aux formations et guides dont l'accès est délivré
        immédiatement. Pour les consultations, les règles de report ci-dessus s'appliquent.
      </p>
      <h2>Contact</h2>
      <p>
        Pour toute question relative à une commande : <a href={`mailto:${site.email}`} className="link-line text-brown">{site.email}</a>.
      </p>
    </LegalLayout>
  );
}

export function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" path="/confidentialite">
      <h2>Respect de votre vie privée</h2>
      <p>
        {site.name} ne collecte aucune donnée personnelle via ce site : aucun formulaire obligatoire, aucune inscription,
        aucune création de compte. La navigation est libre et ouverte.
      </p>
      <h2>Données traitées par les services tiers</h2>
      <p>
        Lors d'un achat ou d'une réservation, vous êtes redirigée vers des plateformes tierces (paiement sécurisé, agenda
        en ligne, visioconférence). Ces services traitent vos données selon leurs propres politiques de confidentialité,
        que nous vous invitons à consulter.
      </p>
      <h2>Mesure d'audience</h2>
      <p>
        Des statistiques de fréquentation anonymisées pourront être mises en place pour améliorer le site. Aucune donnée
        nominative n'est collectée à cette fin sans consentement.
      </p>
      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez de droits d'accès, de rectification et de suppression sur les données vous
        concernant. Pour les exercer : <a href={`mailto:${site.email}`} className="link-line text-brown">{site.email}</a>.
      </p>
    </LegalLayout>
  );
}
