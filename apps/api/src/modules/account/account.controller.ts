import { Body, Controller, Delete, Get, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AccountService } from './account.service';
import { DeleteAccountDto, deleteAccountSchema } from './dto/delete-account.dto';

type AuthenticatedUser = { id: string };

@Controller('account')
@EmailVerifiedRequired()
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('export')
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  async export(@CurrentUser() user: AuthenticatedUser, @Req() request: Request) {
    return this.account.exportAccount(user.id, this.auditContext(request));
  }

  @Delete()
  @Throttle({ short: { ttl: 60_000, limit: 5 } })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(deleteAccountSchema)) body: DeleteAccountDto,
    @Req() request: Request,
  ) {
    return this.account.deleteAccount(user.id, body, this.auditContext(request));
  }

  private auditContext(request: Request): {
    ipAddress: string | null;
    userAgent: string | null;
  } {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }
}
