-- Safe Migration: Drop existing objects first, then create new ones

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS "UserPreference" CASCADE;
DROP TABLE IF EXISTS "Incident" CASCADE;
DROP TABLE IF EXISTS "DSARRequest" CASCADE;
DROP TABLE IF EXISTS "TrustScore" CASCADE;
DROP TABLE IF EXISTS "ModerationResult" CASCADE;
DROP TABLE IF EXISTS "WorkflowStep" CASCADE;
DROP TABLE IF EXISTS "WorkflowRun" CASCADE;
DROP TABLE IF EXISTS "Workflow" CASCADE;
DROP TABLE IF EXISTS "ExplainabilityLog" CASCADE;
DROP TABLE IF EXISTS "Provenance" CASCADE;
DROP TABLE IF EXISTS "TrainingExample" CASCADE;
DROP TABLE IF EXISTS "Feedback" CASCADE;
DROP TABLE IF EXISTS "CRDTState" CASCADE;
DROP TABLE IF EXISTS "SemanticCache" CASCADE;
DROP TABLE IF EXISTS "BanditArm" CASCADE;
DROP TABLE IF EXISTS "QualityScore" CASCADE;
DROP TABLE IF EXISTS "MessageEmbedding" CASCADE;
DROP TABLE IF EXISTS "ChunkEmbedding" CASCADE;
DROP TABLE IF EXISTS "DocumentChunk" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "EncryptionKey" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "WalletTransaction" CASCADE;
DROP TABLE IF EXISTS "Wallet" CASCADE;
DROP TABLE IF EXISTS "Budget" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "ApiKey" CASCADE;
DROP TABLE IF EXISTS "RoutingScore" CASCADE;
DROP TABLE IF EXISTS "AIModel" CASCADE;
DROP TABLE IF EXISTS "AIProvider" CASCADE;
DROP TABLE IF EXISTS "ConversationMetadata" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;
DROP TABLE IF EXISTS "Tenant" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop types
DROP TYPE IF EXISTS "IncidentStatus";
DROP TYPE IF EXISTS "IncidentSeverity";
DROP TYPE IF EXISTS "DSARStatus";
DROP TYPE IF EXISTS "DSARType";
DROP TYPE IF EXISTS "WorkflowStatus";
DROP TYPE IF EXISTS "TransactionType";
DROP TYPE IF EXISTS "BudgetPeriod";
DROP TYPE IF EXISTS "MessageRole";
DROP TYPE IF EXISTS "TenantTier";
DROP TYPE IF EXISTS "UserRole";

-- Now create everything fresh
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "TenantTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');
CREATE TYPE "BudgetPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'REFUND');
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "DSARType" AS ENUM ('ACCESS', 'DELETION', 'RECTIFICATION', 'PORTABILITY');
CREATE TYPE "DSARStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED');
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" "TenantTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "modelId" TEXT,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "latencyMs" INTEGER,
    "cost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationMetadata" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "tags" TEXT[],
    "sentiment" DOUBLE PRECISION,
    "topic" TEXT,
    CONSTRAINT "ConversationMetadata_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "baseUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AIProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIModel" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contextWindow" INTEGER NOT NULL,
    "costPer1kIn" DOUBLE PRECISION NOT NULL,
    "costPer1kOut" DOUBLE PRECISION NOT NULL,
    "capabilities" TEXT[],
    "avgLatencyMs" INTEGER,
    "successRate" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AIModel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoutingScore" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "pulls" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoutingScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "limitUsd" DOUBLE PRECISION NOT NULL,
    "spentUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" "BudgetPeriod" NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EncryptionKey" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "algorithm" TEXT NOT NULL,
    "encryptedDek" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),
    CONSTRAINT "EncryptionKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChunkEmbedding" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChunkEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageEmbedding" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageEmbedding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QualityScore" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "estimatedScore" DOUBLE PRECISION NOT NULL,
    "actualScore" DOUBLE PRECISION,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualityScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BanditArm" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "pulls" INTEGER NOT NULL DEFAULT 0,
    "rewards" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alpha" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "beta" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BanditArm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SemanticCache" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "queryEmbedding" vector(1536) NOT NULL,
    "response" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SemanticCache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CRDTState" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "hlc" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CRDTState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingExample" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "completion" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingExample_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Provenance" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "outputHash" TEXT NOT NULL,
    "watermark" TEXT,
    "citations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Provenance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExplainabilityLog" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "importance" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExplainabilityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dag" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModerationResult" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL,
    "categories" TEXT[],
    "scores" JSONB NOT NULL,
    "action" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModerationResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrustScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrustScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DSARRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DSARType" NOT NULL,
    "status" "DSARStatus" NOT NULL,
    "data" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "DSARRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredModel" TEXT,
    "temperature" DOUBLE PRECISION,
    "maxTokens" INTEGER,
    "customSettings" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");
CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX "Message_modelId_idx" ON "Message"("modelId");
CREATE UNIQUE INDEX "ConversationMetadata_conversationId_key" ON "ConversationMetadata"("conversationId");
CREATE UNIQUE INDEX "AIProvider_name_key" ON "AIProvider"("name");
CREATE UNIQUE INDEX "AIProvider_slug_key" ON "AIProvider"("slug");
CREATE INDEX "AIProvider_slug_idx" ON "AIProvider"("slug");
CREATE INDEX "AIProvider_enabled_idx" ON "AIProvider"("enabled");
CREATE UNIQUE INDEX "AIModel_slug_key" ON "AIModel"("slug");
CREATE INDEX "AIModel_slug_idx" ON "AIModel"("slug");
CREATE INDEX "AIModel_providerId_idx" ON "AIModel"("providerId");
CREATE INDEX "AIModel_enabled_idx" ON "AIModel"("enabled");
CREATE INDEX "RoutingScore_intent_idx" ON "RoutingScore"("intent");
CREATE UNIQUE INDEX "RoutingScore_modelId_intent_key" ON "RoutingScore"("modelId", "intent");
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX "ApiKey_tenantId_idx" ON "ApiKey"("tenantId");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_token_idx" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Budget_tenantId_idx" ON "Budget"("tenantId");
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE UNIQUE INDEX "EncryptionKey_keyId_key" ON "EncryptionKey"("keyId");
CREATE INDEX "EncryptionKey_keyId_idx" ON "EncryptionKey"("keyId");
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");
CREATE UNIQUE INDEX "ChunkEmbedding_chunkId_key" ON "ChunkEmbedding"("chunkId");
CREATE INDEX "ChunkEmbedding_model_idx" ON "ChunkEmbedding"("model");
CREATE UNIQUE INDEX "MessageEmbedding_messageId_key" ON "MessageEmbedding"("messageId");
CREATE INDEX "MessageEmbedding_model_idx" ON "MessageEmbedding"("model");
CREATE UNIQUE INDEX "QualityScore_messageId_key" ON "QualityScore"("messageId");
CREATE INDEX "QualityScore_estimatedScore_idx" ON "QualityScore"("estimatedScore");
CREATE INDEX "BanditArm_intent_idx" ON "BanditArm"("intent");
CREATE UNIQUE INDEX "BanditArm_modelId_intent_key" ON "BanditArm"("modelId", "intent");
CREATE UNIQUE INDEX "SemanticCache_queryHash_key" ON "SemanticCache"("queryHash");
CREATE INDEX "SemanticCache_expiresAt_idx" ON "SemanticCache"("expiresAt");
CREATE INDEX "SemanticCache_modelId_idx" ON "SemanticCache"("modelId");
CREATE INDEX "CRDTState_resourceType_resourceId_idx" ON "CRDTState"("resourceType", "resourceId");
CREATE INDEX "CRDTState_hlc_idx" ON "CRDTState"("hlc");
CREATE UNIQUE INDEX "CRDTState_resourceType_resourceId_nodeId_key" ON "CRDTState"("resourceType", "resourceId", "nodeId");
CREATE INDEX "Feedback_messageId_idx" ON "Feedback"("messageId");
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");
CREATE INDEX "TrainingExample_rating_idx" ON "TrainingExample"("rating");
CREATE INDEX "TrainingExample_source_idx" ON "TrainingExample"("source");
CREATE UNIQUE INDEX "Provenance_messageId_key" ON "Provenance"("messageId");
CREATE INDEX "Provenance_inputHash_idx" ON "Provenance"("inputHash");
CREATE INDEX "Provenance_outputHash_idx" ON "Provenance"("outputHash");
CREATE INDEX "ExplainabilityLog_messageId_idx" ON "ExplainabilityLog"("messageId");
CREATE INDEX "ExplainabilityLog_method_idx" ON "ExplainabilityLog"("method");
CREATE INDEX "Workflow_name_idx" ON "Workflow"("name");
CREATE INDEX "WorkflowRun_workflowId_idx" ON "WorkflowRun"("workflowId");
CREATE INDEX "WorkflowRun_status_idx" ON "WorkflowRun"("status");
CREATE INDEX "WorkflowStep_runId_idx" ON "WorkflowStep"("runId");
CREATE INDEX "ModerationResult_contentId_idx" ON "ModerationResult"("contentId");
CREATE INDEX "ModerationResult_flagged_idx" ON "ModerationResult"("flagged");
CREATE INDEX "ModerationResult_createdAt_idx" ON "ModerationResult"("createdAt");
CREATE INDEX "TrustScore_score_idx" ON "TrustScore"("score");
CREATE UNIQUE INDEX "TrustScore_userId_key" ON "TrustScore"("userId");
CREATE INDEX "DSARRequest_userId_idx" ON "DSARRequest"("userId");
CREATE INDEX "DSARRequest_status_idx" ON "DSARRequest"("status");
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
CREATE INDEX "Incident_status_idx" ON "Incident"("status");
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");
CREATE INDEX "Incident_detectedAt_idx" ON "Incident"("detectedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AIModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversationMetadata" ADD CONSTRAINT "ConversationMetadata_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIModel" ADD CONSTRAINT "AIModel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AIProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoutingScore" ADD CONSTRAINT "RoutingScore_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AIModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChunkEmbedding" ADD CONSTRAINT "ChunkEmbedding_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "DocumentChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageEmbedding" ADD CONSTRAINT "MessageEmbedding_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QualityScore" ADD CONSTRAINT "QualityScore_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Provenance" ADD CONSTRAINT "Provenance_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
