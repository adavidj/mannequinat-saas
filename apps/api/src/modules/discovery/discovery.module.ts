import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { ObjectStorageService } from '../../storage/object-storage.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

@Module({
  imports: [PrismaModule, OrganizationsModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, ObjectStorageService],
})
export class DiscoveryModule {}
