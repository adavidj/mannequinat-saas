import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPlaceholder, LegalSection, LegalShell } from '@/features/legal/components/LegalShell';

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation',
  description:
    'Conditions générales d’utilisation de ModelBénin : accès, règles de conduite, modération, abonnements et responsabilité.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalShell title="Conditions générales d’utilisation" updatedAt="8 novembre 2026">
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <strong>Version projet.</strong> Ce document doit être relu et validé par un juriste
        béninois avant l’ouverture publique du service. Les éléments entre crochets sont à
        compléter.
      </p>

      <LegalSection title="1. Objet et acceptation">
        <p>
          Les présentes conditions générales d’utilisation (« CGU ») encadrent l’accès et l’usage de
          la plateforme ModelBénin, éditée par <LegalPlaceholder>[raison sociale]</LegalPlaceholder>
          , dont le siège est situé à <LegalPlaceholder>[adresse]</LegalPlaceholder>, Cotonou,
          Bénin.
        </p>
        <p>
          Créer un compte ou utiliser le service vaut acceptation pleine et entière des présentes
          CGU et de la{' '}
          <Link
            className="font-semibold text-brand-800 hover:text-brand-900"
            href="/confidentialite"
          >
            politique de confidentialité
          </Link>
          . Si vous refusez ces conditions, vous devez cesser d’utiliser la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="2. Comptes et conditions d’accès">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Le service est <strong>strictement réservé aux personnes de 18 ans et plus</strong>. La
            date de naissance est demandée à l’inscription et peut être contrôlée.
          </li>
          <li>
            Chaque personne ne peut détenir qu’un seul compte personnel. Les informations fournies
            doivent être exactes, complètes et tenues à jour.
          </li>
          <li>
            La vérification de l’adresse e-mail est obligatoire avant toute action sur la plateforme
            (profil, photos, messagerie, candidatures).
          </li>
          <li>
            Les agences et organismes de formation doivent fournir un justificatif d’existence (IFU
            ou RCCM) et être validés par notre équipe avant d’accéder aux profils. Un badge visible
            signale leur vérification.
          </li>
          <li>
            Vous êtes responsable de la confidentialité de vos identifiants. Toute activité réalisée
            depuis votre compte vous est imputable, sauf usage non autorisé signalé sans délai.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Rôle de la plateforme">
        <p>
          ModelBénin est un service de <strong>mise en relation</strong> entre des modèles, des
          agences vérifiées et des organismes de formation. La plateforme n’est pas partie aux
          contrats, castings ou prestations conclus entre ses membres.
        </p>
        <p>
          Elle ne garantit ni recrutement, ni rémunération, ni qualité d’une prestation, et ne
          perçoit aucune commission sur les contrats signés hors plateforme. Les conditions
          financières d’une collaboration doivent être négociées et formalisées directement entre
          les parties.
        </p>
      </LegalSection>

      <LegalSection title="4. Règles de conduite">
        <p>En utilisant ModelBénin, vous vous engagez à :</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Ne jamais demander ni proposer d’argent</strong> en échange d’un contrat de
            mannequinat, d’une sélection, d’un casting ou d’un hébergement. Aucune agence sérieuse
            ne facture la sélection d’un modèle.
          </li>
          <li>
            Ne publier aucun contenu sexuel, nudité, violent, haineux ou contraire à la dignité des
            personnes. Les photos de tiers ne peuvent être publiées sans leur accord écrit.
          </li>
          <li>
            Ne pas usurper l’identité d’une personne ou d’une organisation, ni créer de faux profil
            d’agence.
          </li>
          <li>
            Respecter la vie privée des membres : ne pas diffuser hors plateforme des messages,
            photos ou coordonnées obtenus par le service.
          </li>
          <li>
            Ne pas contourner les outils de sécurité, ni tenter d’accéder à des données ou à des
            espaces qui ne vous sont pas destinés.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Contenus et droits">
        <p>
          Les photos, vidéos, textes et informations publiés restent votre propriété. Vous accordez
          à ModelBénin une licence non exclusive, limitée à la durée de leur publication et au
          fonctionnement du service : stockage, affichage selon la visibilité choisie, modération et
          sauvegarde.
        </p>
        <p>
          Vous garantissez détenir les droits nécessaires sur les contenus publiés et disposez du
          consentement des personnes qui y figurent. Les métadonnées de localisation sont retirées à
          l’upload. La visibilité d’un profil peut être modifiée à tout moment depuis votre espace.
        </p>
      </LegalSection>

      <LegalSection title="6. Modération et sanctions">
        <p>
          Chaque photo est examinée par un humain avant publication. Les signalements sont traités
          par notre équipe. En cas de manquement aux présentes CGU, nous pouvons, selon la gravité
          et sans préavis :
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>retirer un contenu ;</li>
          <li>adresser un avertissement ;</li>
          <li>suspendre temporairement le compte ;</li>
          <li>
            supprimer définitivement le compte et, le cas échéant, signaler les faits aux autorités
            compétentes.
          </li>
        </ul>
        <p>
          La suspension immédiate est possible en cas de danger pour une personne, d’arnaque
          présumée ou de contenu interdit. Vous pouvez contester une décision en écrivant à{' '}
          <LegalPlaceholder>[e-mail de contact]</LegalPlaceholder>.
        </p>
      </LegalSection>

      <LegalSection title="7. Abonnements, options et paiements">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Les prix sont affichés en francs CFA (FCFA), toutes taxes comprises, sur la page{' '}
            <Link className="font-semibold text-brand-800 hover:text-brand-900" href="/tarifs">
              Tarifs
            </Link>
            . Le montant facturé est recalculé côté serveur au moment du paiement.
          </li>
          <li>
            Un abonnement est souscrit pour la période choisie (mensuelle ou annuelle). Il n’est pas
            reconduit automatiquement : vous pouvez le renouveler, changer de formule ou le résilier
            depuis votre espace.
          </li>
          <li>
            La résiliation met fin au renouvellement mais laisse l’abonnement actif jusqu’à la fin
            de la période déjà payée. Aucun remboursement au prorata n’est effectué.
          </li>
          <li>
            Les options à l’unité (badge, mise en avant) sont payées d’avance et ne sont pas
            remboursables une fois activées, sauf défaut technique imputable à la plateforme.
          </li>
          <li>
            Les paiements sont traités par un prestataire agréé. Nous ne stockons ni vos numéros de
            carte ni vos codes Mobile Money.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Disponibilité et responsabilité">
        <p>
          Nous mettons en œuvre les moyens raisonnables pour assurer la sécurité et la disponibilité
          du service, sans garantie d’absence d’interruption. La plateforme peut être suspendue
          temporairement pour maintenance, mise à jour ou raison de sécurité.
        </p>
        <p>
          Notre responsabilité ne saurait être engagée pour les informations publiées par les
          membres, les manquements d’une agence ou d’un modèle, ni le contenu des sites externes
          accessibles depuis la plateforme. Les présentes limitations s’appliquent dans les limites
          autorisées par la loi béninoise.
        </p>
      </LegalSection>

      <LegalSection title="9. Données personnelles">
        <p>
          Le traitement de vos données est décrit dans la{' '}
          <Link
            className="font-semibold text-brand-800 hover:text-brand-900"
            href="/confidentialite"
          >
            politique de confidentialité
          </Link>
          . Vous disposez d’un droit d’accès, de rectification, d’export, d’opposition et de
          suppression, exerçable depuis votre espace ou par e-mail à{' '}
          <LegalPlaceholder>[adresse]</LegalPlaceholder>.
        </p>
      </LegalSection>

      <LegalSection title="10. Modification des CGU">
        <p>
          Nous pouvons modifier les présentes CGU pour tenir compte de l’évolution du service ou de
          la réglementation. Toute modification importante est notifiée par e-mail au moins{' '}
          <LegalPlaceholder>[15]</LegalPlaceholder> jours avant son entrée en vigueur. La poursuite
          de l’utilisation du service vaut acceptation des CGU mises à jour.
        </p>
      </LegalSection>

      <LegalSection title="11. Droit applicable et litiges">
        <p>
          Les présentes CGU sont soumises au droit béninois, notamment au Code du numérique (loi n°
          2017-20 du 20 avril 2018, modifiée par la loi n° 2020-35 du 6 janvier 2021). En cas de
          litige, les parties s’efforcent d’abord de trouver une solution amiable. À défaut, les
          juridictions compétentes de Cotonou sont saisies, sous réserve des règles protectrices
          applicables aux consommateurs.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          Pour toute question relative aux présentes CGU :{' '}
          <LegalPlaceholder>[e-mail de contact]</LegalPlaceholder>. Les comptes connectés peuvent
          également signaler un contenu depuis chaque profil ou conversation.
        </p>
        <p>
          Voir aussi les{' '}
          <Link
            className="font-semibold text-brand-800 hover:text-brand-900"
            href="/mentions-legales"
          >
            mentions légales
          </Link>{' '}
          et la{' '}
          <Link className="font-semibold text-brand-800 hover:text-brand-900" href="/confiance">
            page Confiance &amp; sécurité
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
