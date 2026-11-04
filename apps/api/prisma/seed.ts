/**
 * Seed de développement.
 *
 * Le schéma MVP ne contient aucune donnée de référence métier : le seed reste
 * volontairement vide de contenu pour ne pas inventer de profils, d'agences ou
 * de tarifs. Il crée uniquement le compte administrateur à partir de
 * ADMIN_EMAIL / ADMIN_PASSWORD, indispensable pour accéder au back-office.
 */
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function seedAdmin(): Promise<boolean> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.info('ADMIN_EMAIL / ADMIN_PASSWORD absents : aucun compte admin semé.');
    return false;
  }
  if (password.length < 10) {
    throw new Error('ADMIN_PASSWORD doit contenir au moins 10 caractères.');
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });
  console.info(`Compte administrateur prêt : ${email}`);
  return true;
}

async function main(): Promise<void> {
  const adminSeeded = await seedAdmin();
  const [users, organizations, conversations] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.conversation.count(),
  ]);

  console.info(
    `Seed terminé : ${users} utilisateur(s)` +
      `${adminSeeded ? ' (admin inclus)' : ''}, ${organizations} organisation(s), ${conversations} conversation(s).`,
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
