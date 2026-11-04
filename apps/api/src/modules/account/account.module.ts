import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { FieldEncryptionService } from '../../common/crypto/field-encryption.service';
import { ConfigModule } from '../../config/config.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ObjectStorageService } from '../../storage/object-storage.service';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [PrismaModule, AuditModule, ConfigModule],
  controllers: [AccountController],
  providers: [AccountService, FieldEncryptionService, ObjectStorageService],
})
export class AccountModule {}
