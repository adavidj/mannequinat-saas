import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { FieldEncryptionService } from '../../common/crypto/field-encryption.service';
import { ConfigModule } from '../../config/config.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { ExperiencesController } from './experiences.controller';
import { ExperiencesService } from './experiences.service';

@Module({
  imports: [AuditModule, ConfigModule, PrismaModule],
  controllers: [ProfilesController, ExperiencesController],
  providers: [ProfilesService, ExperiencesService, FieldEncryptionService],
})
export class ProfilesModule {}
