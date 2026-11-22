# Audit d'architecture et d'avancement — ModelBénin

- **Date** : 22 novembre 2026
- **Périmètre** : monorepo complet (`apps/api`, `apps/web`, `packages/shared`), configuration, CI et documentation.
- **Référentiel** : `docs/CAHIER_DES_CHARGES.md` (édition du 12 octobre 2026).
- **Méthode** : revue statique du code, exécution des vérifications locales, comparaison exigence par exigence.

> Commit de référence : `262bec4` (`feat(billing): abonnements, factures et historique de paiement`), plus quelques modifications locales non commitées (page CGU, pages légales, formulaire d'inscription).

**Limites de l'audit** : pas de test d'intrusion, pas de mesure de couverture instrumentée, pas d'accès à un environnement de production, pas de test de charge. Les conclusions de sécurité portent sur le code et la configuration présents dans le dépôt.

---

## 1. Synthèse exécutive

Le projet n'est plus un squelette : c'est un **MVP fonctionnel, cohérent et sérieusement construit** sur son cœur de métier. L'authentification, les profils, les photos privées, la vérification des agences, la découverte, la messagerie encadrée, la modération, les notifications, la facturation et les droits RGPD sont implémentés de bout en bout, avec une vraie séparation API / front / BFF. Les vérifications locales passent toutes (`lint`, `typecheck`, `test`, `build`), et 82 tests unitaires sont verts.

Trois réserves majeures empêchent cependant de parler de « plateforme prête à exploiter » :

1. **La monétisation est factice dans ses effets.** Le catalogue, le checkout FedaPay, les webhooks signés et les factures existent, mais **aucun avantage payant n'est débloqué** : pas de limite 5/30 photos, pas de boost, pas de castings, pas de statistiques, pas de filtres avancés, pas de quota de contacts étendu. Un utilisateur peut payer et ne rien recevoir. C'est à la fois un risque produit, commercial et juridique.
2. **Le socle d'exploitation et de sécurité n'est pas au niveau production.** Pas de Helmet/CSP, secrets JWT avec valeurs de repli silencieuses, pas de 2FA admin, pas de verrouillage progressif par compte, pas d'antivirus, pas de supervision, pas de sauvegardes documentées.
3. **Le périmètre fonctionnel reste celui d'un MVP partiel.** Les castings/candidatures (F7), les formations (F9), les filtres chiffrés (F5), le SMS (F11) et le badge vérifié sont absents ou partiels, alors qu'ils sont vendus sur la page Tarifs.

Le reste de ce document détaille l'architecture réelle, confronte chaque exigence au code, puis propose un plan d'action priorisé.

### 1.1 Maturité par domaine

| Domaine | Niveau | Justification courte |
| --- | --- | --- |
| Architecture monorepo | **Bon** | Séparation claire, modules par domaine, BFF, conventions stables |
| API métier | **Bon** | 12 modules, validation Zod, RBAC, audit, idempotence paiement |
| Modèle de données | **Bon** | 16 modèles, contraintes, chiffrement colonne, migrations versionnées |
| Front / UX | **Bon** | 14 pages publiques/auth, 11 espaces dashboard, design éditorial abouti |
| Sécurité applicative | **Moyen** | Bonnes pratiques auth, mais en-têtes, secrets, 2FA et anti-abus incomplets |
| Tests | **Faible** | 82 tests unitaires, 0 test web, 0 e2e, couverture non mesurée |
| CI/CD | **Moyen** | CI qualité complète, mais aucun déploiement ni scan sécurité |
| Conformité | **Moyen** | Pages légales + export/suppression, mais APDP, registre et rétention absents |
| Monétisation | **Faible** | Paiement encaissable, contreparties non implémentées |
| Exploitation / observabilité | **Faible** | Pas de healthcheck, Sentry, logs centralisés ni sauvegardes documentées |

### 1.2 Points forts

- **Authentification maison solide** : Argon2id, access token 15 min, refresh opaque 7 jours haché en base, rotation, cookies `HttpOnly`/`SameSite=Lax`, vérification e-mail, reset à usage unique, journal d'audit.
- **Sécurité des données sensibles** : mensurations et date de naissance chiffrées en AES-256-GCM au repos ; photos en bucket privé, URLs signées de 5 minutes, EXIF supprimé, type réel vérifié par magic bytes.
- **Mise en relation réellement encadrée** : découverte réservée aux organisations vérifiées, blocage par le modèle, quota de conversations, détection de coordonnées personnelles dans les messages, signalement.
- **Back-office opérationnel** : vérification des agences, modération des photos, vérification des expériences, gestion des signalements, suspension d'utilisateurs, statistiques.
- **Paiement correctement structuré** : montants recalculés côté serveur, webhook HMAC en temps constant, idempotence par `claimed.count`, factures et historique.
- **RGPD by design** : export complet des données, suppression avec anonymisation du compte et nettoyage du stockage.

### 1.3 Risques principaux

| # | Risque | Gravité | Impact |
| --- | --- | --- | --- |
| R1 | Paiement sans contrepartie (aucun entitlement) | **Critique** | Perte de confiance, litiges, risque juridique |
| R2 | Secrets JWT de repli + absence d'en-têtes de sécurité | **Critique** | Compromission de session si mal déployé |
| R3 | F5 (filtres taille/âge/mensurations) impossible avec le chiffrement actuel | **Élevé** | Promesse commerciale non tenue |
| R4 | Aucun test e2e sur auth, paiement, permissions | **Élevé** | Régressions invisibles |
| R5 | Pas d'observabilité ni de sauvegardes documentées | **Élevé** | Panne non détectée, perte de données |
| R6 | Pages publiques « Talents » fictives, aucun profil public réel | **Moyen** | Confusion, crédibilité, acquisition |
| R7 | Rotation du refresh token non atomique | **Moyen** | Déconnexions aléatoires en navigation parallèle |
| R8 | `packages/shared` vide, types dupliqués | **Moyen** | Dérive des contrats API/web |

---

## 2. Architecture réelle

### 2.1 Vue d'ensemble

```
Navigateur
   │  HTTPS, cookies HttpOnly (mb_access, mb_refresh, mb_user)
   ▼
Next.js 16 (apps/web)
   ├─ Server Components : lecture via apiFetch() + cookies
   ├─ Route handlers /api/auth/* : login, register, refresh, logout…
   └─ BFF /api/proxy/[...path] : injecte le Bearer, relaie vers l'API
   │
   ▼
NestJS 11 (apps/api)
   ├─ Guards globaux : JwtAuth → Roles → EmailVerified → Throttler
   ├─ 12 modules métier (auth, profils, photos, organisations, découverte…)
   ├─ Prisma 6 ──────────────► PostgreSQL 17
   ├─ ioredis ───────────────► Redis 7 (rate limiting)
   ├─ AWS SDK S3 ────────────► MinIO (dev) / Cloudflare R2 (prod)
   ├─ Resend ────────────────► e-mails transactionnels
   └─ FedaPay ───────────────► Mobile Money / carte
```

### 2.2 Stack et versions

| Couche | Technologie | Version | Commentaire |
| --- | --- | --- | --- |
| Gestion monorepo | pnpm workspaces | 11.16.0 | Node ≥ 22, CI sur Node 24 |
| API | NestJS | 11.1.6 | Swagger sur `/api/docs` |
| ORM | Prisma | 6.17.1 | 8 migrations versionnées |
| Base | PostgreSQL | 17 (CI) | Contraintes et index présents |
| Cache / limites | Redis + ioredis | 7 / 6.0 | Stockage custom du throttler |
| Fichiers | S3 compatible | — | MinIO en local, R2 en production |
| Images | Sharp | 0.35.5 | Conversion WebP, suppression EXIF |
| Front | Next.js | 16.4.2 | App Router, Turbopack, `proxy.ts` |
| UI | React + Tailwind | 19.2 / 3.4 | Design system maison |
| Formulaires | RHF + Zod | 7.65 / 4.x | Côté web |
| Data fetching | TanStack Query | 5.90 | **Installé mais non utilisé** |
| 3D | three.js | 0.187 | Import dynamique, desktop uniquement |

### 2.3 Modules API

| Module | Responsabilité | Routes principales |
| --- | --- | --- |
| `auth` | Inscription, login, vérification e-mail, refresh, reset | `POST /auth/*` |
| `account` | Export RGPD, suppression définitive | `GET /account/export`, `DELETE /account` |
| `users` | Administration des comptes | `GET/PATCH /admin/users` |
| `profiles` | Profil modèle, expériences, justificatifs | `POST/GET/PATCH /profiles`, `/profiles/me/experiences` |
| `photos` | Upload sécurisé, URLs signées, modération | `/photos`, `/admin/photos` |
| `organizations` | Agences/organismes, vérification IFU/RCCM | `/organizations`, `/admin/organizations` |
| `discovery` | Recherche de modèles pour agences vérifiées | `GET /discovery/models` |
| `messaging` | Conversations, messages, blocage, signalement | `/conversations` |
| `reports` | Signalements et file admin | `POST /reports`, `/admin/reports` |
| `notifications` | Notifications in-app et e-mail | `/notifications` |
| `admin` | Statistiques globales | `GET /admin/stats` |
| `billing` | Abonnements, paiements, factures, webhook | `/billing/*`, `POST /billing/webhook/:provider` |

### 2.4 Modèle de données

16 modèles : `User`, `ModelProfile`, `Photo`, `Experience`, `Organization`, `Conversation`, `ProfileOrganizationBlock`, `Message`, `Subscription`, `Payment`, `Report`, `Notification`, `AuditLog`, `EmailVerificationToken`, `PasswordResetToken`, `RefreshToken`.

Points notables :

- **Séparation compte / profil** : `User` porte l'identité et le rôle ; `ModelProfile` porte les données mannequin, dont les champs chiffrés.
- **Consentement de visibilité porté par la photo** : `visibilityConsent` + `visibilityConsentAt`, propagés quand le profil change de visibilité (`profiles.service.ts`).
- **Blocage orienté organisation** : `ProfileOrganizationBlock` empêche une agence bloquée de revoir le profil, y compris dans la découverte.
- **Paiement** : `Subscription` (plan, statut, période) et `Payment` (référence marchande, provider, statut, idempotence).
- **Traçabilité** : `AuditLog` avec acteur, action, entité, IP et user-agent.

### 2.5 Front Next.js

**Pages publiques et légales** : `/`, `/maison`, `/parcours`, `/talents`, `/tarifs`, `/confiance`, `/confidentialite`, `/mentions-legales`, `/cgu` (en cours d'ajout).

**Authentification** : `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`, `/verifier-email`.

**Dashboard** (11 espaces) : vue d'ensemble, profil, photos, expériences, découverte, messages, notifications, organisation, abonnement, compte, administration.

**Administration** (5 files) : expériences, organisations, photos, signalements, utilisateurs.

**Organisation du code** : 13 features (`auth`, `profiles`, `photos`, `experiences`, `discovery`, `messaging`, `notifications`, `organizations`, `billing`, `admin`, `account`, `dashboard`, `legal`). Chaque feature ne contient toutefois qu'un dossier `components/` ; le gabarit prévu par le cahier des charges (`hooks/`, `services/`, `schemas/`, `types/`, `index.ts`) n'est pas appliqué.

### 2.6 Flux d'authentification et BFF

1. `POST /api/auth/login` (route handler Next) appelle l'API Nest, reçoit `accessToken` + `refreshToken` + `user`.
2. Les trois valeurs sont stockées en cookies `HttpOnly` (`mb_access`, `mb_refresh`, `mb_user`), `SameSite=Lax`, `Secure` en production.
3. Les Server Components lisent l'état via `getSessionUser()` et appellent l'API avec `apiFetch()`, qui injecte le Bearer.
4. Les composants clients passent par `/api/proxy/[...path]`, qui relaie vers l'API avec le jeton du cookie.
5. `src/proxy.ts` (équivalent Next 16 du middleware) protège `/dashboard`, rafraîchit le jeton expiré et applique une table de rôles par préfixe.
6. L'API reste l'autorité : guards `JwtAuthGuard`, `RolesGuard`, `EmailVerifiedGuard`.

**Écart assumé au cahier des charges** : pas de NextAuth. Le choix d'une auth maison est cohérent, mieux contrôlé pour le refresh rotatif et le BFF, mais il reporte sur l'équipe la charge de la 2FA, du verrouillage de compte et de la gestion multi-appareils.

### 2.7 Stockage, chiffrement, fichiers

- **Chiffrement au repos** : `FieldEncryptionService` en AES-256-GCM pour `birthDate` et les mensurations (`heightCm`, `chestCm`, `waistCm`, `hipsCm`, `shoeSize`).
- **Photos** : bucket privé, clé `profiles/{profileId}/photos/{uuid}.webp`, conversion WebP, redimensionnement, suppression EXIF, URL signée de 300 s.
- **Contrôle d'accès** : chaque lecture vérifie le propriétaire ou le rôle admin ; les URLs de modération sont journalisées.
- **Limite** : pas d'antivirus, pas de détection de nudité, pas de filigrane, pas de `noindex` (il n'existe pas encore de page profil publique).

### 2.8 Paiements

- Catalogue serveur (`billing.catalog.ts`) : source de vérité des montants.
- Checkout : simulation hors production, redirection FedaPay si `BILLING_PROVIDER=FEDAPAY`.
- Webhook : HMAC-SHA256, comparaison `timingSafeEqual`, secret obligatoire en production, idempotence par mise à jour conditionnelle du paiement.
- Factures : générées côté API à partir du paiement et de la période d'abonnement.
- **Limite structurante** : `BillingModule` n'est importé par aucun autre module. Aucune fonctionnalité ne consulte l'abonnement pour autoriser ou limiter un usage.

### 2.9 CI/CD et environnements

`.github/workflows/ci.yml` : un seul job « Lint, tests and build », déclenché sur `dev` et `main`.

- Services PostgreSQL 17 et Redis 7.
- `pnpm install --frozen-lockfile`, génération et validation Prisma, `migrate deploy`.
- `lint`, `typecheck`, `test`, `build`.
- **Absent** : déploiement, build Docker, scan de dépendances, analyse statique de sécurité, mesure de couverture, `format:check`.

Environnement local : `docker-compose.yml` fournit PostgreSQL, Redis et MinIO ; `.env.example` documente toutes les variables, y compris le basculement FedaPay.

---

## 3. Vérifications et qualité

### 3.1 Résultats locaux (22 novembre 2026)

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm lint` | ✅ | ESLint, `--max-warnings=0` |
| `pnpm typecheck` | ✅ | 3 projets (shared, api, web) |
| `pnpm test` | ✅ | 15 fichiers, 82 tests |
| `pnpm build` | ✅ | API Nest + 40 pages Next générées |

### 3.2 Répartition des tests

| Périmètre | Fichiers | Tests | Nature |
| --- | --- | --- | --- |
| `apps/api` | 14 | 80 | Unitaires avec Prisma mocké |
| `packages/shared` | 1 | 2 | Schéma monétaire |
| `apps/web` | 0 | 0 | Aucun test |
| E2E / intégration | 0 | 0 | Aucun |

Les tests API couvrent surtout les services (billing 13, expériences 10, messagerie 7, profils 7, notifications 6, photos 6). La qualité est hétérogène : certains vérifient un comportement réel (reset de mot de passe, idempotence de paiement), d'autres seulement la présence de méthodes (`auth-rbac.spec.ts`). Aucune couverture n'est mesurée ni seuillée, alors que le cahier des charges vise 70 % sur la logique métier.

### 3.3 Ce que les tests ne protègent pas

- Les parcours complets inscription → vérification → profil → photo → modération.
- Le rafraîchissement de session et les redirections par rôle.
- Les permissions réelles (IDOR) sur chaque route.
- Le webhook FedaPay de bout en bout.
- Le rendu et les formulaires web.

---

## 4. Avancement par rapport au cahier des charges

### 4.1 Exigences fonctionnelles F1–F12

| Réf. | Exigence | Statut | Ce qui existe | Écart principal |
| --- | --- | --- | --- | --- |
| **F1** | Inscription e-mail/téléphone, vérification, rôle | **Partiel** | E-mail + mot de passe, 3 rôles, vérification e-mail obligatoire sur les routes sensibles | Pas d'inscription par téléphone ni OTP SMS ; pas de contrôle de mots de passe compromis ; pas de verrouillage progressif |
| **F2** | Parcours débutant : photos guidées, mensurations, ville, âge 18+, consentement | **Livré** | 3 types de photos guidées, mensurations chiffrées, ville, date de naissance 18+, consentement de visibilité | Consentement CGU non horodaté en base ; âge auto-déclaré, pas de vérification d'identité |
| **F3** | Parcours confirmé : portfolio, expériences, liens, compétences | **Partiel** | Photos portfolio, expériences avec justificatif, passage automatique `CONFIRME` après validation admin | Pas de liens externes, ni compétences (défilé/photo/publicité), ni disponibilité |
| **F4** | Visibilité privé / agences vérifiées / public | **Partiel** | Les 3 valeurs existent, propagées aux photos ; la découverte applique le consentement | Aucune surface publique réelle : `PUBLIC` n'expose rien hors dashboard |
| **F5** | Recherche : taille, âge, ville, mensurations, expérience, disponibilité | **Partiel** | Ville, niveau, recherche texte, pagination | Filtres taille/âge/mensurations impossibles (champs chiffrés, `TODO(F5)`) ; pas d'expérience ni disponibilité |
| **F6** | Messagerie avec quotas, blocage, signalement | **Livré** | Quota 10 nouvelles conversations/jour, blocage par organisation, signalement, anti-coordonnées | Quota fixe, non lié au plan ; pas de sanction graduée automatique |
| **F7** | Castings, candidatures, suivi de statut | **Absent** | — | Aucun modèle, aucune route, aucune page |
| **F8** | Abonnements, achats ponctuels, factures, historique | **Partiel** | Catalogue, checkout simulé/FedaPay, webhook signé idempotent, factures, historique, annulation | **Aucun avantage débloqué** ; add-ons seulement affichés ; pas de renouvellement automatique ni relance d'impayé |
| **F9** | Formations : publication, inscription, paiement | **Absent** | — | Aucun modèle, aucune route, aucune page |
| **F10** | Back-office : agences, photos, signalements, statistiques | **Livré** | 5 écrans d'administration, vérification IFU/RCCM, suspension, stats | Pas de consultation du journal d'audit, pas d'actions en masse, pas de recours |
| **F11** | Notifications e-mail / SMS / in-app | **Partiel** | In-app + e-mail Resend, compteur non lus, marquage lu | Pas de SMS, pas de préférences, pas de digest |
| **F12** | Export et suppression des données | **Livré** | Export JSON complet, suppression avec anonymisation et nettoyage S3 | Pas de délai de rétention ni de confirmation différée |

**Bilan** : 4 exigences livrées (F2, F6, F10, F12), 6 partielles (F1, F3, F4, F5, F8, F11), 2 absentes (F7, F9). Le MVP du cahier des charges est donc couvert à environ **60–65 %** (estimation qualitative), avec un cœur solide mais une moitié « phase 2 » encore vide.

### 4.2 Découpage par phase

| Phase | Contenu prévu | État réel |
| --- | --- | --- |
| **Phase 1 (MVP)** | Comptes, profils, portfolio, recherche, messagerie, paiements, admin, modération, pages légales | Quasi complet, sauf filtres avancés et contreparties payantes |
| **Phase 2** | Castings, badge vérifié, formations, boosts | Absente (catalogue seulement) |
| **Phase 3** | 16–17 ans, mobile, détection auto, API partenaires, multilingue | Non démarrée (et l'ouverture aux mineurs reste à arbitrer juridiquement) |

### 4.3 Ce qui est réellement « au niveau de la plateforme »

| Brique | Niveau | Commentaire |
| --- | --- | --- |
| Inscription / connexion / reset | **Production** | Solide, testé, audité |
| Profils et photos privées | **Production** | Chiffrement, bucket privé, URLs courtes, modération |
| Organisations et vérification | **Production** | Vérification manuelle, statuts, files admin |
| Découverte | **Production (restreinte)** | Volontairement limitée aux agences vérifiées |
| Messagerie | **Production** | Quota, blocage, anti-coordonnées, signalement |
| Modération | **Production** | Humaine, 5 écrans dédiés, traçabilité |
| Notifications | **Correct** | In-app + e-mail, pas de SMS ni de préférences |
| Facturation | **Prototype avancé** | Encaissement possible, contreparties absentes |
| Pages marketing | **Démo** | Contenus et talents fictifs, pas de données réelles |
| Exploitation | **Prototype** | Pas de monitoring, santé, sauvegardes ni alerting |

---

## 5. Sécurité et conformité

### 5.1 Points forts

- Argon2id pour les mots de passe, politique de 10 caractères avec majuscule/minuscule/chiffre.
- Access token court (15 min) + refresh opaque haché, rotation à chaque usage, révocation globale au reset.
- Cookies `HttpOnly`, `SameSite=Lax`, `Secure` en production ; aucun jeton accessible au JavaScript.
- RBAC appliqué côté API par guards globaux ; la table de rôles du front n'est qu'un confort de navigation.
- Validation Zod systématique, `ValidationPipe` strict (`whitelist`, `forbidNonWhitelisted`), Prisma paramétré.
- Vérification de propriété sur chaque ressource (photos, expériences, conversations, organisations).
- Chiffrement colonne AES-256-GCM des données sensibles, clé obligatoire au démarrage.
- Upload : taille max 5 Mo, magic bytes, conversion WebP, EXIF supprimé, bucket privé, URL signée 5 min.
- Webhook paiement : HMAC-SHA256, comparaison en temps constant, secret exigé en production, idempotence.
- Journal d'audit horodaté avec IP et user-agent, `trust proxy` configuré.
- Rate limiting global Redis (30/min et 100/5 min) + limites spécifiques upload/export.

### 5.2 Faiblesses et écarts

| # | Constat | Gravité | Preuve / emplacement |
| --- | --- | --- | --- |
| S1 | Aucun en-tête de sécurité : pas de Helmet, CSP, HSTS, `X-Frame-Options`, `Referrer-Policy` | **Élevée** | `apps/api/src/main.ts`, `apps/web/next.config.ts` |
| S2 | Secrets JWT avec valeurs de repli silencieuses, y compris en production | **Critique** | `config/app-config.service.ts:13-19` |
| S3 | Pas de 2FA pour les administrateurs | **Élevée** | Aucun module TOTP/WebAuthn |
| S4 | Pas de verrouillage progressif par compte ; seule l'IP est limitée | **Moyenne** | `rate-limit/rate-limit.module.ts` |
| S5 | Stockage Redis du throttler : `isBlocked` toujours faux, `blockDuration` ignoré, incrément non atomique, port par défaut 6380 | **Moyenne** | `rate-limit/redis-throttler.storage.ts` |
| S6 | `@EmailVerifiedRequired` absent sur `account` et `billing` (export, suppression, checkout) | **Moyenne** | `account.controller.ts`, `billing.controller.ts` |
| S7 | Pas d'antivirus ni de détection de nudité sur les photos | **Moyenne** | `photos.service.ts` |
| S8 | Pas de filigrane ni de `noindex` | **Faible** | Aucune page profil publique |
| S9 | Journal d'audit sans purge, sans rétention 12 mois, sans consultation admin | **Moyenne** | `audit/audit.service.ts`, aucun endpoint |
| S10 | Clé de chiffrement unique, sans version ni rotation | **Moyenne** | `common/crypto/field-encryption.service.ts` |
| S11 | Pas de scan de dépendances ni de SAST dans la CI | **Moyenne** | `.github/workflows/ci.yml` |
| S12 | CORS non configuré explicitement (choix implicite : seul le BFF appelle l'API) | **Faible** | `main.ts` |
| S13 | Rotation du refresh non atomique, pas de détection de réutilisation | **Moyenne** | `auth/services/token.service.ts:97-113` |
| S14 | TTL du refresh codé en dur à 7 jours, sans tenir compte de `JWT_REFRESH_TTL` | **Faible** | `token.service.ts:86` |

### 5.3 Conformité Bénin / RGPD

**Acquis** : pages confidentialité et mentions légales, CGU en cours d'ajout, export des données, suppression avec anonymisation, consentement de visibilité par photo, journal d'audit, chiffrement des données sensibles.

**Manquant avant mise en service** :

- Déclaration APDP (article 405 du Code du numérique) et registre des traitements.
- Base légale formalisée et registre des consentements (CGU acceptées, pas seulement affichées).
- Politique de rétention effective (audit 12 mois, tokens expirés, comptes inactifs, logs).
- Liste des sous-traitants et transferts hors du Bénin (Resend, FedaPay, Cloudflare R2).
- Procédure de violation de données et contact DPO/référent.
- Validation juridique des mentions « aucune garantie de recrutement » et des promesses payantes.

---

## 6. Écarts, risques et dette technique

### 6.1 Risques produit et business

1. **Vendre sans livrer (R1).** La page Tarifs annonce 30 photos, candidatures illimitées, statistiques, badge, boost, filtres avancés et quota étendu. Rien de tout cela n'est conditionné par l'abonnement. C'est le point le plus urgent à corriger, avant toute acquisition payante.
2. **Vitrine fictive (R6).** Les pages `/talents`, `/` et `/parcours` présentent des profils nommés (Awa Dossou, Fadila Bio Sanni…) avec des photos éditoriales, sans lien vers de vrais profils. Il faut soit assumer clairement « exemples illustratifs », soit brancher de vraies données consenties.
3. **Pas de surface publique (F4).** La visibilité `PUBLIC` n'a aucun effet visible : aucun profil public, aucune page SEO, aucun partage. Cela pénalise l'acquisition et la proposition de valeur « visibilité ».
4. **Filtres impossibles (R3).** Le chiffrement des mensurations protège bien les données, mais interdit les filtres SQL. Il faut des index dérivés non sensibles (tranches d'âge/taille) ou un blind index, avec une décision produit explicite.
5. **Découverte réservée aux agences vérifiées.** C'est conforme au cahier des charges, mais crée un problème œuf-poule : sans agences vérifiées, les modèles n'ont aucun débouché visible.

### 6.2 Dette technique

| # | Constat | Emplacement | Impact |
| --- | --- | --- | --- |
| T1 | `packages/shared` ne contient qu'un schéma monétaire et n'est importé par aucune app | `packages/shared/src/index.ts` | Types API/web dupliqués à la main |
| T2 | Dépendances runtime déclarées à la racine (`@nestjs/*`, `sharp`, `argon2`, `ioredis`, `multer`, `file-type`, `passport`, `zod`) en plus de `apps/api` | `package.json` racine | Risque de divergence de versions et d'installation inutile |
| T3 | `TanStack Query` installé mais jamais utilisé | `apps/web/package.json` | Poids mort, stack annoncée non tenue |
| T4 | Features web réduites à `components/` | `apps/web/src/features/*` | Gabarit `hooks/services/schemas/types` non appliqué |
| T5 | Aucune image via `next/image` : `<img>` bruts, sans `srcset`, `width/height` ni `loading="lazy"` | pages publiques et dashboard | Performance 4G et CLS dégradés, promesse < 3 s non tenue |
| T6 | Prix dupliqués entre `billing.catalog.ts` et `shared/lib/plans.ts` | API + web | Dérive commerciale possible |
| T7 | `PrismaServiceClient` inutile dans le fichier de configuration | `config/app-config.service.ts:4-5` | Code mort |
| T8 | Tests majoritairement unitaires, sans e2e ni couverture | `apps/api/test`, `apps/web` | Régressions non détectées |
| T9 | Pas de healthcheck API, pas de Sentry, pas de logs structurés | global | Panne silencieuse |
| T10 | Pas de sauvegarde/restauration documentée ni testée | global | Perte de données irréversible |
| T11 | Pas de `robots.txt`, `sitemap.xml`, métadonnées OpenGraph dynamiques | `apps/web/src/app` | SEO limité |
| T12 | Seed limité au compte admin | `apps/api/prisma/seed.ts` | Pas de jeu de démonstration reproductible |

### 6.3 Incohérences de configuration

- `REDIS_URL` par défaut à `redis://localhost:6380` dans le throttler, alors que `.env.example`, `docker-compose.yml` et la CI utilisent `6379`.
- Le stockage Redis du throttler est instancié avec `new` hors injection de dépendances : il ne bénéficie pas du chargement de configuration Nest et ignore `blockDuration`.
- `JWT_REFRESH_TTL` est documenté mais le service de tokens code 7 jours en dur.
- `MAIL_FROM` par défaut sur `modelbenin.local`, à remplacer avant tout envoi réel.
- `NEXT_PUBLIC_API_URL` est préfixé « public » alors qu'il sert surtout au serveur (BFF, route handlers) ; à terme, préférer une variable strictement serveur pour éviter toute exposition involontaire côté client.

---

## 7. Recommandations priorisées

### P0 — Avant toute mise en production ou vente d'abonnement (1 à 2 semaines)

1. **Implémenter les entitlements.** Un service `EntitlementsService` doit répondre à « ce compte peut-il publier 30 photos, contacter X agences, voir les stats, filtrer ? » et être appelé par photos, découverte, messagerie, castings. Sans cela, ne pas encaisser.
2. **Supprimer les secrets de repli.** Échouer au démarrage si `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` ou `DATA_ENCRYPTION_KEY` sont absents ou faibles. Ajouter une validation d'environnement centralisée.
3. **Ajouter Helmet + CSP + HSTS** côté API et des en-têtes de sécurité dans `next.config.ts` (`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
4. **Ajouter la 2FA admin** (TOTP suffit) et un verrouillage progressif par compte.
5. **Corriger la rotation du refresh** : transaction conditionnelle (`updateMany where revokedAt = null`), détection de réutilisation, révocation de famille.
6. **Aligner `@EmailVerifiedRequired`** sur `account` et `billing`.

### P1 — Dans les 30 jours (fiabilisation)

7. **Tests e2e** des parcours critiques : inscription → vérification → profil → photo → modération ; login → refresh → dashboard ; checkout → webhook → abonnement actif ; export/suppression.
8. **Mesurer la couverture** et fixer un seuil progressif (40 % puis 60 %), avec `vitest --coverage` en CI.
9. **Observabilité** : healthcheck `/health`, logs structurés, Sentry (front + API), alerte sur erreurs 5xx et échecs de webhook.
10. **Sauvegardes** : dump quotidien chiffré, rétention, procédure de restauration testée et documentée.
11. **Corriger le throttler Redis** : injection Nest, port 6379, atomicité (script Lua ou `INCR` + `EXPIRE`), `blockDuration` respecté.
12. **Rétention et consultation de l'audit** : purge à 12 mois, écran admin en lecture seule.

### P2 — Phase 2 produit (4 à 6 semaines)

13. **Castings et candidatures (F7)** : modèles `Casting`, `Application`, statuts, quotas par plan, notifications.
14. **Filtres avancés (F5)** : champs dérivés non sensibles (`ageBand`, `heightBand`) ou blind index, puis filtres taille/âge/mensurations.
15. **Badge vérifié et boost** : vérification d'identité manuelle, achat unique, mise en avant temporaire réellement appliquée au tri.
16. **Statistiques de vues et favoris** : événements de consultation agrégés, listes de sélection agence.
17. **Profils publics (F4)** : page profil SEO pour les modèles `PUBLIC`, `noindex` pour les débutants, filigrane sur les aperçus.
18. **Formations (F9)** : publication, inscription, commission.

### P3 — Industrialisation

19. **Mutualiser les contrats** dans `packages/shared` : schémas Zod, types de réponse, catalogue de plans.
20. **Nettoyer les dépendances** : déplacer les dépendances runtime à la racine vers `apps/api`, retirer TanStack Query ou l'utiliser.
21. **Performance front** : `next/image`, AVIF/WebP, `srcset`, dimensions explicites, préchargement des polices.
22. **CI/CD complète** : build Docker, déploiement staging/production, Dependabot, `pnpm audit`, SAST.
23. **Conformité** : dossier APDP, registre des traitements, politique de rétention, sous-traitants, procédure de violation.

---

## 8. Conclusion

ModelBénin dispose aujourd'hui d'une **base technique crédible** : l'architecture est lisible, les données sensibles sont réellement protégées, les parcours de mise en relation sont encadrés et le back-office permet d'exploiter la plateforme au quotidien. Ce n'est pas un prototype jetable ; c'est un MVP dont le cœur peut survivre à la mise en production.

Les deux chantiers qui décident de la suite ne sont pas des fonctionnalités : ce sont **la cohérence entre ce qui est vendu et ce qui est livré** (entitlements, castings, filtres, badge, boost) et **le niveau d'exploitation** (secrets, en-têtes, 2FA, tests e2e, supervision, sauvegardes). Tant que ces deux points ne sont pas traités, ouvrir les paiements reviendrait à encaisser sans contrepartie et à exploiter une plateforme sans filet.

Le reste — formations, profils publics, SMS, mobile, multilingue — peut attendre la phase 2 sans remettre en cause la valeur du socle actuel.
