# ModelBénin

Monorepo du MVP ModelBénin : une plateforme de mise en relation sécurisée entre modèles, agences et organismes de formation au Bénin.

## Prérequis

- Node.js 22 ou supérieur
- pnpm 11 ou supérieur
- Docker Desktop (pour PostgreSQL et Redis en local)

## Installation et lancement

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm dev
```

L’API écoute par défaut sur `http://localhost:3001` et sa documentation Swagger sur `/api/docs`. Le front démarre sur `http://localhost:3000`.

## Vérifications

```bash
pnpm lint
pnpm test
pnpm build
```

## Structure

- `apps/web` : Next.js App Router, organisé par features à partir des prochaines phases.
- `apps/api` : API NestJS et schéma Prisma.
- `packages/shared` : schémas Zod et types partagés.
- `docs` : conception, exigences et documentation projet.

Les secrets restent exclusivement dans `.env`, qui n’est pas versionné.
