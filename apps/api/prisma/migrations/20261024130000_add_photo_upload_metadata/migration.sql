DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Photo") THEN
    RAISE EXCEPTION 'Migration bloquée : les photos existantes doivent être migrées avec leurs métadonnées et consentements.';
  END IF;
END $$;

ALTER TABLE "Photo" ADD COLUMN "mimeType" TEXT NOT NULL;
ALTER TABLE "Photo" ADD COLUMN "sizeBytes" INTEGER NOT NULL;
ALTER TABLE "Photo" ADD COLUMN "width" INTEGER;
ALTER TABLE "Photo" ADD COLUMN "height" INTEGER;
ALTER TABLE "Photo" ADD COLUMN "visibilityConsent" "ProfileVisibility" NOT NULL;
