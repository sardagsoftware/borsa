-- CreateTable
CREATE TABLE "webhooks" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "secret" VARCHAR(128) NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSuccess" TIMESTAMPTZ,
    "lastFailure" TIMESTAMPTZ,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "webhookId" UUID NOT NULL,
    "event" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "response" TEXT,
    "statusCode" SMALLINT,
    "success" BOOLEAN NOT NULL,
    "attemptNumber" SMALLINT NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_notifications" (
    "id" UUID NOT NULL,
    "to" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "template" VARCHAR(100) NOT NULL,
    "variables" JSONB NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "sentAt" TIMESTAMPTZ,
    "failReason" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_webhook_brand" ON "webhooks"("brandId");

-- CreateIndex
CREATE INDEX "idx_webhook_active" ON "webhooks"("isActive");

-- CreateIndex
CREATE INDEX "idx_delivery_webhook_time" ON "webhook_deliveries"("webhookId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_delivery_success" ON "webhook_deliveries"("success");

-- CreateIndex
CREATE INDEX "idx_email_status" ON "email_notifications"("status");

-- CreateIndex
CREATE INDEX "idx_email_template" ON "email_notifications"("template");

-- CreateIndex
CREATE INDEX "idx_email_created" ON "email_notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
