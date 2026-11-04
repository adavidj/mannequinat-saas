import { Injectable } from '@nestjs/common';
import { ModerationStatus, Prisma, ProfileVisibility } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ObjectStorageService } from '../../storage/object-storage.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { SearchModelsDto } from './dto/search-models.dto';

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
    private readonly storage: ObjectStorageService,
  ) {}

  async searchForVerifiedOrganization(userId: string, filters: SearchModelsDto) {
    const organization = await this.organizations.requireVerifiedRecruiterOrganization(
      userId,
      filters.organizationId,
    );

    // TODO(F5): la taille, l'âge et les mensurations sont chiffrés au repos.
    // Les filtrer en SQL suppose des index dérivés non sensibles (tranche
    // d'âge, plage de taille) ou un blind index : décision produit à prendre.
    const where: Prisma.ModelProfileWhereInput = {
      visibility: { in: [ProfileVisibility.VERIFIED_AGENCIES, ProfileVisibility.PUBLIC] },
      ...(filters.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
      ...(filters.level ? { level: filters.level } : {}),
      ...(filters.q ? { displayName: { contains: filters.q, mode: 'insensitive' } } : {}),
      // Une agence bloquée par le modèle ne doit plus voir son profil.
      NOT: { organizationBlocks: { some: { organizationId: organization.id } } },
    };

    const [profiles, total] = await this.prisma.$transaction([
      this.prisma.modelProfile.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          city: true,
          level: true,
          bio: true,
          photos: {
            where: {
              moderationStatus: ModerationStatus.APPROVED,
              visibilityConsent: {
                in: [ProfileVisibility.VERIFIED_AGENCIES, ProfileVisibility.PUBLIC],
              },
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, kind: true, storageKey: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      this.prisma.modelProfile.count({ where }),
    ]);

    const items = await Promise.all(
      profiles.map(async (profile) => ({
        id: profile.id,
        displayName: profile.displayName,
        city: profile.city,
        level: profile.level,
        bio: profile.bio,
        photos: await Promise.all(
          profile.photos.map(async (photo) => {
            const signed = await this.storage.createDownloadUrl(photo.storageKey);
            return {
              id: photo.id,
              kind: photo.kind,
              url: signed.url,
              urlExpiresAt: signed.expiresAt,
            };
          }),
        ),
      })),
    );

    return { items, total, take: filters.take, skip: filters.skip };
  }
}
