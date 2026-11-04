import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  ReportQueueQueryDto,
  UpdateReportDto,
  reportQueueQuerySchema,
  updateReportSchema,
} from './dto/report.dto';
import { ReportsService } from './reports.service';

type AuthenticatedUser = { id: string };

@Controller('admin/reports')
@Roles(UserRole.ADMIN)
@EmailVerifiedRequired()
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(reportQueueQuerySchema)) query: ReportQueueQueryDto) {
    return this.reports.listForAdmin(query);
  }

  @Patch(':reportId/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Body(new ZodValidationPipe(updateReportSchema)) body: UpdateReportDto,
    @Req() request: Request,
  ) {
    return this.reports.updateStatus(user.id, reportId, body, this.auditContext(request));
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return { ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null };
  }
}
