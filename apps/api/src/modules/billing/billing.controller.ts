import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmailVerifiedRequired } from '../../common/decorators/email-verified.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BillingService } from './billing.service';
import {
  CreateCheckoutDto,
  PaymentListQueryDto,
  createCheckoutSchema,
  paymentListQuerySchema,
} from './dto/billing.dto';

type AuthenticatedUser = { id: string };

@Controller('billing')
@EmailVerifiedRequired()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('overview')
  async overview(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(paymentListQuerySchema)) query: PaymentListQueryDto,
  ) {
    return this.billing.overview(user.id, query);
  }

  @Post('checkout')
  async checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createCheckoutSchema)) body: CreateCheckoutDto,
  ) {
    return this.billing.checkout(user.id, body);
  }

  @Post('payments/:paymentId/confirm')
  async confirm(@CurrentUser() user: AuthenticatedUser, @Param('paymentId') paymentId: string) {
    return this.billing.confirmSimulatedPayment(user.id, paymentId);
  }

  @Post('subscription/cancel')
  async cancel(@CurrentUser() user: AuthenticatedUser) {
    return this.billing.cancel(user.id);
  }

  @Get('payments/:paymentId/invoice')
  async invoice(@CurrentUser() user: AuthenticatedUser, @Param('paymentId') paymentId: string) {
    return this.billing.invoice(user.id, paymentId);
  }
}
