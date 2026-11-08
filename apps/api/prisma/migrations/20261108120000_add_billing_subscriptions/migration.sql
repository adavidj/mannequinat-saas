-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_ACTIVATED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_CANCELED';

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'SIMULATED';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "Payment"
ADD COLUMN "subscriptionId" TEXT,
ADD COLUMN "plan" "SubscriptionPlan",
ADD COLUMN "interval" "BillingInterval",
ADD COLUMN "description" TEXT,
ADD COLUMN "invoiceNumber" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_invoiceNumber_key" ON "Payment"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");

-- AddForeignKey
ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
