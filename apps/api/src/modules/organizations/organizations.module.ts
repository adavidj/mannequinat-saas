import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { FieldEncryptionService } from '../../common/crypto/field-encryption.service';
import { ConfigModule } from '../../config/config.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminOrganizationsController } from './admin-organizations.controller';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [AuditModule, ConfigModule, PrismaModule],
  controllers: [OrganizationsController, AdminOrganizationsController],
  providers: [OrganizationsService, FieldEncryptionService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
