import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ReviewOrganizationDto, reviewOrganizationSchema } from './dto/organization.dto';
import { ReviewQueueQueryDto, reviewQueueQuerySchema } from './dto/review-queue.dto';
import { OrganizationsService } from './organizations.service';

type AuthenticatedUser = { id: string };

@Controller('admin/organizations')
@Roles(UserRole.ADMIN)
@EmailVerifiedRequired()
export class AdminOrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(reviewQueueQuerySchema)) query: ReviewQueueQueryDto,
    @Req() request: Request,
  ) {
    return this.organizations.listForReview(user.id, query, this.auditContext(request));
  }

  @Patch(':organizationId/verification')
  async review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId') organizationId: string,
    @Body(new ZodValidationPipe(reviewOrganizationSchema)) body: ReviewOrganizationDto,
    @Req() request: Request,
  ) {
    return this.organizations.reviewOrganization(
      user.id,
      organizationId,
      body,
      this.auditContext(request),
    );
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return { ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null };
  }
}
