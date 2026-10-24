import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateExperienceDto,
  createExperienceSchema,
  UpdateExperienceDto,
  updateExperienceSchema,
} from './dto/experience.dto';
import { ExperiencesService } from './experiences.service';

type AuthenticatedUser = { id: string };

@Controller('profiles/me/experiences')
@Roles(UserRole.MODELE)
@EmailVerifiedRequired()
export class ExperiencesController {
  constructor(private readonly experiences: ExperiencesService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createExperienceSchema)) body: CreateExperienceDto,
    @Req() request: Request,
  ) {
    return this.experiences.createOwnedExperience(user.id, body, this.auditContext(request));
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.experiences.listOwnedExperiences(user.id);
  }

  @Patch(':experienceId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('experienceId') experienceId: string,
    @Body(new ZodValidationPipe(updateExperienceSchema)) body: UpdateExperienceDto,
    @Req() request: Request,
  ) {
    return this.experiences.updateOwnedExperience(user.id, experienceId, body, this.auditContext(request));
  }

  @Delete(':experienceId')
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('experienceId') experienceId: string,
    @Req() request: Request,
  ) {
    await this.experiences.deleteOwnedExperience(user.id, experienceId, this.auditContext(request));
    return { message: 'Expérience supprimée.' };
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }
}
