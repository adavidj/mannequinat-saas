import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateProfileDto, createProfileSchema, UpdateProfileDto, updateProfileSchema } from './dto/profile.dto';
import { ProfilesService } from './profiles.service';

type AuthenticatedUser = { id: string };

@Controller('profiles/me')
@Roles(UserRole.MODELE)
@EmailVerifiedRequired()
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createProfileSchema)) body: CreateProfileDto,
    @Req() request: Request,
  ) {
    return this.profiles.createOwnedProfile(user.id, body, this.auditContext(request));
  }

  @Get()
  async get(@CurrentUser() user: AuthenticatedUser) {
    return this.profiles.getOwnedProfile(user.id);
  }

  @Patch()
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileDto,
    @Req() request: Request,
  ) {
    return this.profiles.updateOwnedProfile(user.id, body, this.auditContext(request));
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }
}
