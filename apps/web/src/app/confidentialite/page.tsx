import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPlaceholder, LegalSection, LegalShell } from '@/features/legal/components/LegalShell';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Comment ModelBénin collecte, protège et conserve vos données personnelles, et comment exercer vos droits.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Politique de confidentialité" updatedAt="5 novembre 2026">
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <strong>Version projet.</strong> Ce document doit être validé par un juriste béninois et
        complété avant l’ouverture publique. Les mentions entre crochets sont à renseigner. Il ne
        constitue pas encore un document contractuel définitif.
      </p>

      <LegalSection title="1. Qui sommes-nous">
        <p>
          <LegalPlaceholder>[ModelBénin]</LegalPlaceholder>, édité par{' '}
          <LegalPlaceholder>[raison sociale]</LegalPlaceholder>,{' '}
          <LegalPlaceholder>[adresse]</LegalPlaceholder>, Cotonou, Bénin, immatriculée sous le
          numéro <LegalPlaceholder>[RCCM/IFU]</LegalPlaceholder>, est responsable du traitement de
          vos données.
        </p>
        <p>
          Contact du responsable de la protection des données :{' '}
          <LegalPlaceholder>[e-mail du responsable]</LegalPlaceholder>. Le traitement fait l’objet
          d’une déclaration préalable auprès de l’Autorité de Protection des Données Personnelles
          (APDP), récépissé n° <LegalPlaceholder>[à compléter]</LegalPlaceholder>.
        </p>
      </LegalSection>

      <LegalSection title="2. Données que nous collectons">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Compte :</strong> nom, prénom, adresse e-mail, téléphone, mot de passe haché,
            rôle.
          </li>
          <li>
            <strong>Profil de modèle :</strong> date de naissance, ville, taille, mensurations,
            pointure, biographie, photos et expériences professionnelles.
          </li>
          <li>
            <strong>Organisations :</strong> nom de l’entité, numéro IFU/RCCM, justificatifs et
            représentant légal.
          </li>
          <li>
            <strong>Paiement :</strong> référence de transaction, montant et moyen de paiement. Nous
            ne stockons ni numéro de carte ni code Mobile Money : ils sont traités par notre
            prestataire de paiement.
          </li>
          <li>
            <strong>Techniques :</strong> adresse IP, appareil, journaux de connexion et cookies
            nécessaires.
          </li>
          <li>
            <strong>Communications :</strong> messages échangés sur la plateforme, conservés pour la
            sécurité et la modération.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Pourquoi nous les utilisons">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="py-2 pr-4 font-semibold text-slate-900">Finalité</th>
                <th className="py-2 font-semibold text-slate-900">Base légale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2 pr-4">Créer et gérer votre compte, vous mettre en relation</td>
                <td className="py-2">Exécution du contrat</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  Afficher vos photos et mensurations aux personnes que vous autorisez
                </td>
                <td className="py-2 font-semibold">Votre consentement explicite</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">
                  Vérifier les agences et votre identité, prévenir la fraude et les abus
                </td>
                <td className="py-2">Intérêt légitime / obligation légale</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Traiter les paiements et émettre les factures</td>
                <td className="py-2">Exécution du contrat, obligation légale</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Envoyer les notifications de service</td>
                <td className="py-2">Exécution du contrat</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Améliorer le service (statistiques anonymisées)</td>
                <td className="py-2">Intérêt légitime</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="4. Données sensibles et visibilité">
        <p>
          Vos photos et mensurations bénéficient d’une protection renforcée.{' '}
          <strong>Vous décidez de leur visibilité</strong> : privé, agences vérifiées, ou public
          (profils confirmés uniquement). Vous pouvez la modifier à tout moment depuis votre espace.
          Nous ne vendons jamais vos données. Les profils réservés aux agences ne sont pas indexés
          par les moteurs de recherche.
        </p>
        <p>
          Le passage d’un profil débutant à confirmé repose sur des expériences vérifiées par notre
          équipe. Les justificatifs d’expérience sont stockés dans un espace privé et consultés
          uniquement dans le cadre de la vérification, avec journalisation.
        </p>
      </LegalSection>

      <LegalSection title="5. Qui y a accès">
        <p>
          Seules les personnes que vous autorisez, nos équipes de modération et d’administration
          (accès tracé) et nos sous-traitants techniques (hébergement, stockage, e-mail/SMS,
          paiement), tenus par des engagements de confidentialité. Nous pouvons communiquer des
          données aux autorités sur demande légale.
        </p>
      </LegalSection>

      <LegalSection title="6. Transferts hors du Bénin">
        <p>
          Certains prestataires peuvent héberger des données hors du Bénin. Nous nous assurons qu’un
          niveau de protection adéquat est garanti et que les formalités auprès de l’APDP sont
          effectuées.
        </p>
      </LegalSection>

      <LegalSection title="7. Durée de conservation">
        <ul className="list-disc space-y-2 pl-5">
          <li>Compte actif : pendant toute la durée d’utilisation.</li>
          <li>
            Après suppression : suppression des photos et données de profil sous 30 jours ;
            sauvegardes purgées sous 90 jours.
          </li>
          <li>Données de facturation : 10 ans (obligation comptable).</li>
          <li>Journaux de sécurité : 12 mois.</li>
          <li>Comptes inactifs depuis 24 mois : avertissement puis suppression.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Vos droits">
        <p>
          Vous pouvez à tout moment accéder à vos données, les rectifier, les exporter, vous opposer
          à un traitement, retirer votre consentement ou demander la suppression de votre compte.
        </p>
        <p>
          Si vous disposez d’un compte, l’export et la suppression sont disponibles dans{' '}
          <Link
            className="font-semibold text-brand-800 hover:text-brand-900"
            href="/dashboard/compte"
          >
            Mon compte
          </Link>
          . Vous pouvez aussi écrire à <LegalPlaceholder>[adresse de contact]</LegalPlaceholder>.
          Nous répondons sous 30 jours. Vous pouvez saisir l’APDP en cas de litige.
        </p>
        <p>
          La suppression efface immédiatement votre profil, vos photos, vos justificatifs, vos
          expériences, vos organisations et vos conversations. Les données de facturation et les
          journaux de sécurité sont conservés pour les durées légales ; votre adresse e-mail est
          anonymisée.
        </p>
      </LegalSection>

      <LegalSection title="9. Mineurs">
        <p>
          La plateforme est <strong>réservée aux personnes de 18 ans et plus</strong>. Si nous
          constatons qu’un compte appartient à un mineur, nous le supprimons.
        </p>
      </LegalSection>

      <LegalSection title="10. Sécurité">
        <p>
          Chiffrement des échanges et des données sensibles, accès restreints, journalisation,
          vérification des agences et modération des contenus. Aucun système n’étant infaillible,
          nous vous informons et informons l’autorité compétente en cas de violation de données.
        </p>
      </LegalSection>

      <LegalSection title="11. Cookies">
        <p>
          Cookies strictement nécessaires (session et sécurité). Une mesure d’audience anonymisée
          pourra être mise en place uniquement avec votre accord.
        </p>
      </LegalSection>

      <LegalSection title="12. Modifications">
        <p>
          Nous vous informerons par e-mail de toute modification importante. La date de mise à jour
          figure en haut de cette page.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          Pour toute question : <LegalPlaceholder>[e-mail de contact]</LegalPlaceholder> —
          <LegalPlaceholder>[adresse postale]</LegalPlaceholder>, Cotonou, Bénin.
        </p>
        <p>
          Voir aussi les{' '}
          <Link
            className="font-semibold text-brand-800 hover:text-brand-900"
            href="/mentions-legales"
          >
            mentions légales
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
