import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProofService } from './proof.service';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * ECW v7.3 - Proof Service Unit Tests
 * White-Hat Testing:
 * - Tests cryptographic operations (JWS signing)
 * - Tests Merkle tree construction
 * - Tests proof verification
 * - Mocks Prisma (no real database)
 * - Coverage target: ≥80%
 */
describe('ProofService', () => {
  let service: ProofService;
  let prisma: PrismaService;
  let configService: ConfigService;

  // Mock Prisma client
  const mockPrismaService = {
    proofOfImpact: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn((key: string) => {
      // Return null for JWS keys (will generate ephemeral keys)
      if (key === 'JWS_PRIVATE_KEY' || key === 'JWS_PUBLIC_KEY') {
        return null;
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProofService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ProofService>(ProofService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateProof', () => {
    const mockTransaction = {
      id: 'tx-123',
      walletId: 'wallet-456',
      type: 'credit',
      metric: 'CO2',
      amount: 100,
      ethicsScore: 75,
      impactScore: 60,
    };

    it('should generate a JWS proof successfully', async () => {
      // Mock: ProofOfImpact created
      mockPrismaService.proofOfImpact.create.mockResolvedValue({
        id: 'proof-123',
        txId: 'tx-123',
        jws: 'eyJhbGciOiJFUzI1NiJ9.eyJ0eElkIjoidHgtMTIzIn0.signature',
        merkleRoot: 'abc123',
        tsr: null,
        verified: false,
        arpId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const jws = await service.generateProof(mockTransaction);

      expect(jws).toBeTruthy();
      expect(jws).toContain('.'); // JWS format (header.payload.signature)

      // Verify ProofOfImpact was created
      expect(mockPrismaService.proofOfImpact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          txId: 'tx-123',
          jws: expect.any(String),
          merkleRoot: expect.any(String),
          verified: false,
        }),
      });
    });

    it('should generate valid JWS with correct payload', async () => {
      mockPrismaService.proofOfImpact.create.mockResolvedValue({
        id: 'proof-456',
        txId: 'tx-123',
        jws: 'eyJhbGciOiJFUzI1NiJ9.payload.signature',
        merkleRoot: 'def456',
        tsr: null,
        verified: false,
        arpId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const jws = await service.generateProof(mockTransaction);

      // JWS should contain header, payload, signature
      const parts = jws.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  describe('verifyProof', () => {
    it('should verify a proof successfully', async () => {
      const mockProof = {
        id: 'proof-123',
        txId: 'tx-123',
        jws: 'eyJhbGciOiJFUzI1NiJ9.eyJ0eElkIjoidHgtMTIzIiwid2FsbGV0SWQiOiJ3YWxsZXQtNDU2In0.signature',
        merkleRoot: 'abc123',
        tsr: null,
        verified: false,
        arpId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.proofOfImpact.findUnique.mockResolvedValue(mockProof);
      mockPrismaService.proofOfImpact.update.mockResolvedValue({
        ...mockProof,
        verified: true,
      });

      // Generate a real proof first (to get valid JWS)
      mockPrismaService.proofOfImpact.create.mockResolvedValue(mockProof);
      const jws = await service.generateProof({
        id: 'tx-123',
        walletId: 'wallet-456',
        type: 'credit',
        metric: 'CO2',
        amount: 100,
        ethicsScore: 75,
        impactScore: 60,
      });

      // Update mock with real JWS
      mockProof.jws = jws;
      mockPrismaService.proofOfImpact.findUnique.mockResolvedValue(mockProof);

      const result = await service.verifyProof('tx-123');

      expect(result.verified).toBe(true);
      expect(result.txId).toBe('tx-123');
      expect(result.jws).toBe(jws);
      expect(result.merkleRoot).toBe('abc123');
    });

    it('should throw NotFoundException if proof not found', async () => {
      mockPrismaService.proofOfImpact.findUnique.mockResolvedValue(null);

      await expect(service.verifyProof('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should fail verification for invalid JWS', async () => {
      const mockProof = {
        id: 'proof-789',
        txId: 'tx-789',
        jws: 'invalid.jws.signature', // Invalid JWS
        merkleRoot: 'xyz789',
        tsr: null,
        verified: false,
        arpId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.proofOfImpact.findUnique.mockResolvedValue(mockProof);

      const result = await service.verifyProof('tx-789');

      expect(result.verified).toBe(false);
    });
  });

  describe('getProofByTxId', () => {
    it('should return proof by transaction ID', async () => {
      // Generate real proof first
      mockPrismaService.proofOfImpact.create.mockResolvedValue({
        id: 'proof-999',
        txId: 'tx-999',
        jws: 'eyJhbGciOiJFUzI1NiJ9.payload.sig',
        merkleRoot: 'aaa999',
        tsr: null,
        verified: false,
        arpId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const jws = await service.generateProof({
        id: 'tx-999',
        walletId: 'wallet-999',
        type: 'credit',
        metric: 'CO2',
        amount: 50,
        ethicsScore: 80,
        impactScore: 70,
      });

      const mockProof = {
        id: 'proof-999',
        txId: 'tx-999',
        jws,
        merkleRoot: 'aaa999',
        tsr: null,
        verified: false,
        arpId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.proofOfImpact.findUnique.mockResolvedValue(mockProof);

      const result = await service.getProofByTxId('tx-999');

      expect(result.txId).toBe('tx-999');
      expect(result.jws).toBe(jws);
    });

    it('should throw NotFoundException if proof not found', async () => {
      mockPrismaService.proofOfImpact.findUnique.mockResolvedValue(null);

      await expect(service.getProofByTxId('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProofStats', () => {
    it('should return aggregated proof statistics', async () => {
      mockPrismaService.proofOfImpact.count.mockResolvedValueOnce(100); // total
      mockPrismaService.proofOfImpact.count.mockResolvedValueOnce(85); // verified
      mockPrismaService.proofOfImpact.count.mockResolvedValueOnce(20); // with timestamp

      const result = await service.getProofStats();

      expect(result.totalProofs).toBe(100);
      expect(result.verifiedProofs).toBe(85);
      expect(result.proofsWithTimestamp).toBe(20);
    });
  });
});
