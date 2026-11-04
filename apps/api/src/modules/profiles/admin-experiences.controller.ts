import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  ExperienceReviewQueueQueryDto,
  experienceReviewQueueQuerySchema,
} from './dto/experience-review-queue.dto';
import { ReviewExperienceDto, reviewExperienceSchema } from './dto/experience.dto';
import { ExperiencesService } from './experiences.service';

type AuthenticatedUser = { id: string };

@Controller('admin/experiences')
@Roles(UserRole.ADMIN)
@EmailVerifiedRequired()
export class AdminExperiencesController {
  constructor(private readonly experiences: ExperiencesService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(experienceReviewQueueQuerySchema))
    query: ExperienceReviewQueueQueryDto,
  ) {
    return this.experiences.listForReview(query);
  }

  @Patch(':experienceId/verification')
  async review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('experienceId') experienceId: string,
    @Body(new ZodValidationPipe(reviewExperienceSchema)) body: ReviewExperienceDto,
    @Req() request: Request,
  ) {
    return this.experiences.reviewExperience(
      user.id,
      experienceId,
      body,
      this.auditContext(request),
    );
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return { ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null };
  }
}
