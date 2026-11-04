import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  ModeratePhotoDto,
  ModerationQueueQueryDto,
  moderatePhotoSchema,
  moderationQueueQuerySchema,
} from './dto/moderate-photo.dto';
import { PhotosService } from './photos.service';

type AuthenticatedUser = { id: string };

@Controller('admin/photos')
@Roles(UserRole.ADMIN)
@EmailVerifiedRequired()
export class AdminPhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(moderationQueueQuerySchema)) query: ModerationQueueQueryDto,
  ) {
    return this.photos.listForModeration(query);
  }

  @Get(':photoId/url')
  async getUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('photoId') photoId: string,
    @Req() request: Request,
  ) {
    return this.photos.getModerationPhotoUrl(user.id, photoId, this.auditContext(request));
  }

  @Patch(':photoId/moderation')
  async moderate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('photoId') photoId: string,
    @Body(new ZodValidationPipe(moderatePhotoSchema)) body: ModeratePhotoDto,
    @Req() request: Request,
  ) {
    return this.photos.moderatePhoto(user.id, photoId, body, this.auditContext(request));
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return { ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null };
  }
}
