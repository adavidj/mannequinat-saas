import { Module } from '@nestjs/common';

import { ConfigModule } from '../../config/config.module';
import { BillingController } from './billing.controller';
import { BillingGateway } from './billing.gateway';
import { BillingService } from './billing.service';
import { BillingWebhookController } from './billing-webhook.controller';

@Module({
  imports: [ConfigModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService, BillingGateway],
})
export class BillingModule {}
