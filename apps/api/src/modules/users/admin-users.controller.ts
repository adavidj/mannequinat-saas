import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  ListUsersDto,
  UpdateUserStatusDto,
  listUsersSchema,
  updateUserStatusSchema,
} from './dto/admin-user.dto';
import { UsersService } from './users.service';

type AuthenticatedUser = { id: string };

@Controller('admin/users')
@Roles(UserRole.ADMIN)
@EmailVerifiedRequired()
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(listUsersSchema)) query: ListUsersDto) {
    return this.users.listForAdmin(query);
  }

  @Patch(':userId/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateUserStatusSchema)) body: UpdateUserStatusDto,
    @Req() request: Request,
  ) {
    return this.users.updateStatus(user.id, userId, body, this.auditContext(request));
  }

  private auditContext(request: Request): { ipAddress: string | null; userAgent: string | null } {
    return { ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null };
  }
}
