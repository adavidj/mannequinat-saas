DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ModelProfile"
    WHERE "birthDateEncrypted" NOT LIKE 'v1:%'
       OR "heightCm" IS NOT NULL
       OR "chestCm" IS NOT NULL
       OR "waistCm" IS NOT NULL
       OR "hipsCm" IS NOT NULL
       OR "shoeSize" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Migration bloquée : les données de profil existantes doivent être chiffrées avant ce changement.';
  END IF;
END $$;

ALTER TABLE "ModelProfile" RENAME COLUMN "heightCm" TO "heightCmEncrypted";
ALTER TABLE "ModelProfile" RENAME COLUMN "chestCm" TO "chestCmEncrypted";
ALTER TABLE "ModelProfile" RENAME COLUMN "waistCm" TO "waistCmEncrypted";
ALTER TABLE "ModelProfile" RENAME COLUMN "hipsCm" TO "hipsCmEncrypted";
ALTER TABLE "ModelProfile" RENAME COLUMN "shoeSize" TO "shoeSizeEncrypted";

ALTER TABLE "ModelProfile" ALTER COLUMN "heightCmEncrypted" TYPE TEXT USING "heightCmEncrypted"::TEXT;
ALTER TABLE "ModelProfile" ALTER COLUMN "chestCmEncrypted" TYPE TEXT USING "chestCmEncrypted"::TEXT;
ALTER TABLE "ModelProfile" ALTER COLUMN "waistCmEncrypted" TYPE TEXT USING "waistCmEncrypted"::TEXT;
ALTER TABLE "ModelProfile" ALTER COLUMN "hipsCmEncrypted" TYPE TEXT USING "hipsCmEncrypted"::TEXT;
ALTER TABLE "ModelProfile" ALTER COLUMN "shoeSizeEncrypted" TYPE TEXT USING "shoeSizeEncrypted"::TEXT;
