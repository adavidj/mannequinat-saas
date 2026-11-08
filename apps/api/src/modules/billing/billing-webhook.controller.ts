import { Controller, Headers, HttpCode, Param, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { BillingService } from './billing.service';

@Controller('billing/webhooks')
export class BillingWebhookController {
  constructor(private readonly billing: BillingService) {}

  /**
   * Webhook public : l'authentification repose sur la signature HMAC du corps
   * brut, jamais sur un jeton utilisateur.
   */
  @Public()
  @Post(':provider')
  @HttpCode(200)
  async handle(
    @Param('provider') provider: string,
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-fedapay-signature') fedapaySignature?: string,
    @Headers('x-signature') signature?: string,
  ) {
    const rawBody = request.rawBody?.toString('utf8') ?? JSON.stringify(request.body ?? {});
    return this.billing.handleWebhook(
      provider,
      rawBody,
      fedapaySignature ?? signature ?? null,
      request.body,
    );
  }
}
