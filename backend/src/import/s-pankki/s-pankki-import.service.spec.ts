import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SPankkiImportService } from './s-pankki-import.service';
import { TransactionService } from '@alisa-backend/accounting/transaction/transaction.service';
import { PropertyService } from '@alisa-backend/real-estate/property/property.service';
import { AuthService } from '@alisa-backend/auth/auth.service';
import { createJWTUser, createProperty } from 'test/factories';
import { MOCKS_PATH } from '@alisa-backend/constants';
import { SPankkiImportInput } from './dtos/s-pankki-import-input.dto';
import { TransactionStatus } from '@alisa-backend/common/types';

describe('SPankkiImportService', () => {
  let service: SPankkiImportService;
  let mockTransactionService: Partial<TransactionService>;
  let mockPropertyService: Partial<PropertyService>;
  let mockAuthService: Partial<AuthService>;

  const testUser = createJWTUser({ id: 1, ownershipInProperties: [1, 2] });
  const otherUser = createJWTUser({ id: 2, ownershipInProperties: [] });
  const testProperty = createProperty({ id: 1 });

  const testInput: SPankkiImportInput = {
    propertyId: 1,
    file: `${MOCKS_PATH}/import/s-pankki.transactions.csv`,
  };

  beforeEach(async () => {
    mockTransactionService = {
      search: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation((_, transaction) =>
        Promise.resolve({ ...transaction, id: Math.floor(Math.random() * 1000) }),
      ),
    };

    mockPropertyService = {
      findOne: jest.fn().mockResolvedValue(testProperty),
    };

    mockAuthService = {
      hasOwnership: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SPankkiImportService,
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: PropertyService, useValue: mockPropertyService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<SPankkiImportService>(SPankkiImportService);
  });

  describe('importCsv', () => {
    it('imports all transactions from CSV file', async () => {
      const result = await service.importCsv(testUser, testInput);

      // The CSV file has 61 data rows (excluding header)
      expect(result.totalRows).toBe(61);
      expect(result.skippedCount).toBe(0);
      expect(result.savedIds.length).toBe(61);
      expect(mockTransactionService.save).toHaveBeenCalledTimes(61);
    });

    it('parses Finnish date format correctly', async () => {
      await service.importCsv(testUser, testInput);

      const saveCall = (mockTransactionService.save as jest.Mock).mock.calls[0];
      const transaction = saveCall[1];

      // First row: 06.02.2026 should be parsed as 2026-02-06
      expect(transaction.transactionDate.getFullYear()).toBe(2026);
      expect(transaction.transactionDate.getMonth()).toBe(1); // February (0-indexed)
      expect(transaction.transactionDate.getDate()).toBe(6);
    });

    it('parses expense amounts correctly (negative values)', async () => {
      await service.importCsv(testUser, testInput);

      const saveCall = (mockTransactionService.save as jest.Mock).mock.calls[0];
      const transaction = saveCall[1];

      // First row: -2,58
      expect(transaction.amount).toBe(-2.58);
    });

    it('parses income amounts correctly (positive values)', async () => {
      await service.importCsv(testUser, testInput);

      // Find a call with positive amount (row 19 has +700,00)
      const saveCalls = (mockTransactionService.save as jest.Mock).mock.calls;
      const incomeTransaction = saveCalls.find(
        (call) => call[1].amount > 0 && call[1].amount === 700,
      );

      expect(incomeTransaction).toBeDefined();
      expect(incomeTransaction[1].amount).toBe(700);
    });

    it('sets correct sender and receiver for expenses', async () => {
      await service.importCsv(testUser, testInput);

      const saveCall = (mockTransactionService.save as jest.Mock).mock.calls[0];
      const transaction = saveCall[1];

      // First row: expense - payer is JUHA KOIVISTO, receiver is S-market Laihia
      expect(transaction.sender).toBe('JUHA KOIVISTO');
      expect(transaction.receiver).toBe('S-market Laihia');
    });

    it('extracts description from message field', async () => {
      await service.importCsv(testUser, testInput);

      const saveCalls = (mockTransactionService.save as jest.Mock).mock.calls;
      // Find the income transaction with 'Rahaa' message (row 19)
      const incomeTransaction = saveCalls.find(
        (call) => call[1].description === 'Rahaa',
      );

      expect(incomeTransaction).toBeDefined();
    });

    it('generates unique external IDs for duplicate prevention', async () => {
      await service.importCsv(testUser, testInput);

      const saveCalls = (mockTransactionService.save as jest.Mock).mock.calls;
      const externalIds = saveCalls.map((call) => call[1].externalId);
      const uniqueIds = new Set(externalIds);

      expect(uniqueIds.size).toBe(externalIds.length);
    });

    it('skips already accepted transactions', async () => {
      // Mock that first transaction already exists and is accepted
      let callCount = 0;
      (mockTransactionService.search as jest.Mock).mockImplementation(
        async () => {
          callCount++;
          if (callCount === 1) {
            // First transaction is already accepted
            return [{ id: 999, status: TransactionStatus.ACCEPTED }];
          }
          return [];
        },
      );

      const result = await service.importCsv(testUser, testInput);

      // First transaction should be skipped
      expect(result.skippedCount).toBe(1);
      expect(result.savedIds.length).toBe(60);
      expect(mockTransactionService.save).toHaveBeenCalledTimes(60);
    });

    it('updates pending transactions instead of skipping', async () => {
      // Mock that first transaction exists but is pending
      let callCount = 0;
      (mockTransactionService.search as jest.Mock).mockImplementation(
        async () => {
          callCount++;
          if (callCount === 1) {
            // First transaction is pending
            return [{ id: 999, status: TransactionStatus.PENDING }];
          }
          return [];
        },
      );

      const result = await service.importCsv(testUser, testInput);

      // All transactions should be processed, none skipped
      expect(result.skippedCount).toBe(0);
      expect(result.savedIds.length).toBe(61);

      // Verify the first save was called with existing ID
      const saveCalls = (mockTransactionService.save as jest.Mock).mock.calls;
      const hasExistingId = saveCalls.some((call) => call[1].id === 999);
      expect(hasExistingId).toBe(true);
    });

    it('throws NotFoundException when property does not exist', async () => {
      (mockPropertyService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.importCsv(testUser, testInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws UnauthorizedException when user has no ownership', async () => {
      (mockAuthService.hasOwnership as jest.Mock).mockResolvedValue(false);

      await expect(service.importCsv(otherUser, testInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
