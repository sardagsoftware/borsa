-- CreateTable
CREATE TABLE "brand_responses" (
    "id" UUID NOT NULL,
    "complaintId" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "respondedBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "brand_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" UUID NOT NULL,
    "complaintId" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "key" VARCHAR(512) NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_erasure_requests" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ,
    "processedBy" VARCHAR(255),

    CONSTRAINT "data_erasure_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_response_complaint" ON "brand_responses"("complaintId");

-- CreateIndex
CREATE INDEX "idx_response_brand" ON "brand_responses"("brandId");

-- CreateIndex
CREATE INDEX "idx_response_created" ON "brand_responses"("createdAt");

-- CreateIndex
CREATE INDEX "idx_evidence_complaint" ON "evidence"("complaintId");

-- CreateIndex
CREATE INDEX "idx_evidence_hash" ON "evidence"("sha256");

-- CreateIndex
CREATE INDEX "idx_erasure_user" ON "data_erasure_requests"("userId");

-- CreateIndex
CREATE INDEX "idx_erasure_status" ON "data_erasure_requests"("status");

-- CreateIndex
CREATE INDEX "idx_erasure_created" ON "data_erasure_requests"("createdAt");

-- AddForeignKey
ALTER TABLE "brand_responses" ADD CONSTRAINT "brand_responses_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_responses" ADD CONSTRAINT "brand_responses_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_erasure_requests" ADD CONSTRAINT "data_erasure_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
