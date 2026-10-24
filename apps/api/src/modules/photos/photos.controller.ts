import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { UploadPhotoDto, uploadPhotoSchema } from './dto/photo.dto';
import { PhotosService, UploadedImageFile } from './photos.service';

const MAX_PHOTO_UPLOAD_BYTES = 5 * 1024 * 1024;
type AuthenticatedUser = { id: string };

@Controller('profiles/me/photos')
@Roles(UserRole.MODELE)
@EmailVerifiedRequired()
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Post()
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_PHOTO_UPLOAD_BYTES, files: 1 },
    }),
  )
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedImageFile | undefined,
    @Body(new ZodValidationPipe(uploadPhotoSchema)) body: UploadPhotoDto,
    @Req() request: Request,
  ) {
    return this.photos.uploadOwnedPhoto(user.id, file, body, this.auditContext(request));
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.photos.listOwnedPhotos(user.id);
  }

  @Get(':photoId/url')
  async getUrl(@CurrentUser() user: AuthenticatedUser, @Param('photoId') photoId: string) {
    return this.photos.getOwnedPhotoUrl(user.id, photoId);
  }

  @Delete(':photoId')
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('photoId') photoId: string,
    @Req() request: Request,
  ) {
    await this.photos.deleteOwnedPhoto(user.id, photoId, this.auditContext(request));
    return { message: 'Photo supprimée.' };
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }
}
