CREATE TABLE "ProfileOrganizationBlock" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileOrganizationBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileOrganizationBlock_profileId_organizationId_key"
ON "ProfileOrganizationBlock"("profileId", "organizationId");

CREATE INDEX "ProfileOrganizationBlock_organizationId_idx"
ON "ProfileOrganizationBlock"("organizationId");

ALTER TABLE "ProfileOrganizationBlock"
ADD CONSTRAINT "ProfileOrganizationBlock_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "ModelProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileOrganizationBlock"
ADD CONSTRAINT "ProfileOrganizationBlock_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
