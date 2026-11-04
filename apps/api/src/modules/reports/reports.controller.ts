import { Body, Controller, Post, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateReportDto, createReportSchema } from './dto/report.dto';
import { ReportsService } from './reports.service';

type AuthenticatedUser = { id: string };

@Controller('reports')
@Roles(UserRole.MODELE, UserRole.AGENCE)
@EmailVerifiedRequired()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createReportSchema)) body: CreateReportDto,
    @Req() request: Request,
  ) {
    return this.reports.createReport(user.id, body, this.auditContext(request));
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return { ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null };
  }
}
