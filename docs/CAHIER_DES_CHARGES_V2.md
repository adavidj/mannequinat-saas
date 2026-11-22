# ModelBénin — Cahier des charges v2 : du MVP au lancement

*Version 2.0 — 22 novembre 2026. Cette version remplace les parties produit, planning et devis de la v1. La v1 reste la référence pour l'UML, la sécurité détaillée et la politique de confidentialité.*

## 1. Objet, sources et décisions arrêtées

**Objet** : définir ce qui reste à faire pour passer d'un MVP à 60-65 % à une plateforme exploitable, testée en pilote, puis lancée au Bénin.

**Sources croisées** : cahier des charges v1 (12 octobre), audit d'architecture (22 novembre, commit `262bec4`), business plan MODELINK (ChatGPT, 22 novembre).

| # | Décision | Pourquoi |
| --- | --- | --- |
| D1 | Les castings et candidatures entrent dans la phase 1 | C'est la boucle de valeur manquante ; sans elle, les recruteurs n'ont aucune raison de revenir |
| D2 | Aucun paiement réel avant que les avantages payants soient réellement débloqués | L'audit montre qu'on peut payer sans rien recevoir (risque critique) |
| D3 | Un modèle ne paie jamais pour accéder aux opportunités ni pour postuler | Principe commun au BP et à la v1 ; la limite de 2 candidatures gratuites par mois est supprimée |
| D4 | Le revenu vient d'abord des recruteurs et agences | Ils retirent un gain de temps mesurable |
| D5 | Prix à tester : Pro 5 000 et Business 12 000 FCFA par mois (au lieu de 15 000 et 40 000) | Plus réaliste pour 20 à 30 recruteurs en année 1 ; à valider en pilote |
| D6 | Objectifs année 1 : 300 à 500 profils, 20 à 30 recruteurs vérifiés, 5 à 10 clients payants | La cible v1 (5 000 profils, 50 agences) n'était pas fondée |
| D7 | La messagerie livrée est conservée | Elle porte les protections anti-arnaque (blocage, anti-coordonnées, signalement) |
| D8 | Filtres taille et âge via des tranches dérivées, pas via le déchiffrement | Garde le chiffrement des mensurations exactes |
| D9 | MVP réservé aux 18 ans et plus | Décision déjà prise ; le 16-17 ans reste en phase ultérieure |
| D10 | Un pilote fermé précède tout lancement public | Valider l'usage avant d'investir en acquisition |
| D11 | Le nom MODELINK n'est pas adopté tant que domaine, réseaux et OAPI ne sont pas vérifiés ; le code garde `ModelBénin` | Éviter un renommage inutile |

**Corrections apportées à la v1** : seuil de rentabilité de 40 agences Starter retiré (non testé), castings avancés de la phase 2 vers la phase 1, objectifs et prix révisés, devis recalculé sur le reste à faire.

## 2. Point de départ et traçabilité des exigences

| Réf. | Exigence | État (audit) | Cible v2 | Lot |
| --- | --- | --- | --- | --- |
| F1 | Inscription, vérification, rôles | Partiel | Verrouillage progressif, contrôle des mots de passe compromis ; OTP SMS différé | 1 |
| F2 | Parcours débutant | Livré | Consentement CGU horodaté en base | 6 |
| F3 | Parcours confirmé | Partiel | Spécialités, liens externes, disponibilité | 4 |
| F4 | Visibilité | Partiel | Profils publics SEO après validation du pilote | 8 |
| F5 | Recherche et filtres | Partiel | Tranches dérivées, spécialités, disponibilité | 4 |
| F6 | Messagerie | Livré | Quota lié au plan | 3 |
| F7 | Castings et candidatures | Absent | Livraison complète | 2 |
| F8 | Abonnements et paiements | Partiel | Entitlements, relances, prix en configuration unique | 3 |
| F9 | Formations | Absent | Différé après le go | — |
| F10 | Back-office | Livré | Consultation de l'audit, délais de traitement | 5, 6 |
| F11 | Notifications | Partiel | Préférences e-mail, notifications de casting ; SMS différé | 2, 5 |
| F12 | Export et suppression | Livré | Délais de rétention et confirmation différée | 6 |

## 3. Objectifs mesurables

**Indicateur central** : nombre de mises en relation qualifiées par mois. Une mise en relation est qualifiée quand une candidature passe au statut `RETENUE` ou quand le recruteur marque une conversation comme « suite donnée ».

**Objectifs à 12 mois** : 300 à 500 profils, 20 à 30 recruteurs vérifiés, 30 à 50 castings publiés, 100 candidatures qualifiées ou mises en relation abouties, 5 à 10 clients payants récurrents.

**Indicateurs suivis chaque semaine** : talents inscrits, profils complétés, recruteurs vérifiés, castings publiés, candidatures, taux de réponse des recruteurs, mises en relation qualifiées, signalements ouverts et traités.

## 4. Lots de travail

### Lot 0 — Gel commercial (1 jour)

- Variable `BILLING_MODE` (`disabled`, `simulation`, `live`) ; `live` interdit tant que le lot 3 n'est pas validé.
- La page Tarifs n'affiche comme disponible que ce qui est livré ; le reste est marqué « bientôt ».
- La page Talents est étiquetée « exemples illustratifs » ou alimentée par de vrais profils consentants.

**Acceptation** : aucun paiement réel n'est possible ; aucune promesse affichée n'est absente du produit.

### Lot 1 — Durcissement de sécurité P0 (8 jours)

| Chantier | Réf. audit | Critère d'acceptation |
| --- | --- | --- |
| Supprimer les secrets de repli, valider l'environnement au démarrage | S2 | L'API refuse de démarrer si `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` ou `DATA_ENCRYPTION_KEY` manquent ou sont faibles |
| En-têtes de sécurité (Helmet, CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) | S1 | Aucun défaut majeur sur un scan d'en-têtes ; CSP testée sur les pages principales |
| 2FA TOTP obligatoire pour les administrateurs | S3 | Un admin sans 2FA ne peut pas accéder au back-office |
| Verrouillage progressif par compte | S4 | Délai croissant après échecs répétés, message neutre, journalisé |
| Rotation du refresh atomique avec détection de réutilisation | S13, S14 | Deux requêtes parallèles ne déconnectent pas l'utilisateur ; une réutilisation révoque la famille de jetons ; TTL pris dans la configuration |
| `@EmailVerifiedRequired` sur `account` et `billing` | S6 | Export, suppression et paiement exigent un e-mail vérifié |
| Corriger le limiteur Redis (injection, port 6379, atomicité, durée de blocage) | S5 | Test automatisé du blocage et de l'expiration |

### Lot 2 — Castings et candidatures (F7, 20 jours)

**Modèle de données**

- `Casting` : organisation, titre, description, catégorie, ville, date de prestation, date limite, type de rémunération, détail de rémunération, ouvert aux débutants (oui/non), critères, statut.
- `Application` : casting, profil, message court, statut, dates, consentement de partage du profil.

**Statuts** : casting `BROUILLON → EN_VERIFICATION → PUBLIE → CLOS` (ou `REFUSE`) ; candidature `ENVOYEE → VUE → PRESELECTIONNEE → RETENUE` (ou `DECLINEE`, `RETIREE`).

**Règles de gestion**

1. Seule une organisation vérifiée peut publier ; chaque annonce est relue avant publication (délai cible 24 h).
2. La rémunération est obligatoire : rémunérée, non rémunérée ou en nature. Une annonce sans cette information est refusée.
3. Détection automatique des demandes d'argent (frais de dossier, caution, paiement préalable, hébergement) : l'annonce passe en relecture renforcée.
4. Critères autorisés : ville, tranche d'âge, tranche de taille, spécialité, expérience, disponibilité. Interdits : origine ethnique, religion, orientation sexuelle, état de santé.
5. Une candidature par profil et par casting ; le candidat peut la retirer.
6. Un débutant ne postule qu'aux castings marqués « ouverts aux débutants ».
7. En postulant, le modèle voit un texte clair : « J'autorise cette organisation à consulter mon profil pour ce casting ». Ce consentement est horodaté. Sans candidature, un profil débutant reste invisible de l'organisation.
8. Le recruteur ne voit que les candidats de ses propres castings et ne modifie que ses propres annonces.
9. Chaque changement de statut déclenche une notification (in-app et e-mail) et une entrée dans le journal d'audit.
10. Un casting échu passe automatiquement en `CLOS`.

**Écrans** : liste et détail des castings (modèles), formulaire de publication et tableau des candidatures (recruteurs), file de modération des annonces (admin), « Mes candidatures » avec suivi de statut.

**Acceptation** : le parcours complet (publication, modération, candidature, présélection, sélection, notification) fonctionne de bout en bout ; un test e2e le couvre ; un modèle ne peut ni voir ni modifier la candidature d'un autre (test IDOR).

### Lot 3 — Entitlements et monétisation (F8, 10 jours)

Un service `EntitlementsService` répond à « ce compte peut-il faire X ? » et est appelé par photos, découverte, messagerie, castings et statistiques. Tous les prix et quotas vivent dans une seule configuration partagée (fin de la duplication `billing.catalog.ts` / `plans.ts`).

| Plan | Prix indicatif (FCFA / mois) | Contenu livré |
| --- | --- | --- |
| Modèle Gratuit | 0 | Profil, 5 photos, candidatures illimitées, messagerie |
| Modèle Premium | 2 000 | 30 photos, statistiques de vues |
| Recruteur Découverte | 0 | Page d'organisation, 1 casting actif, 5 nouveaux contacts par mois |
| Recruteur Pro | 5 000 | 3 castings actifs, candidatures centralisées, favoris, 30 contacts par mois |
| Recruteur Business | 12 000 | 10 castings actifs, filtres avancés, shortlists, statistiques, 100 contacts par mois |
| Organisation | Sur devis | Plusieurs utilisateurs, accompagnement |

Quotas et prix sont des hypothèses de test. Un plafond quotidien anti-abus (10 nouvelles conversations) s'ajoute au quota mensuel.

**Pendant le pilote** : les recruteurs pilotes disposent du plan Business gratuitement, en échange de retours d'expérience ; les droits sont déjà appliqués par le code.

**Hors lot, après le go** : boost de profil, casting sponsorisé (2 000 à 5 000 FCFA), badge « vérifié ». Le badge correspond à une vérification d'identité humaine, facturée au prix coûtant après le pilote, et ne modifie jamais le classement.

**Acceptation** : chaque ligne du tableau est testée (refus au-delà du quota, déblocage après paiement, retour au plan gratuit à l'expiration) ; aucune fonction vendue n'est absente ; relance d'impayé et annulation fonctionnent.

### Lot 4 — Recherche, filtres et shortlists (F3, F5, 10 jours)

- Champs dérivés non sensibles calculés à l'enregistrement : `ageBand` (18-20, 21-25, 26-30, 31-35, 36 et plus) et `heightBand` (moins de 160, 160-169, 170-174, 175-179, 180 et plus), indexés. Les valeurs exactes restent chiffrées. Le consentement l'indique clairement.
- Spécialités : mode et éditorial, commercial et publicité, beauté, défilé, photo, e-commerce, vidéo et publicité. Ajout des liens externes et de la disponibilité.
- Filtres : ville, niveau, tranches d'âge et de taille, spécialité, expérience, disponibilité.
- Favoris et shortlists pour les organisations (modèles `Shortlist` et `ShortlistItem`).

**Acceptation** : un filtre par tranche retourne les bons profils, sans jamais exposer une mensuration exacte ; les shortlists sont privées à l'organisation.

### Lot 5 — Qualité et exploitation (21 jours)

| Chantier | Critère d'acceptation |
| --- | --- |
| Tests e2e Playwright : inscription, vérification, profil, photo, modération ; connexion, refresh, tableau de bord ; casting, candidature, statut ; paiement, webhook, abonnement ; export et suppression | 5 parcours verts en CI |
| Couverture mesurée | 40 % puis 60 % sur la logique métier, seuil bloquant en CI |
| Observabilité : route `/health`, logs structurés, Sentry (web et API), alertes sur erreurs 5xx et échecs de webhook | Une panne simulée déclenche une alerte |
| Sauvegardes : dump quotidien chiffré, rétention définie, restauration testée | Restauration réussie, documentée, temps mesuré |
| CI/CD : Dependabot, `pnpm audit`, analyse statique (CodeQL), build Docker, déploiement staging puis production | Déploiement staging automatique après fusion dans `dev` |
| Nettoyage : `packages/shared` réellement utilisé, dépendances de la racine déplacées, TanStack Query utilisé ou retiré, gabarit des features appliqué | Plus de types dupliqués entre API et web |
| Performance : `next/image`, formats modernes, dimensions explicites, polices préchargées | Page principale sous 3 s en 4G simulée |

### Lot 6 — Conformité et confiance (8 jours de développement + conseil externe)

- Consentement CGU horodaté en base ; registre des consentements.
- Politique de rétention appliquée par tâches planifiées : journal d'audit 12 mois, jetons expirés, comptes inactifs 24 mois après avertissement.
- Écran admin en lecture seule du journal d'audit.
- Dossier APDP : préparer une demande d'autorisation préalable (articles 394 et 407, photos pouvant révéler l'origine ethnique), la déclaration (article 405), l'analyse d'impact (article 428) et le registre des traitements. À valider avec un juriste béninois.
- Liste des sous-traitants et transferts (Resend, FedaPay, Cloudflare R2) ; procédure de violation de données ; référent protection des données nommé.
- CGU, politique de confidentialité et mention « aucune garantie de recrutement » relues par le juriste.
- Charte anti-arnaque publiée ; procédure d'incident écrite.

**Délais de traitement visés** : vérification d'un recruteur sous 48 h, relecture d'une annonce sous 24 h, accusé de réception d'un signalement sous 24 h, traitement sous 72 h (immédiat pour un risque grave).

### Lot 7 — Pilote fermé (10 jours de développement, 4 à 6 semaines)

- **En parallèle dès la semaine 1, sans code** : 15 à 20 entretiens (talents, recruteurs, écoles et agences), liste de 50 prospects qualifiés, test des prix.
- Participants : 30 à 50 talents, 5 à 10 recruteurs vérifiés, 2 à 3 partenaires.
- Jeu de données de démonstration reproductible (seed), instrumentation des indicateurs, tableau de bord de pilotage, support et corrections rapides.

### Lot 8 — Lancement public à Cotonou et Abomey-Calavi (10 jours)

Si, et seulement si, le pilote est concluant : profils publics SEO pour les confirmés consentants (`noindex` pour les débutants, filigrane des aperçus), `robots.txt`, `sitemap.xml`, métadonnées, finitions, campagne de lancement.

### Différé jusqu'au go

Formations (F9), boosts, casting sponsorisé, SMS et OTP, ouverture aux 16-17 ans, multi-pays, application mobile, matching, renouvellement automatique des paiements. Le matching, s'il voit le jour, devra rester explicable et ne jamais noter l'apparence.

## 5. Priorisation MoSCoW

| Priorité | Contenu |
| --- | --- |
| Must | Lots 0, 1, 2, 3, 5, 6 |
| Should | Lot 4 (filtres et shortlists), pilote (lot 7) |
| Could | Lot 8 (profils publics et lancement) |
| Won't (pour l'instant) | Formations, boosts, SMS, mineurs, multi-pays, mobile, matching |

## 6. Matrice des rôles et permissions (ajouts v2)

| Action | Modèle | Recruteur / agence | Admin |
| --- | --- | --- | --- |
| Publier un casting | Non | Oui, organisation vérifiée | Non (modère) |
| Voir les castings publiés | Oui | Oui (les siens et ceux publiés) | Oui |
| Postuler | Oui, selon l'ouverture aux débutants | Non | Non |
| Voir les candidatures d'un casting | Les siennes seulement | Celles de ses castings | Oui, journalisé |
| Changer le statut d'une candidature | Retirer la sienne | Pour ses castings | Non |
| Voir un profil débutant | Le sien | Seulement un candidat de son casting ou une découverte autorisée | Oui, journalisé |
| Consulter le journal d'audit | Non | Non | Lecture seule |

## 7. Exigences non fonctionnelles complémentaires

- **Disponibilité** : 99,5 % à partir du lancement public ; objectifs de reprise de 24 h de données perdues au plus et 4 h d'interruption au plus.
- **Performance** : 3 s en 4G sur la page principale ; images responsives.
- **Accessibilité** : contrastes, navigation clavier, textes alternatifs sur les pages publiques.
- **Langue** : français ; textes prêts pour l'ajout de l'anglais.
- **Configuration** : aucun prix, quota ni pays codé en dur.

## 8. Planning et portes de décision

| Période | Contenu |
| --- | --- |
| Semaines 1-2 | Lots 0 et 1 ; démarrage des entretiens et du dossier APDP |
| Semaines 3-6 | Lot 2 (castings) |
| Semaines 5-8 | Lots 3 et 4 (entitlements, filtres) |
| Semaines 6-9 | Lots 5 et 6 (qualité, exploitation, conformité) |
| Semaines 10-15 | Pilote fermé |
| Semaine 16 | Bilan et décision |
| Semaines 17-18 | Lot 8 et lancement, si go |

Ce calendrier suppose un développeur à temps plein. À temps partiel, compter environ 30 semaines.

**Porte 1 — fin du lot 1** : tous les points P0 de l'audit sont clos ; aucun défaut critique de sécurité connu.

**Porte 2 — entrée en pilote** : lots 0 à 3 livrés, parcours e2e verts, sauvegarde restaurée avec succès, CGU en ligne, dossier APDP déposé.

**Porte 3 — fin du pilote (seuils proposés)** : au moins 3 recruteurs ont publié 2 castings ou plus ; au moins 30 talents actifs ; au moins 10 mises en relation qualifiées ; au moins 60 % des candidatures reçoivent une réponse ; aucun incident de sécurité grave ; au moins 2 recruteurs prêts à payer ; coût de modération soutenable. Si ces seuils ne sont pas atteints, on réduit le périmètre au lieu d'ajouter des fonctions.

**Porte 4 — avant le lancement public** : autorisation ou récépissé de l'APDP, validation juridique des textes, monitoring actif, procédure de support, première campagne prête.

## 9. Devis du reste à faire

*Hypothèses : 30 000 FCFA par jour-homme, 10 % d'imprévus, hors taxes. Base de discussion.*

| Phase | Contenu | Jours | Montant (FCFA) |
| --- | --- | --- | --- |
| A. Sécuriser | Lots 0 et 1 | 9 | 270 000 |
| B. Boucle casting | Lots 2, 3 et 4 | 40 | 1 200 000 |
| C. Fiabiliser | Lots 5 et 6 | 29 | 870 000 |
| D. Pilote | Lot 7 | 10 | 300 000 |
| E. Lancement | Lot 8 | 10 | 300 000 |
| Gestion de projet | — | 8 | 240 000 |
| **Sous-total** |  | **106** | **3 180 000** |
| Imprévus 10 % |  |  | 318 000 |
| **Total** |  |  | **3 498 000** |

**Coûts externes à prévoir (estimations à confirmer par devis)** : conseil juridique et dossier APDP 100 000 à 250 000 ; communication et animation du pilote 150 000 à 400 000 ; hébergement et outils sur 12 mois 100 000 à 600 000 selon les offres retenues. Soit environ 350 000 à 1 250 000 FCFA. Si le développement est assuré par le fondateur, ce sont les seuls décaissements, mais le temps de travail reste un coût réel.

**Équilibre** : avec un revenu moyen de 8 000 FCFA par compte payant, environ 7 comptes couvrent 50 000 FCFA mensuels d'hébergement et d'outils. Ils ne couvrent ni le temps de développement ni la modération. Ce projet se pilote comme une activité légère, pas comme une entreprise à financer.

## 10. Risques principaux

| Risque | Mesure |
| --- | --- |
| Démarrage à froid : pas assez de recruteurs ni de talents | Recruter les recruteurs avant toute campagne grand public ; pilote encadré |
| Les recruteurs ne paient pas | Entretiens de prix, plan gratuit limité, démonstration du gain de temps |
| Faux castings et arnaques | Vérification manuelle, détection de demandes d'argent, signalement, suspension rapide |
| Majorité auto-déclarée (mineur inscrit) | Contrôle à l'inscription, signalement, vérification d'identité humaine en cas de doute, suppression immédiate |
| Fuite de photos | Bucket privé, URLs signées courtes, journal d'audit, test de restauration et d'accès |
| Paiement sans contrepartie | Lot 0 et lot 3 avant toute activation |
| Charge de modération | Délais visés, outils d'admin, quotas par plan |
| Dépendance aux prestataires (FedaPay, Resend) | Webhooks idempotents, surveillance, solution de repli documentée |
| Capacité de l'équipe | Respecter l'ordre des lots ; ne rien ajouter avant la porte 3 |

## 11. Définition de « terminé » pour le lancement public

**Produit** : boucle casting complète, entitlements appliqués, filtres par tranches, notifications, pages Tarifs et Talents honnêtes.

**Technique** : lint, typecheck, tests et build verts ; 5 parcours e2e verts ; couverture d'au moins 60 % sur la logique métier ; aucune vulnérabilité haute non traitée ; secrets validés au démarrage ; en-têtes de sécurité actifs ; 2FA admin ; sauvegardes restaurées avec succès ; monitoring et alertes actifs.

**Conformité** : démarches APDP faites, CGU et confidentialité relues par un juriste, consentements horodatés, rétention appliquée, procédure de violation de données écrite.

**Exploitation** : processus de vérification, de modération et de support documentés, avec un responsable nommé ; tableau de bord des indicateurs en place.

**Commercial** : au moins 5 recruteurs actifs, 30 talents actifs, prix validés en pilote, première campagne prête.
