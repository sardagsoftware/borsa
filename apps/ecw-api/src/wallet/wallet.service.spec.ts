import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../common/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';

/**
 * ECW v7.3 - Wallet Service Unit Tests
 * White-Hat Testing:
 * - Tests business logic in isolation
 * - Mocks Prisma (no real database)
 * - Tests error cases (409, 404)
 * - Tests happy paths
 * - Coverage target: ≥80%
 */
describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaService;

  // Mock Prisma client
  const mockPrismaService = {
    wallet: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWallet', () => {
    const validDto: CreateWalletDto = {
      ownerType: 'individual',
      ownerId: 'user-123',
      region: 'EU',
    };

    it('should create a wallet successfully with default values', async () => {
      // Mock: No existing wallet
      mockPrismaService.wallet.findFirst.mockResolvedValue(null);

      // Mock: Wallet created
      const createdWallet = {
        id: 'cuid-123',
        ownerType: 'individual',
        ownerId: 'user-123',
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
      mockPrismaService.wallet.create.mockResolvedValue(createdWallet);

      const result = await service.createWallet(validDto);

      expect(result.id).toBe('cuid-123');
      expect(result.ownerType).toBe('individual');
      expect(result.balanceCO2).toBe(0);
      expect(mockPrismaService.wallet.findFirst).toHaveBeenCalledWith({
        where: {
          ownerType: 'individual',
          ownerId: 'user-123',
          region: 'EU',
        },
      });
      expect(mockPrismaService.wallet.create).toHaveBeenCalled();
    });

    it('should create a wallet with custom initial values', async () => {
      const dtoWithBalances: CreateWalletDto = {
        ...validDto,
        balanceCO2: 100,
        balanceH2O: 200,
        ethicsScore: 50,
      };

      mockPrismaService.wallet.findFirst.mockResolvedValue(null);

      const createdWallet = {
        id: 'cuid-456',
        ownerType: 'individual',
        ownerId: 'user-123',
        region: 'EU',
        balanceCO2: 100,
        balanceH2O: 200,
        balanceKWh: 0,
        balanceWaste: 0,
        ethicsScore: 50,
        impactScore: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.wallet.create.mockResolvedValue(createdWallet);

      const result = await service.createWallet(dtoWithBalances);

      expect(result.balanceCO2).toBe(100);
      expect(result.balanceH2O).toBe(200);
      expect(result.ethicsScore).toBe(50);
    });

    it('should throw ConflictException if wallet already exists', async () => {
      // Mock: Existing wallet found
      mockPrismaService.wallet.findFirst.mockResolvedValue({
        id: 'existing-id',
        ownerType: 'individual',
        ownerId: 'user-123',
        region: 'EU',
      });

      await expect(service.createWallet(validDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockPrismaService.wallet.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.wallet.create).not.toHaveBeenCalled();
    });
  });

  describe('getWalletById', () => {
    it('should return a wallet by ID', async () => {
      const mockWallet = {
        id: 'wallet-123',
        ownerType: 'individual',
        ownerId: 'user-456',
        region: 'TR',
        balanceCO2: 50,
        balanceH2O: 100,
        balanceKWh: 75,
        balanceWaste: 25,
        ethicsScore: 80,
        impactScore: 90,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getWalletById('wallet-123');

      expect(result.id).toBe('wallet-123');
      expect(result.ethicsScore).toBe(80);
      expect(mockPrismaService.wallet.findUnique).toHaveBeenCalledWith({
        where: { id: 'wallet-123' },
      });
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      await expect(service.getWalletById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWalletByOwner', () => {
    it('should return a wallet by owner ID and region', async () => {
      const mockWallet = {
        id: 'wallet-789',
        ownerType: 'organization',
        ownerId: 'org-456',
        region: 'US',
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

      mockPrismaService.wallet.findFirst.mockResolvedValue(mockWallet);

      const result = await service.getWalletByOwner(
        'organization',
        'org-456',
        'US',
      );

      expect(result).not.toBeNull();
      expect(result?.ownerType).toBe('organization');
      expect(mockPrismaService.wallet.findFirst).toHaveBeenCalledWith({
        where: {
          ownerType: 'organization',
          ownerId: 'org-456',
          region: 'US',
        },
      });
    });

    it('should return null if wallet not found', async () => {
      mockPrismaService.wallet.findFirst.mockResolvedValue(null);

      const result = await service.getWalletByOwner(
        'individual',
        'user-999',
        'EU',
      );

      expect(result).toBeNull();
    });
  });

  describe('updateBalances', () => {
    it('should update wallet balances atomically', async () => {
      const updatedWallet = {
        id: 'wallet-123',
        ownerType: 'individual',
        ownerId: 'user-123',
        region: 'EU',
        balanceCO2: 150, // 100 + 50 delta
        balanceH2O: 250, // 200 + 50 delta
        balanceKWh: 0,
        balanceWaste: 0,
        ethicsScore: 0,
        impactScore: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.wallet.update.mockResolvedValue(updatedWallet);

      const result = await service.updateBalances('wallet-123', {
        CO2: 50,
        H2O: 50,
      });

      expect(result.balanceCO2).toBe(150);
      expect(result.balanceH2O).toBe(250);
      expect(mockPrismaService.wallet.update).toHaveBeenCalled();
    });
  });

  describe('updateEthicsScores', () => {
    it('should update ethics scores', async () => {
      const updatedWallet = {
        id: 'wallet-123',
        ownerType: 'individual',
        ownerId: 'user-123',
        region: 'EU',
        balanceCO2: 100,
        balanceH2O: 200,
        balanceKWh: 0,
        balanceWaste: 0,
        ethicsScore: 85, // Updated Ω
        impactScore: 92, // Updated Φ
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.wallet.update.mockResolvedValue(updatedWallet);

      const result = await service.updateEthicsScores(
        'wallet-123',
        85,
        92,
      );

      expect(result.ethicsScore).toBe(85);
      expect(result.impactScore).toBe(92);
    });
  });

  describe('deactivateWallet', () => {
    it('should deactivate a wallet (soft delete)', async () => {
      const deactivatedWallet = {
        id: 'wallet-123',
        ownerType: 'individual',
        ownerId: 'user-123',
        region: 'EU',
        balanceCO2: 100,
        balanceH2O: 200,
        balanceKWh: 0,
        balanceWaste: 0,
        ethicsScore: 0,
        impactScore: 0,
        status: 'inactive', // Status changed
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.wallet.update.mockResolvedValue(deactivatedWallet);

      const result = await service.deactivateWallet('wallet-123');

      expect(result.status).toBe('inactive');
      expect(mockPrismaService.wallet.update).toHaveBeenCalledWith({
        where: { id: 'wallet-123' },
        data: { status: 'inactive' },
      });
    });
  });

  describe('getWalletStats', () => {
    it('should return aggregated wallet statistics', async () => {
      mockPrismaService.wallet.count.mockResolvedValue(100);
      mockPrismaService.wallet.groupBy.mockResolvedValueOnce([
        { region: 'EU', _count: 50 },
        { region: 'TR', _count: 30 },
        { region: 'US', _count: 20 },
      ]);
      mockPrismaService.wallet.groupBy.mockResolvedValueOnce([
        { ownerType: 'individual', _count: 60 },
        { ownerType: 'organization', _count: 30 },
        { ownerType: 'city', _count: 10 },
      ]);

      const result = await service.getWalletStats();

      expect(result.total).toBe(100);
      expect(result.byRegion.EU).toBe(50);
      expect(result.byRegion.TR).toBe(30);
      expect(result.byRegion.US).toBe(20);
      expect(result.byOwnerType.individual).toBe(60);
      expect(result.byOwnerType.organization).toBe(30);
      expect(result.byOwnerType.city).toBe(10);
    });
  });
});
