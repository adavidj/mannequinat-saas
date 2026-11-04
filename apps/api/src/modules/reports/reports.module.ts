import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminReportsController } from './admin-reports.controller';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuditModule, PrismaModule],
  controllers: [ReportsController, AdminReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
