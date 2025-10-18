-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "governanceModels" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "governanceAuditLogs" TEXT;

-- CreateEnum
CREATE TYPE "GovernanceModelStatus" AS ENUM ('DRAFT', 'TESTING', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "KillSwitchStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CircuitBreakerState" AS ENUM ('CLOSED', 'OPEN', 'HALF_OPEN');

-- CreateTable
CREATE TABLE "GovernanceModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT NOT NULL,
    "status" "GovernanceModelStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "GovernanceModel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "compliant" BOOLEAN NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceCheck_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "GovernanceModel"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrustIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "globalScore" DOUBLE PRECISION NOT NULL,
    "tier" TEXT NOT NULL,
    "transparency" DOUBLE PRECISION NOT NULL,
    "accountability" DOUBLE PRECISION NOT NULL,
    "fairness" DOUBLE PRECISION NOT NULL,
    "privacy" DOUBLE PRECISION NOT NULL,
    "robustness" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustIndex_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "GovernanceModel"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KillSwitch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "status" "KillSwitchStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KillSwitch_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "GovernanceModel"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CircuitBreaker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "windowMs" INTEGER NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "state" "CircuitBreakerState" NOT NULL,
    "trips" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircuitBreaker_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "GovernanceModel"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GovernanceAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceAuditLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "GovernanceModel"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GovernanceAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GovernanceModel_ownerId_idx" ON "GovernanceModel"("ownerId");
CREATE INDEX "GovernanceModel_status_idx" ON "GovernanceModel"("status");
CREATE INDEX "GovernanceModel_provider_idx" ON "GovernanceModel"("provider");
CREATE INDEX "GovernanceModel_createdAt_idx" ON "GovernanceModel"("createdAt");

-- CreateIndex
CREATE INDEX "ComplianceCheck_modelId_idx" ON "ComplianceCheck"("modelId");
CREATE INDEX "ComplianceCheck_framework_idx" ON "ComplianceCheck"("framework");
CREATE INDEX "ComplianceCheck_compliant_idx" ON "ComplianceCheck"("compliant");
CREATE INDEX "ComplianceCheck_createdAt_idx" ON "ComplianceCheck"("createdAt");

-- CreateIndex
CREATE INDEX "TrustIndex_modelId_idx" ON "TrustIndex"("modelId");
CREATE INDEX "TrustIndex_tier_idx" ON "TrustIndex"("tier");
CREATE INDEX "TrustIndex_globalScore_idx" ON "TrustIndex"("globalScore");
CREATE INDEX "TrustIndex_calculatedAt_idx" ON "TrustIndex"("calculatedAt");

-- CreateIndex
CREATE INDEX "KillSwitch_modelId_idx" ON "KillSwitch"("modelId");
CREATE INDEX "KillSwitch_status_idx" ON "KillSwitch"("status");
CREATE INDEX "KillSwitch_triggeredAt_idx" ON "KillSwitch"("triggeredAt");

-- CreateIndex
CREATE INDEX "CircuitBreaker_modelId_idx" ON "CircuitBreaker"("modelId");
CREATE INDEX "CircuitBreaker_state_idx" ON "CircuitBreaker"("state");
CREATE INDEX "CircuitBreaker_createdAt_idx" ON "CircuitBreaker"("createdAt");

-- CreateIndex
CREATE INDEX "GovernanceAuditLog_modelId_idx" ON "GovernanceAuditLog"("modelId");
CREATE INDEX "GovernanceAuditLog_userId_idx" ON "GovernanceAuditLog"("userId");
CREATE INDEX "GovernanceAuditLog_action_idx" ON "GovernanceAuditLog"("action");
CREATE INDEX "GovernanceAuditLog_timestamp_idx" ON "GovernanceAuditLog"("timestamp");
