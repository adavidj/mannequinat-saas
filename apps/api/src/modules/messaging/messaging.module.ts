import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [AuditModule, PrismaModule, OrganizationsModule],
  controllers: [MessagingController],
  providers: [MessagingService],
})
export class MessagingModule {}
