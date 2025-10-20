-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "KycLevel" AS ENUM ('NONE', 'EMAIL_VERIFIED', 'ID_VERIFIED');

-- CreateEnum
CREATE TYPE "Actor" AS ENUM ('USER', 'BRAND_AGENT', 'MODERATOR', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ComplaintState" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LegalRequestType" AS ENUM ('EXPORT', 'ERASE', 'RESTRICT');

-- CreateEnum
CREATE TYPE "LegalRequestState" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'FULFILLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ModerationPolicy" AS ENUM ('TOXICITY', 'DEFAMATION', 'PII_LEAK', 'SPAM', 'DUPLICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "FlagState" AS ENUM ('OPEN', 'UNDER_REVIEW', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('UNVERIFIED', 'DOMAIN_VERIFIED', 'DOCUMENTED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "emailHash" VARCHAR(128) NOT NULL,
    "passwordHash" VARCHAR(128) NOT NULL,
    "phoneHash" VARCHAR(128),
    "role" "Actor" NOT NULL DEFAULT 'USER',
    "kycLevel" "KycLevel" NOT NULL DEFAULT 'NONE',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "locale" VARCHAR(10),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255),
    "categories" TEXT[],
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "slaHours" INTEGER NOT NULL DEFAULT 72,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "solutionRate" DOUBLE PRECISION,
    "avgFirstResponseH" DOUBLE PRECISION,
    "avgResolutionH" DOUBLE PRECISION,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "gtin" VARCHAR(50),
    "category" VARCHAR(100),
    "attributes" JSONB,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "productId" UUID,
    "title" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "state" "ComplaintState" NOT NULL DEFAULT 'DRAFT',
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "evidencePackId" UUID,
    "searchText" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "publishedAt" TIMESTAMPTZ,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_events" (
    "id" UUID NOT NULL,
    "complaintId" UUID NOT NULL,
    "actor" "Actor" NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_flags" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "sourceType" VARCHAR(50) NOT NULL,
    "policy" "ModerationPolicy" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "state" "FlagState" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "moderation_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_packs" (
    "id" UUID NOT NULL,
    "files" JSONB NOT NULL,
    "merkleRoot" VARCHAR(128) NOT NULL,
    "jwsSignature" TEXT,
    "notarizedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_agents" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "invitedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMPTZ,

    CONSTRAINT "brand_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" UUID NOT NULL,
    "complaintId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "score" SMALLINT NOT NULL,
    "nps" SMALLINT,
    "comment" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_requests" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "complaintId" UUID,
    "type" "LegalRequestType" NOT NULL,
    "state" "LegalRequestState" NOT NULL DEFAULT 'RECEIVED',
    "deadlineAt" TIMESTAMPTZ,
    "payload" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "legal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_pages" (
    "id" UUID NOT NULL,
    "brandId" UUID,
    "slug" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "schema" JSONB,
    "lastBuiltAt" TIMESTAMPTZ,

    CONSTRAINT "seo_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "actorRole" "Actor",
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entityId" UUID,
    "ip" INET,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_user_email_hash" ON "users"("emailHash");

-- CreateIndex
CREATE INDEX "idx_user_phone_hash" ON "users"("phoneHash");

-- CreateIndex
CREATE INDEX "idx_user_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_user_role" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "idx_brand_slug" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "idx_brand_domain" ON "brands"("domain");

-- CreateIndex
CREATE INDEX "idx_brand_status" ON "brands"("status");

-- CreateIndex
CREATE UNIQUE INDEX "products_gtin_key" ON "products"("gtin");

-- CreateIndex
CREATE INDEX "idx_product_brand" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "idx_product_name" ON "products"("name");

-- CreateIndex
CREATE INDEX "idx_product_gtin" ON "products"("gtin");

-- CreateIndex
CREATE INDEX "idx_complaint_brand_state" ON "complaints"("brandId", "state");

-- CreateIndex
CREATE INDEX "idx_complaint_user" ON "complaints"("userId");

-- CreateIndex
CREATE INDEX "idx_complaint_product" ON "complaints"("productId");

-- CreateIndex
CREATE INDEX "idx_complaint_created" ON "complaints"("createdAt");

-- CreateIndex
CREATE INDEX "idx_complaint_state" ON "complaints"("state");

-- CreateIndex
CREATE INDEX "idx_event_complaint_time" ON "complaint_events"("complaintId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_event_actor" ON "complaint_events"("actor");

-- CreateIndex
CREATE INDEX "idx_event_type" ON "complaint_events"("type");

-- CreateIndex
CREATE INDEX "idx_flag_source" ON "moderation_flags"("sourceId", "sourceType");

-- CreateIndex
CREATE INDEX "idx_flag_policy_state" ON "moderation_flags"("policy", "state");

-- CreateIndex
CREATE INDEX "idx_flag_state" ON "moderation_flags"("state");

-- CreateIndex
CREATE INDEX "idx_evidence_merkle" ON "evidence_packs"("merkleRoot");

-- CreateIndex
CREATE INDEX "idx_agent_brand" ON "brand_agents"("brandId");

-- CreateIndex
CREATE INDEX "idx_agent_email" ON "brand_agents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "brand_agents_brandId_email_key" ON "brand_agents"("brandId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_complaintId_key" ON "ratings"("complaintId");

-- CreateIndex
CREATE INDEX "idx_rating_score" ON "ratings"("score");

-- CreateIndex
CREATE INDEX "idx_rating_user" ON "ratings"("userId");

-- CreateIndex
CREATE INDEX "idx_legal_type_state" ON "legal_requests"("type", "state");

-- CreateIndex
CREATE INDEX "idx_legal_deadline" ON "legal_requests"("deadlineAt");

-- CreateIndex
CREATE INDEX "idx_legal_user" ON "legal_requests"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "seo_pages_slug_key" ON "seo_pages"("slug");

-- CreateIndex
CREATE INDEX "idx_seo_type" ON "seo_pages"("type");

-- CreateIndex
CREATE INDEX "idx_seo_brand" ON "seo_pages"("brandId");

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_events"("entity", "entityId");

-- CreateIndex
CREATE INDEX "idx_audit_role" ON "audit_events"("actorRole");

-- CreateIndex
CREATE INDEX "idx_audit_created" ON "audit_events"("createdAt");

-- CreateIndex
CREATE INDEX "idx_audit_action" ON "audit_events"("action");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_evidencePackId_fkey" FOREIGN KEY ("evidencePackId") REFERENCES "evidence_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_events" ADD CONSTRAINT "complaint_events_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_agents" ADD CONSTRAINT "brand_agents_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_requests" ADD CONSTRAINT "legal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_requests" ADD CONSTRAINT "legal_requests_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_pages" ADD CONSTRAINT "seo_pages_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
