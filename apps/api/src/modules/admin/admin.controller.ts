import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@Roles(UserRole.ADMIN)
@EmailVerifiedRequired()
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  async stats() {
    return this.admin.stats();
  }
}
