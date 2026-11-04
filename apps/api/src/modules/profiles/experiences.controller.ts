import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
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
import { ExperiencesService, UploadedProofFile } from './experiences.service';

const MAX_PROOF_UPLOAD_BYTES = 10 * 1024 * 1024;
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

  @Post(':experienceId/proof')
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_PROOF_UPLOAD_BYTES, files: 1 },
    }),
  )
  async uploadProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('experienceId') experienceId: string,
    @UploadedFile() file: UploadedProofFile | undefined,
    @Req() request: Request,
  ) {
    return this.experiences.uploadOwnedProof(
      user.id,
      experienceId,
      file,
      this.auditContext(request),
    );
  }

  @Get(':experienceId/proof/url')
  async proofUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('experienceId') experienceId: string,
  ) {
    return this.experiences.getOwnedProofUrl(user.id, experienceId);
  }

  @Delete(':experienceId/proof')
  async deleteProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('experienceId') experienceId: string,
    @Req() request: Request,
  ) {
    return this.experiences.deleteOwnedProof(user.id, experienceId, this.auditContext(request));
  }

  @Patch(':experienceId')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('experienceId') experienceId: string,
    @Body(new ZodValidationPipe(updateExperienceSchema)) body: UpdateExperienceDto,
    @Req() request: Request,
  ) {
    return this.experiences.updateOwnedExperience(
      user.id,
      experienceId,
      body,
      this.auditContext(request),
    );
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
