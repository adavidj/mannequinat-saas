import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { FieldEncryptionService } from '../../common/crypto/field-encryption.service';
import { ConfigModule } from '../../config/config.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ObjectStorageService } from '../../storage/object-storage.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { AdminExperiencesController } from './admin-experiences.controller';
import { ExperiencesController } from './experiences.controller';
import { ExperiencesService } from './experiences.service';

@Module({
  imports: [AuditModule, ConfigModule, PrismaModule],
  controllers: [ProfilesController, ExperiencesController, AdminExperiencesController],
  providers: [ProfilesService, ExperiencesService, ObjectStorageService, FieldEncryptionService],
})
export class ProfilesModule {}
