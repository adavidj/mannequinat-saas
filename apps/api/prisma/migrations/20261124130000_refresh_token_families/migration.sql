-- AlterTable
ALTER TABLE "RefreshToken"
ADD COLUMN "familyId" TEXT,
ADD COLUMN "replacedByTokenEncrypted" TEXT,
ADD COLUMN "replacedAt" TIMESTAMP(3);

-- Backfill : chaque jeton existant devient sa propre famille.
UPDATE "RefreshToken" SET "familyId" = "id" WHERE "familyId" IS NULL;
ALTER TABLE "RefreshToken" ALTER COLUMN "familyId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");
