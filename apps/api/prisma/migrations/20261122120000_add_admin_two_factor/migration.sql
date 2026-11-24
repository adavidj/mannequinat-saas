-- AlterTable
ALTER TABLE "User"
ADD COLUMN "twoFactorSecretEncrypted" TEXT,
ADD COLUMN "twoFactorEnabledAt" TIMESTAMP(3);
