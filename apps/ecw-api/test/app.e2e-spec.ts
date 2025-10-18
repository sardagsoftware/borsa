import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

/**
 * ECW v7.3 - E2E Tests
 * White-Hat End-to-End Testing:
 * - Complete flow: Wallet → Transaction → Proof
 * - Real database operations (in-memory SQLite)
 * - API endpoint testing
 * - Integration testing
 */
describe('ECW API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Set test environment variables
    process.env.DATABASE_URL = 'file::memory:?cache=shared';
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-min-32-chars-for-testing';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes (same as production)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('v7.3/ecw');

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean database before tests
    await prisma.proofOfImpact.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.wallet.deleteMany();
  });

  afterAll(async () => {
    // Clean up
    await prisma.proofOfImpact.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.wallet.deleteMany();
    await app.close();
  });

  describe('Complete Flow: Wallet → Transaction → Proof', () => {
    let walletId: string;
    let txId: string;

    it('Step 1: Create wallet (POST /wallet/create)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v7.3/ecw/wallet/create')
        .send({
          ownerType: 'individual',
          ownerId: 'test-user-001',
          region: 'EU',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.ownerType).toBe('individual');
      expect(response.body.data.balanceCO2).toBe(0);

      walletId = response.body.data.id;
    });

    it('Step 2: Get wallet by ID (GET /wallet/:id)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v7.3/ecw/wallet/${walletId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(walletId);
      expect(response.body.data.ethicsScore).toBe(0); // No transactions yet
    });

    it('Step 3: Log transaction (POST /tx/log)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v7.3/ecw/tx/log')
        .send({
          walletId,
          type: 'credit',
          metric: 'CO2',
          amount: 100,
          reason: 'E2E test: Recycled plastic bottles',
          source: 'manual',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.walletId).toBe(walletId);
      expect(response.body.data.type).toBe('credit');
      expect(response.body.data.amount).toBe(100);
      expect(response.body.data.ethicsScore).toBeGreaterThan(0); // Ω calculated
      expect(response.body.data.impactScore).toBeGreaterThan(0); // Φ calculated
      expect(response.body.data.proofJws).toBeTruthy(); // Real JWS generated

      txId = response.body.data.id;
    });

    it('Step 4: Check wallet balance updated (GET /wallet/:id)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v7.3/ecw/wallet/${walletId}`)
        .expect(200);

      expect(response.body.data.balanceCO2).toBe(100); // Credit = +100
      expect(response.body.data.ethicsScore).toBeGreaterThan(0); // Recalculated
      expect(response.body.data.impactScore).toBeGreaterThan(0); // Recalculated
    });

    it('Step 5: Get transaction history (GET /tx/history/:walletId)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v7.3/ecw/tx/history/${walletId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(txId);
    });

    it('Step 6: Verify proof (POST /proof/verify)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v7.3/ecw/proof/verify')
        .send({ txId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBe(true); // JWS signature valid
      expect(response.body.data.txId).toBe(txId);
      expect(response.body.data.jws).toBeTruthy();
      expect(response.body.data.merkleRoot).toBeTruthy();
      expect(response.body.data.payload).toHaveProperty('walletId', walletId);
    });

    it('Step 7: Get proof by txId (GET /proof/:txId)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v7.3/ecw/proof/${txId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.txId).toBe(txId);
      expect(response.body.data.verified).toBe(true);
    });

    it('Step 8: Get wallet stats (GET /wallet/stats)', async () => {
      const response = await request(app.getHttpServer())
        .get('/v7.3/ecw/wallet/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.byRegion.EU).toBeGreaterThan(0);
    });

    it('Step 9: Get transaction stats (GET /tx/stats/:walletId)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v7.3/ecw/tx/stats/${walletId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTransactions).toBe(1);
      expect(response.body.data.totalCredits).toBe(1);
      expect(response.body.data.totalDebits).toBe(0);
      expect(response.body.data.avgEthicsScore).toBeGreaterThan(0);
    });

    it('Step 10: Get proof stats (GET /proof/stats)', async () => {
      const response = await request(app.getHttpServer())
        .get('/v7.3/ecw/proof/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalProofs).toBeGreaterThan(0);
      expect(response.body.data.verifiedProofs).toBeGreaterThan(0);
    });
  });

  describe('Wallet API', () => {
    it('should create wallet with custom initial balances', async () => {
      const response = await request(app.getHttpServer())
        .post('/v7.3/ecw/wallet/create')
        .send({
          ownerType: 'organization',
          ownerId: 'test-org-001',
          region: 'TR',
          balanceCO2: 500,
          balanceH2O: 1000,
          ethicsScore: 75,
        })
        .expect(201);

      expect(response.body.data.balanceCO2).toBe(500);
      expect(response.body.data.balanceH2O).toBe(1000);
      expect(response.body.data.ethicsScore).toBe(75);
    });

    it('should reject duplicate wallet (409 Conflict)', async () => {
      await request(app.getHttpServer())
        .post('/v7.3/ecw/wallet/create')
        .send({
          ownerType: 'individual',
          ownerId: 'duplicate-user',
          region: 'US',
        })
        .expect(201);

      // Try to create duplicate
      const response = await request(app.getHttpServer())
        .post('/v7.3/ecw/wallet/create')
        .send({
          ownerType: 'individual',
          ownerId: 'duplicate-user',
          region: 'US',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid input (400 Bad Request)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v7.3/ecw/wallet/create')
        .send({
          ownerType: 'invalid-type', // Invalid enum
          ownerId: 'test',
          region: 'EU',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for nonexistent wallet', async () => {
      await request(app.getHttpServer())
        .get('/v7.3/ecw/wallet/nonexistent-id')
        .expect(404);
    });
  });

  describe('Transaction API', () => {
    let testWalletId: string;

    beforeAll(async () => {
      // Create test wallet
      const response = await request(app.getHttpServer())
        .post('/v7.3/ecw/wallet/create')
        .send({
          ownerType: 'individual',
          ownerId: 'tx-test-user',
          region: 'EU',
        })
        .expect(201);

      testWalletId = response.body.data.id;
    });

    it('should log debit transaction', async () => {
      const response = await request(app.getHttpServer())
        .post('/v7.3/ecw/tx/log')
        .send({
          walletId: testWalletId,
          type: 'debit',
          metric: 'CO2',
          amount: 50,
          reason: 'E2E test: Energy consumption',
          source: 'manual',
        })
        .expect(201);

      expect(response.body.data.type).toBe('debit');
      expect(response.body.data.amount).toBe(50);
    });

    it('should check balance after debit', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v7.3/ecw/wallet/${testWalletId}`)
        .expect(200);

      expect(response.body.data.balanceCO2).toBe(-50); // Debit = -50
    });

    it('should reject transaction for nonexistent wallet', async () => {
      await request(app.getHttpServer())
        .post('/v7.3/ecw/tx/log')
        .send({
          walletId: 'nonexistent-wallet',
          type: 'credit',
          metric: 'CO2',
          amount: 100,
          reason: 'Test',
          source: 'manual',
        })
        .expect(404);
    });

    it('should reject invalid transaction input', async () => {
      await request(app.getHttpServer())
        .post('/v7.3/ecw/tx/log')
        .send({
          walletId: testWalletId,
          type: 'invalid-type', // Invalid enum
          metric: 'CO2',
          amount: 100,
          reason: 'Test',
          source: 'manual',
        })
        .expect(400);
    });
  });

  describe('Proof API', () => {
    it('should return 404 for nonexistent proof', async () => {
      await request(app.getHttpServer())
        .get('/v7.3/ecw/proof/nonexistent-tx')
        .expect(404);
    });

    it('should return 404 when verifying nonexistent proof', async () => {
      await request(app.getHttpServer())
        .post('/v7.3/ecw/proof/verify')
        .send({ txId: 'nonexistent-tx' })
        .expect(404);
    });
  });
});
