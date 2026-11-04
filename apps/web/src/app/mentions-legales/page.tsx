import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPlaceholder, LegalSection, LegalShell } from '@/features/legal/components/LegalShell';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    'Éditeur, hébergement et informations légales du service ModelBénin, plateforme de mise en relation au Bénin.',
  robots: { index: true, follow: true },
};

export default function LegalNoticePage() {
  return (
    <LegalShell title="Mentions légales" updatedAt="5 novembre 2026">
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <strong>Version projet.</strong> Les informations entre crochets doivent être complétées et
        validées avant l’ouverture publique du service.
      </p>

      <LegalSection title="1. Éditeur du site">
        <ul className="space-y-2">
          <li>
            Raison sociale : <LegalPlaceholder>[raison sociale]</LegalPlaceholder>
          </li>
          <li>
            Forme juridique : <LegalPlaceholder>[forme juridique]</LegalPlaceholder>
          </li>
          <li>
            Siège social : <LegalPlaceholder>[adresse]</LegalPlaceholder>, Cotonou, Bénin
          </li>
          <li>
            RCCM / IFU : <LegalPlaceholder>[RCCM / IFU]</LegalPlaceholder>
          </li>
          <li>
            Contact : <LegalPlaceholder>[e-mail]</LegalPlaceholder> —{' '}
            <LegalPlaceholder>[téléphone]</LegalPlaceholder>
          </li>
          <li>
            Directeur de la publication : <LegalPlaceholder>[nom]</LegalPlaceholder>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Hébergement">
        <p>
          Le site et l’API sont hébergés par{' '}
          <LegalPlaceholder>[prestataire d’hébergement]</LegalPlaceholder>,{' '}
          <LegalPlaceholder>[adresse du prestataire]</LegalPlaceholder>. Le stockage des fichiers
          est assuré par un service compatible S3, avec accès privé et URLs signées de courte durée.
        </p>
      </LegalSection>

      <LegalSection title="3. Objet du service">
        <p>
          ModelBénin met en relation des modèles, des agences vérifiées et des organismes de
          formation au Bénin. La plateforme n’est pas partie aux contrats conclus entre un modèle et
          une agence ou un organisme : elle ne garantit ni recrutement, ni rémunération, ni
          prestation.
        </p>
        <p>
          L’accès est réservé aux personnes de 18 ans et plus. Les agences et organismes doivent
          fournir un justificatif IFU ou RCCM et être validés par notre équipe avant d’accéder aux
          profils.
        </p>
      </LegalSection>

      <LegalSection title="4. Propriété intellectuelle">
        <p>
          La marque, l’interface, les textes et les éléments graphiques de ModelBénin sont protégés.
          Les photos et contenus publiés par les membres restent leur propriété ; ils accordent à la
          plateforme une licence limitée au fonctionnement du service, dans les limites de la
          visibilité choisie.
        </p>
      </LegalSection>

      <LegalSection title="5. Règles de conduite">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Interdiction de demander ou de proposer de l’argent en échange d’un contrat de
            mannequinat.
          </li>
          <li>
            Interdiction des contenus sexuels, des photos de tiers sans leur accord et de
            l’usurpation d’identité.
          </li>
          <li>
            Les comportements abusifs peuvent être signalés et entraîner une suspension immédiate.
          </li>
        </ul>
        <p>
          Consultez la{' '}
          <Link
            className="font-semibold text-brand-800 hover:text-brand-900"
            href="/confidentialite"
          >
            politique de confidentialité
          </Link>{' '}
          pour le détail des données traitées et de vos droits.
        </p>
      </LegalSection>

      <LegalSection title="6. Responsabilité">
        <p>
          Nous mettons en œuvre les moyens raisonnables pour sécuriser la plateforme et modérer les
          contenus, sans garantir l’exactitude des informations publiées par les membres ni la
          disponibilité permanente du service. Les liens externes ne sauraient engager notre
          responsabilité.
        </p>
      </LegalSection>

      <LegalSection title="7. Droit applicable">
        <p>
          Les présentes mentions sont soumises au droit béninois. En cas de litige, les juridictions
          compétentes de Cotonou seront saisies, sous réserve des règles protectrices applicables
          aux consommateurs.
        </p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>
          Pour toute question relative au service ou pour signaler un contenu :{' '}
          <LegalPlaceholder>[e-mail de contact]</LegalPlaceholder>. Les comptes connectés peuvent
          aussi utiliser la messagerie et les signalements depuis leur espace.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
