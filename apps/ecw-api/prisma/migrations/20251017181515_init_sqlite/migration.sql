-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "balanceCO2" REAL NOT NULL DEFAULT 0,
    "balanceH2O" REAL NOT NULL DEFAULT 0,
    "balanceKWh" REAL NOT NULL DEFAULT 0,
    "balanceWaste" REAL NOT NULL DEFAULT 0,
    "ethicsScore" REAL NOT NULL DEFAULT 0,
    "impactScore" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "ethicsScore" REAL NOT NULL,
    "impactScore" REAL NOT NULL,
    "intentScore" REAL,
    "proofJws" TEXT NOT NULL,
    "externalRef" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proofs_of_impact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "txId" TEXT NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "jws" TEXT NOT NULL,
    "tsr" BLOB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "arpId" TEXT,
    "arpUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proofs_of_impact_txId_fkey" FOREIGN KEY ("txId") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" TEXT,
    "region" TEXT NOT NULL,
    "ethicsGate" TEXT,
    "policyViolation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "incident_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "walletId" TEXT,
    "txId" TEXT,
    "proofId" TEXT,
    "irfsId" TEXT,
    "irfsUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedTo" TEXT,
    "resolvedAt" DATETIME,
    "resolution" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "region_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "totalWallets" INTEGER NOT NULL,
    "totalTxs" INTEGER NOT NULL,
    "totalCO2" REAL NOT NULL,
    "totalH2O" REAL NOT NULL,
    "totalKWh" REAL NOT NULL,
    "totalWaste" REAL NOT NULL,
    "avgEthicsScore" REAL NOT NULL,
    "avgImpactScore" REAL NOT NULL,
    "tfeProjection" TEXT,
    "qeeRecommendations" TEXT,
    "generatedBy" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v7.3',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "wallets_ownerType_ownerId_idx" ON "wallets"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "wallets_region_idx" ON "wallets"("region");

-- CreateIndex
CREATE INDEX "wallets_status_idx" ON "wallets"("status");

-- CreateIndex
CREATE INDEX "wallets_createdAt_idx" ON "wallets"("createdAt");

-- CreateIndex
CREATE INDEX "transactions_walletId_idx" ON "transactions"("walletId");

-- CreateIndex
CREATE INDEX "transactions_metric_idx" ON "transactions"("metric");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "proofs_of_impact_txId_key" ON "proofs_of_impact"("txId");

-- CreateIndex
CREATE INDEX "proofs_of_impact_verified_idx" ON "proofs_of_impact"("verified");

-- CreateIndex
CREATE INDEX "proofs_of_impact_createdAt_idx" ON "proofs_of_impact"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_idx" ON "audit_logs"("eventType");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_result_idx" ON "audit_logs"("result");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "incident_reports_irfsId_key" ON "incident_reports"("irfsId");

-- CreateIndex
CREATE INDEX "incident_reports_severity_idx" ON "incident_reports"("severity");

-- CreateIndex
CREATE INDEX "incident_reports_category_idx" ON "incident_reports"("category");

-- CreateIndex
CREATE INDEX "incident_reports_status_idx" ON "incident_reports"("status");

-- CreateIndex
CREATE INDEX "incident_reports_createdAt_idx" ON "incident_reports"("createdAt");

-- CreateIndex
CREATE INDEX "region_reports_region_period_idx" ON "region_reports"("region", "period");

-- CreateIndex
CREATE INDEX "region_reports_createdAt_idx" ON "region_reports"("createdAt");
