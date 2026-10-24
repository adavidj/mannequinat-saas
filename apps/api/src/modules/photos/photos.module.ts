import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { ConfigModule } from '../../config/config.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ObjectStorageService } from '../../storage/object-storage.service';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';

@Module({
  imports: [AuditModule, ConfigModule, PrismaModule],
  controllers: [PhotosController],
  providers: [ObjectStorageService, PhotosService],
})
export class PhotosModule {}
