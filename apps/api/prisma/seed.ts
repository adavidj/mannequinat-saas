/**
 * Seed de développement.
 *
 * Le schéma MVP ne contient aucune donnée de référence métier : le seed reste
 * donc volontairement vide de contenu pour ne pas inventer de profils, de
 * agences ou de tarifs. Il sert de point d'extension et de vérification de la
 * connexion à la base.
 *
 * TODO(auth): semer le compte ADMIN à partir de variables d'environnement
 * (ADMIN_EMAIL / ADMIN_PASSWORD), avec un hachage Argon2id, dès que le module
 * d'authentification existe.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const [users, organizations, conversations] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.conversation.count(),
  ]);

  console.info(
    `Seed terminé : ${users} utilisateur(s), ${organizations} organisation(s), ${conversations} conversation(s).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Échec du seed :', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
