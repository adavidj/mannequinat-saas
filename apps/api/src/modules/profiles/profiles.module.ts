import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { FieldEncryptionService } from '../../common/crypto/field-encryption.service';
import { ConfigModule } from '../../config/config.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [AuditModule, ConfigModule, PrismaModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, FieldEncryptionService],
})
export class ProfilesModule {}
