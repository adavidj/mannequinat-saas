import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateOrganizationDto, createOrganizationSchema } from './dto/organization.dto';
import { OrganizationsService } from './organizations.service';

type AuthenticatedUser = { id: string; role: UserRole };

@Controller('organizations/me')
@Roles(UserRole.AGENCE, UserRole.FORMATEUR)
@EmailVerifiedRequired()
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createOrganizationSchema)) body: CreateOrganizationDto,
    @Req() request: Request,
  ) {
    return this.organizations.createOwnedOrganization(
      user.id,
      user.role,
      body,
      this.auditContext(request),
    );
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.organizations.listOwnedOrganizations(user.id);
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return { ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null };
  }
}
