import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../common/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ProofService } from '../proof/proof.service';
import { LogTransactionDto } from './dto/log-transaction.dto';

/**
 * ECW v7.3 - Transaction Service Unit Tests
 * White-Hat Testing:
 * - Tests business logic in isolation
 * - Mocks Prisma, WalletService, and ProofService
 * - Tests error cases (404)
 * - Tests happy paths
 * - Tests ethics scoring
 * - Tests wallet balance updates
 * - Coverage target: ≥80%
 */
describe('TransactionService', () => {
  let service: TransactionService;
  let prisma: PrismaService;
  let walletService: WalletService;
  let proofService: ProofService;

  // Mock Prisma client
  const mockPrismaService = {
    transaction: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  // Mock WalletService
  const mockWalletService = {
    getWalletById: jest.fn(),
    updateBalances: jest.fn(),
    updateEthicsScores: jest.fn(),
  };

  // Mock ProofService
  const mockProofService = {
    generateProof: jest.fn().mockResolvedValue('eyJhbGciOiJFUzI1NiJ9.payload.signature'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
        {
          provide: ProofService,
          useValue: mockProofService,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prisma = module.get<PrismaService>(PrismaService);
    walletService = module.get<WalletService>(WalletService);
    proofService = module.get<ProofService>(ProofService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logTransaction', () => {
    const validDto: LogTransactionDto = {
      walletId: 'wallet-123',
      type: 'credit',
      metric: 'CO2',
      amount: 100,
      reason: 'Recycled plastic bottles',
      source: 'manual',
    };

    const mockWallet = {
      id: 'wallet-123',
      ownerType: 'individual',
      ownerId: 'user-456',
      region: 'EU',
      balanceCO2: 0,
      balanceH2O: 0,
      balanceKWh: 0,
      balanceWaste: 0,
      ethicsScore: 0,
      impactScore: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should log a transaction successfully (credit)', async () => {
      // Mock: Wallet exists
      mockWalletService.getWalletById.mockResolvedValue(mockWallet);

      // Mock: Transaction created
      const createdTx = {
        id: 'tx-123',
        walletId: 'wallet-123',
        type: 'credit',
        metric: 'CO2',
        amount: 100,
        reason: 'Recycled plastic bottles',
        source: 'manual',
        ethicsScore: 60,
        impactScore: 50,
        intentScore: null,
        proofJws: 'base64-encoded-placeholder',
        externalRef: null,
        createdAt: new Date(),
      };
      mockPrismaService.transaction.create.mockResolvedValue(createdTx);

      // Mock: Proof generated
      mockProofService.generateProof.mockResolvedValue('eyJhbGciOiJFUzI1NiJ9.payload.sig');

      // Mock: Transaction updated with JWS
      mockPrismaService.transaction.update.mockResolvedValue(createdTx);

      // Mock: Wallet balances updated
      mockWalletService.updateBalances.mockResolvedValue(mockWallet);

      // Mock: Recent transactions for ethics score recalculation
      mockPrismaService.transaction.findMany.mockResolvedValue([createdTx]);

      // Mock: Ethics scores updated
      mockWalletService.updateEthicsScores.mockResolvedValue(mockWallet);

      const result = await service.logTransaction(validDto);

      expect(result.id).toBe('tx-123');
      expect(result.type).toBe('credit');
      expect(result.amount).toBe(100);
      expect(result.ethicsScore).toBeGreaterThan(0);
      expect(result.impactScore).toBeGreaterThan(0);

      // Verify wallet was validated
      expect(mockWalletService.getWalletById).toHaveBeenCalledWith('wallet-123');

      // Verify transaction was created
      expect(mockPrismaService.transaction.create).toHaveBeenCalled();

      // Verify wallet balance was updated
      expect(mockWalletService.updateBalances).toHaveBeenCalledWith(
        'wallet-123',
        expect.objectContaining({
          CO2: 100, // Credit = positive delta
        }),
      );

      // Verify ethics scores were updated
      expect(mockWalletService.updateEthicsScores).toHaveBeenCalled();
    });

    it('should log a debit transaction successfully', async () => {
      const debitDto: LogTransactionDto = {
        ...validDto,
        type: 'debit',
        reason: 'Used electricity',
      };

      mockWalletService.getWalletById.mockResolvedValue(mockWallet);

      const createdTx = {
        id: 'tx-456',
        walletId: 'wallet-123',
        type: 'debit',
        metric: 'CO2',
        amount: 100,
        reason: 'Used electricity',
        source: 'manual',
        ethicsScore: 55,
        impactScore: 45,
        intentScore: null,
        proofJws: 'base64-encoded-placeholder',
        externalRef: null,
        createdAt: new Date(),
      };
      mockPrismaService.transaction.create.mockResolvedValue(createdTx);
      mockProofService.generateProof.mockResolvedValue('eyJhbGciOiJFUzI1NiJ9.payload.sig');
      mockPrismaService.transaction.update.mockResolvedValue(createdTx);
      mockWalletService.updateBalances.mockResolvedValue(mockWallet);
      mockPrismaService.transaction.findMany.mockResolvedValue([createdTx]);
      mockWalletService.updateEthicsScores.mockResolvedValue(mockWallet);

      const result = await service.logTransaction(debitDto);

      expect(result.type).toBe('debit');

      // Verify wallet balance was updated with negative delta
      expect(mockWalletService.updateBalances).toHaveBeenCalledWith(
        'wallet-123',
        expect.objectContaining({
          CO2: -100, // Debit = negative delta
        }),
      );
    });

    it('should throw NotFoundException if wallet not found', async () => {
      // Mock: Wallet not found
      mockWalletService.getWalletById.mockRejectedValue(
        new NotFoundException('Wallet not found'),
      );

      await expect(service.logTransaction(validDto)).rejects.toThrow(
        NotFoundException,
      );

      // Verify transaction was not created
      expect(mockPrismaService.transaction.create).not.toHaveBeenCalled();
    });

    it('should calculate higher ethics score for reliable sources', async () => {
      const nicoDto: LogTransactionDto = {
        ...validDto,
        source: 'nico', // Reliable source
      };

      mockWalletService.getWalletById.mockResolvedValue(mockWallet);

      const createdTx = {
        id: 'tx-789',
        walletId: 'wallet-123',
        type: 'credit',
        metric: 'CO2',
        amount: 100,
        reason: 'Verified by NICO',
        source: 'nico',
        ethicsScore: 80, // Higher score due to NICO source
        impactScore: 50,
        intentScore: null,
        proofJws: 'base64-encoded-placeholder',
        externalRef: null,
        createdAt: new Date(),
      };
      mockPrismaService.transaction.create.mockResolvedValue(createdTx);
      mockProofService.generateProof.mockResolvedValue('eyJhbGciOiJFUzI1NiJ9.payload.sig3');
      mockPrismaService.transaction.update.mockResolvedValue(createdTx);
      mockWalletService.updateBalances.mockResolvedValue(mockWallet);
      mockPrismaService.transaction.findMany.mockResolvedValue([createdTx]);
      mockWalletService.updateEthicsScores.mockResolvedValue(mockWallet);

      const result = await service.logTransaction(nicoDto);

      expect(result.ethicsScore).toBeGreaterThan(60); // Higher than manual source
    });

    it('should include intent score if provided', async () => {
      const dtoWithIntent: LogTransactionDto = {
        ...validDto,
        intentScore: 90,
      };

      mockWalletService.getWalletById.mockResolvedValue(mockWallet);

      const createdTx = {
        id: 'tx-999',
        walletId: 'wallet-123',
        type: 'credit',
        metric: 'CO2',
        amount: 100,
        reason: 'High intent action',
        source: 'manual',
        ethicsScore: 70,
        impactScore: 50,
        intentScore: 90,
        proofJws: 'base64-encoded-placeholder',
        externalRef: null,
        createdAt: new Date(),
      };
      mockPrismaService.transaction.create.mockResolvedValue(createdTx);
      mockProofService.generateProof.mockResolvedValue('eyJhbGciOiJFUzI1NiJ9.payload.sig4');
      mockPrismaService.transaction.update.mockResolvedValue(createdTx);
      mockWalletService.updateBalances.mockResolvedValue(mockWallet);
      mockPrismaService.transaction.findMany.mockResolvedValue([createdTx]);
      mockWalletService.updateEthicsScores.mockResolvedValue(mockWallet);

      const result = await service.logTransaction(dtoWithIntent);

      expect(result.intentScore).toBe(90);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history for a wallet', async () => {
      const mockWallet = {
        id: 'wallet-123',
        ownerType: 'individual',
        ownerId: 'user-456',
        region: 'EU',
        balanceCO2: 100,
        balanceH2O: 0,
        balanceKWh: 0,
        balanceWaste: 0,
        ethicsScore: 60,
        impactScore: 50,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTransactions = [
        {
          id: 'tx-1',
          walletId: 'wallet-123',
          type: 'credit',
          metric: 'CO2',
          amount: 100,
          reason: 'Recycling',
          source: 'manual',
          ethicsScore: 60,
          impactScore: 50,
          intentScore: null,
          proofJws: 'jws-1',
          externalRef: null,
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          walletId: 'wallet-123',
          type: 'debit',
          metric: 'CO2',
          amount: 50,
          reason: 'Energy use',
          source: 'manual',
          ethicsScore: 55,
          impactScore: 45,
          intentScore: null,
          proofJws: 'jws-2',
          externalRef: null,
          createdAt: new Date(),
        },
      ];

      mockWalletService.getWalletById.mockResolvedValue(mockWallet);
      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getTransactionHistory('wallet-123', 50, 0);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('tx-1');
      expect(result[1].id).toBe('tx-2');

      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { walletId: 'wallet-123' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockWalletService.getWalletById.mockRejectedValue(
        new NotFoundException('Wallet not found'),
      );

      await expect(
        service.getTransactionHistory('nonexistent', 50, 0),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransactionById', () => {
    it('should return a transaction by ID', async () => {
      const mockTx = {
        id: 'tx-123',
        walletId: 'wallet-123',
        type: 'credit',
        metric: 'CO2',
        amount: 100,
        reason: 'Recycling',
        source: 'manual',
        ethicsScore: 60,
        impactScore: 50,
        intentScore: null,
        proofJws: 'jws-123',
        externalRef: null,
        createdAt: new Date(),
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(mockTx);

      const result = await service.getTransactionById('tx-123');

      expect(result.id).toBe('tx-123');
      expect(result.amount).toBe(100);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockPrismaService.transaction.findUnique.mockResolvedValue(null);

      await expect(service.getTransactionById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWalletTransactionStats', () => {
    it('should return aggregated statistics', async () => {
      const mockWallet = {
        id: 'wallet-123',
        ownerType: 'individual',
        ownerId: 'user-456',
        region: 'EU',
        balanceCO2: 100,
        balanceH2O: 0,
        balanceKWh: 0,
        balanceWaste: 0,
        ethicsScore: 60,
        impactScore: 50,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWalletService.getWalletById.mockResolvedValue(mockWallet);
      mockPrismaService.transaction.count.mockResolvedValueOnce(10); // total
      mockPrismaService.transaction.count.mockResolvedValueOnce(6); // credits
      mockPrismaService.transaction.count.mockResolvedValueOnce(4); // debits
      mockPrismaService.transaction.aggregate.mockResolvedValue({
        _avg: { ethicsScore: 60, impactScore: 50 },
      });
      mockPrismaService.transaction.groupBy.mockResolvedValue([
        { metric: 'CO2', type: 'credit', _sum: { amount: 300 } },
        { metric: 'CO2', type: 'debit', _sum: { amount: 100 } },
      ]);

      const result = await service.getWalletTransactionStats('wallet-123');

      expect(result.totalTransactions).toBe(10);
      expect(result.totalCredits).toBe(6);
      expect(result.totalDebits).toBe(4);
      expect(result.avgEthicsScore).toBe(60);
      expect(result.avgImpactScore).toBe(50);
      expect(result.byMetric.CO2.credits).toBe(300);
      expect(result.byMetric.CO2.debits).toBe(100);
    });
  });
});
