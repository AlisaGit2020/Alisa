# Charge Payment Splitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split property charge payment transactions (yhtiövastike) into individual expense rows per charge type, with manual and automatic (allocation rule) triggers.

**Architecture:** Follows the existing loan payment splitting pattern exactly. Adds `splitChargePayment` and `splitChargePaymentBulk` to `TransactionService`, a `getChargesForDate` method to `PropertyChargeService`, allocation rule integration in `AllocationRuleService`, and frontend buttons in both import and pending views.

**Tech Stack:** NestJS, TypeORM, React, Material-UI, i18next

---

### Task 1: Add `chargeTypeToExpenseTypeKey` mapping to common types

**Files:**
- Modify: `backend/src/common/types.ts:217-222`

- [ ] **Step 1: Add the mapping**

Add after the existing `chargeTypeNames` map (line 222) in `backend/src/common/types.ts`:

```typescript
export const chargeTypeToExpenseTypeKey = new Map<ChargeType, ExpenseTypeKey>([
  [ChargeType.MAINTENANCE_FEE, ExpenseTypeKey.MAINTENANCE_CHARGE],
  [ChargeType.FINANCIAL_CHARGE, ExpenseTypeKey.FINANCIAL_CHARGE],
  [ChargeType.WATER_PREPAYMENT, ExpenseTypeKey.WATER],
  [ChargeType.OTHER_CHARGE_BASED, ExpenseTypeKey.OTHER_CHARGE_BASED],
]);
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/common/types.ts
git commit -m "feat: add chargeTypeToExpenseTypeKey mapping"
```

---

### Task 2: Add `getChargesForDate` to `PropertyChargeService`

**Files:**
- Modify: `backend/src/real-estate/property/property-charge.service.ts`
- Modify: `backend/src/real-estate/property/property-charge.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Add a new `describe` block in `backend/src/real-estate/property/property-charge.service.spec.ts`:

```typescript
describe('getChargesForDate', () => {
  it('returns charges active on a given date', async () => {
    const charges = [
      {
        id: 1,
        propertyId: 1,
        chargeType: ChargeType.MAINTENANCE_FEE,
        amount: 200,
        startDate: new Date('2024-01-01'),
        endDate: null,
      },
      {
        id: 2,
        propertyId: 1,
        chargeType: ChargeType.FINANCIAL_CHARGE,
        amount: 100,
        startDate: new Date('2024-01-01'),
        endDate: null,
      },
    ];

    const mockQueryBuilder = mockRepository.createQueryBuilder();
    mockQueryBuilder.getMany.mockResolvedValue(charges);

    const result = await service.getChargesForDate(1, new Date('2024-06-15'));

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(200);
    expect(result[1].amount).toBe(100);
  });

  it('returns empty array when no charges are active on date', async () => {
    const mockQueryBuilder = mockRepository.createQueryBuilder();
    mockQueryBuilder.getMany.mockResolvedValue([]);

    const result = await service.getChargesForDate(1, new Date('2020-01-01'));

    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest --testPathPattern="property-charge.service.spec" --verbose`
Expected: FAIL with "service.getChargesForDate is not a function"

- [ ] **Step 3: Implement `getChargesForDate`**

Add to `backend/src/real-estate/property/property-charge.service.ts` (after the `getCurrentCharges` method, around line 85):

```typescript
async getChargesForDate(propertyId: number, date: Date): Promise<PropertyCharge[]> {
  return this.repository
    .createQueryBuilder('charge')
    .where('charge.propertyId = :propertyId', { propertyId })
    .andWhere('(charge.startDate IS NULL OR charge.startDate <= :date)', { date })
    .andWhere('(charge.endDate IS NULL OR charge.endDate >= :date)', { date })
    .getMany();
}
```

Note: This method intentionally does NOT require a `JWTUser` or check ownership — it's an internal service method called from `TransactionService` which already handles ownership checks.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest --testPathPattern="property-charge.service.spec" --verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/real-estate/property/property-charge.service.ts backend/src/real-estate/property/property-charge.service.spec.ts
git commit -m "feat: add getChargesForDate to PropertyChargeService"
```

---

### Task 3: Create `SplitChargePaymentBulkInputDto`

**Files:**
- Create: `backend/src/accounting/transaction/dtos/split-charge-payment-bulk-input.dto.ts`

- [ ] **Step 1: Create the DTO**

Create `backend/src/accounting/transaction/dtos/split-charge-payment-bulk-input.dto.ts`:

```typescript
import { IsArray } from 'class-validator';

export class SplitChargePaymentBulkInputDto {
  @IsArray()
  ids: number[];
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/accounting/transaction/dtos/split-charge-payment-bulk-input.dto.ts
git commit -m "feat: add SplitChargePaymentBulkInputDto"
```

---

### Task 4: Implement `splitChargePayment` in `TransactionService`

**Files:**
- Modify: `backend/src/accounting/transaction/transaction.service.ts`
- Modify: `backend/src/accounting/transaction/transaction.service.spec.ts`

- [ ] **Step 1: Inject `PropertyChargeService` into `TransactionService`**

In `backend/src/accounting/transaction/transaction.service.ts`:

Add import at top:
```typescript
import { PropertyChargeService } from '@asset-backend/real-estate/property/property-charge.service';
import { chargeTypeToExpenseTypeKey } from '@asset-backend/common/types';
```

Add to constructor (after `private expenseTypeService: ExpenseTypeService`):
```typescript
private propertyChargeService: PropertyChargeService,
```

- [ ] **Step 2: Write the failing tests for `splitChargePayment`**

Add the mock for `PropertyChargeService` in the test setup in `backend/src/accounting/transaction/transaction.service.spec.ts`.

Add import:
```typescript
import { PropertyChargeService } from '@asset-backend/real-estate/property/property-charge.service';
import { ChargeType } from '@asset-backend/common/types';
```

Add mock variable next to other mocks (around line 41):
```typescript
let mockPropertyChargeService: { getChargesForDate: jest.Mock };
```

In `beforeEach`, add the mock (around line 52, after `mockExpenseTypeService`):
```typescript
mockPropertyChargeService = {
  getChargesForDate: jest.fn(),
};
```

Update the `mockExpenseTypeService.findByKey` implementation to also include charge expense types:
```typescript
mockExpenseTypeService = {
  findByKey: jest.fn().mockImplementation((key: string) => {
    const types: Record<string, { id: number; key: string; name: string }> = {
      'loan-principal': { id: 1, key: 'loan-principal', name: 'Loan principal' },
      'loan-interest': { id: 2, key: 'loan-interest', name: 'Loan interest' },
      'loan-handling-fee': { id: 3, key: 'loan-handling-fee', name: 'Loan handling fees' },
      'maintenance-charge': { id: 10, key: 'maintenance-charge', name: 'Maintenance charge' },
      'financial-charge': { id: 11, key: 'financial-charge', name: 'Financial charge' },
      'water': { id: 12, key: 'water', name: 'Water' },
      'other-charge-based': { id: 13, key: 'other-charge-based', name: 'Other charge-based' },
    };
    return Promise.resolve(types[key] || null);
  }),
};
```

Add provider in the `TestingModule` providers array:
```typescript
{ provide: PropertyChargeService, useValue: mockPropertyChargeService },
```

Add the test `describe` block after the existing `splitLoanPaymentBulk` tests:

```typescript
describe('splitChargePayment', () => {
  it('splits charge payment into expense components', async () => {
    const transaction = createTransaction({
      id: 1,
      propertyId: 1,
      status: TransactionStatus.PENDING,
      amount: -350,
      description: 'Yhtiövastike',
    });

    mockRepository.findOne.mockResolvedValue(transaction);
    mockAuthService.hasOwnership.mockResolvedValue(true);
    mockPropertyChargeService.getChargesForDate.mockResolvedValue([
      { chargeType: ChargeType.MAINTENANCE_FEE, amount: 200 },
      { chargeType: ChargeType.FINANCIAL_CHARGE, amount: 100 },
      { chargeType: ChargeType.WATER_PREPAYMENT, amount: 50 },
    ]);
    mockRepository.save.mockImplementation((entity) =>
      Promise.resolve({ ...entity }),
    );

    const result = await service.splitChargePayment(testUser, 1);

    expect(result.type).toBe(TransactionType.EXPENSE);
    expect(result.expenses).toHaveLength(3);
    expect(result.expenses[0].amount).toBe(200);
    expect(result.expenses[0].expenseTypeId).toBe(10);
    expect(result.expenses[1].amount).toBe(100);
    expect(result.expenses[1].expenseTypeId).toBe(11);
    expect(result.expenses[2].amount).toBe(50);
    expect(result.expenses[2].expenseTypeId).toBe(12);
  });

  it('throws NotFoundException when transaction does not exist', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(
      service.splitChargePayment(testUser, 999),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws UnauthorizedException when user has no ownership', async () => {
    const transaction = createTransaction({
      id: 1,
      propertyId: 1,
      status: TransactionStatus.PENDING,
      amount: -350,
    });

    mockRepository.findOne.mockResolvedValue(transaction);
    mockAuthService.hasOwnership.mockResolvedValue(false);

    await expect(
      service.splitChargePayment(otherUser, 1),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws BadRequestException for non-pending transaction', async () => {
    const transaction = createTransaction({
      id: 1,
      propertyId: 1,
      status: TransactionStatus.ACCEPTED,
      amount: -350,
    });

    mockRepository.findOne.mockResolvedValue(transaction);
    mockAuthService.hasOwnership.mockResolvedValue(true);

    await expect(
      service.splitChargePayment(testUser, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when no active charges found', async () => {
    const transaction = createTransaction({
      id: 1,
      propertyId: 1,
      status: TransactionStatus.PENDING,
      amount: -350,
    });

    mockRepository.findOne.mockResolvedValue(transaction);
    mockAuthService.hasOwnership.mockResolvedValue(true);
    mockPropertyChargeService.getChargesForDate.mockResolvedValue([]);

    await expect(
      service.splitChargePayment(testUser, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when amount does not match charges sum', async () => {
    const transaction = createTransaction({
      id: 1,
      propertyId: 1,
      status: TransactionStatus.PENDING,
      amount: -350,
    });

    mockRepository.findOne.mockResolvedValue(transaction);
    mockAuthService.hasOwnership.mockResolvedValue(true);
    mockPropertyChargeService.getChargesForDate.mockResolvedValue([
      { chargeType: ChargeType.MAINTENANCE_FEE, amount: 200 },
      { chargeType: ChargeType.FINANCIAL_CHARGE, amount: 100 },
    ]);

    await expect(
      service.splitChargePayment(testUser, 1),
    ).rejects.toThrow(BadRequestException);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && npx jest --testPathPattern="transaction.service.spec" --verbose`
Expected: FAIL with "service.splitChargePayment is not a function"

- [ ] **Step 4: Implement `splitChargePayment`**

Add to `backend/src/accounting/transaction/transaction.service.ts` (after `splitLoanPayment`, around line 473):

```typescript
async splitChargePayment(
  user: JWTUser,
  transactionId: number,
): Promise<Transaction> {
  const transaction = await this.repository.findOne({
    where: { id: transactionId },
    relations: { expenses: true },
  });

  if (!transaction) {
    throw new NotFoundException('Transaction not found');
  }

  if (!(await this.authService.hasOwnership(user, transaction.propertyId))) {
    throw new UnauthorizedException();
  }

  if (transaction.status !== TransactionStatus.PENDING) {
    throw new BadRequestException('Can only split pending transactions');
  }

  const charges = await this.propertyChargeService.getChargesForDate(
    transaction.propertyId,
    transaction.transactionDate,
  );

  if (charges.length === 0) {
    throw new BadRequestException('No active charges found for transaction date');
  }

  const chargesSum = charges.reduce((sum, c) => sum + c.amount, 0);
  if (Math.abs(transaction.amount) !== chargesSum) {
    throw new BadRequestException(
      `Transaction amount (${Math.abs(transaction.amount)}) does not match charges sum (${chargesSum})`,
    );
  }

  const expenses = [];
  for (const charge of charges) {
    const expenseTypeKey = chargeTypeToExpenseTypeKey.get(charge.chargeType);
    if (!expenseTypeKey) continue;

    const expenseType = await this.expenseTypeService.findByKey(expenseTypeKey);
    if (!expenseType) continue;

    expenses.push({
      expenseTypeId: expenseType.id,
      propertyId: transaction.propertyId,
      transactionId: transaction.id,
      description: expenseType.key,
      amount: charge.amount,
      quantity: 1,
      totalAmount: charge.amount,
      accountingDate: transaction.accountingDate,
    });
  }

  transaction.type = TransactionType.EXPENSE;
  transaction.expenses = expenses as Expense[];

  return this.repository.save(transaction);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && npx jest --testPathPattern="transaction.service.spec" --verbose`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/accounting/transaction/transaction.service.ts backend/src/accounting/transaction/transaction.service.spec.ts
git commit -m "feat: add splitChargePayment to TransactionService"
```

---

### Task 5: Implement `splitChargePaymentBulk` in `TransactionService`

**Files:**
- Modify: `backend/src/accounting/transaction/transaction.service.ts`
- Modify: `backend/src/accounting/transaction/transaction.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add to `backend/src/accounting/transaction/transaction.service.spec.ts` after the `splitChargePayment` describe block:

```typescript
describe('splitChargePaymentBulk', () => {
  it('splits multiple charge payment transactions', async () => {
    const transactions = [
      createTransaction({
        id: 1,
        propertyId: 1,
        status: TransactionStatus.PENDING,
        amount: -350,
        transactionDate: new Date('2024-06-15'),
      }),
      createTransaction({
        id: 2,
        propertyId: 1,
        status: TransactionStatus.PENDING,
        amount: -350,
        transactionDate: new Date('2024-07-15'),
      }),
    ];

    mockRepository.find.mockResolvedValue(transactions);
    mockAuthService.hasOwnership.mockResolvedValue(true);
    mockPropertyChargeService.getChargesForDate.mockResolvedValue([
      { chargeType: ChargeType.MAINTENANCE_FEE, amount: 200 },
      { chargeType: ChargeType.FINANCIAL_CHARGE, amount: 100 },
      { chargeType: ChargeType.WATER_PREPAYMENT, amount: 50 },
    ]);
    mockRepository.save.mockImplementation((entity) =>
      Promise.resolve({ ...entity }),
    );

    const result = await service.splitChargePaymentBulk(testUser, {
      ids: [1, 2],
    });

    expect(result.rows.total).toBe(2);
    expect(result.rows.success).toBe(2);
  });

  it('throws BadRequestException when ids array is empty', async () => {
    await expect(
      service.splitChargePaymentBulk(testUser, { ids: [] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns 401 for transactions user does not own', async () => {
    const transaction = createTransaction({
      id: 1,
      propertyId: 1,
      status: TransactionStatus.PENDING,
      amount: -350,
    });

    mockRepository.find.mockResolvedValue([transaction]);
    mockAuthService.hasOwnership.mockResolvedValue(false);

    const result = await service.splitChargePaymentBulk(testUser, {
      ids: [1],
    });

    expect(result.rows.failed).toBe(1);
    expect(result.results[0].statusCode).toBe(401);
  });

  it('returns 400 for non-pending transactions', async () => {
    const transaction = createTransaction({
      id: 1,
      propertyId: 1,
      status: TransactionStatus.ACCEPTED,
      amount: -350,
    });

    mockRepository.find.mockResolvedValue([transaction]);
    mockAuthService.hasOwnership.mockResolvedValue(true);

    const result = await service.splitChargePaymentBulk(testUser, {
      ids: [1],
    });

    expect(result.rows.failed).toBe(1);
    expect(result.results[0].statusCode).toBe(400);
  });

  it('returns 400 when no active charges found', async () => {
    const transaction = createTransaction({
      id: 1,
      propertyId: 1,
      status: TransactionStatus.PENDING,
      amount: -350,
    });

    mockRepository.find.mockResolvedValue([transaction]);
    mockAuthService.hasOwnership.mockResolvedValue(true);
    mockPropertyChargeService.getChargesForDate.mockResolvedValue([]);

    const result = await service.splitChargePaymentBulk(testUser, {
      ids: [1],
    });

    expect(result.rows.failed).toBe(1);
    expect(result.results[0].statusCode).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest --testPathPattern="transaction.service.spec" --verbose`
Expected: FAIL with "service.splitChargePaymentBulk is not a function"

- [ ] **Step 3: Implement `splitChargePaymentBulk`**

Add to `backend/src/accounting/transaction/transaction.service.ts`, add import at top:

```typescript
import { SplitChargePaymentBulkInputDto } from './dtos/split-charge-payment-bulk-input.dto';
```

Add method after `splitChargePayment`:

```typescript
async splitChargePaymentBulk(
  user: JWTUser,
  input: SplitChargePaymentBulkInputDto,
): Promise<DataSaveResultDto> {
  if (input.ids.length === 0) {
    throw new BadRequestException('No ids provided');
  }

  const transactions = await this.repository.find({
    where: { id: In(input.ids) },
    relations: { expenses: true },
  });

  const saveTask = transactions.map(async (transaction) => {
    try {
      if (
        !(await this.authService.hasOwnership(user, transaction.propertyId))
      ) {
        return {
          id: transaction.id,
          statusCode: 401,
          message: 'Unauthorized',
        } as DataSaveResultRowDto;
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        return {
          id: transaction.id,
          statusCode: 400,
          message: 'Can only split pending transactions',
        } as DataSaveResultRowDto;
      }

      const charges = await this.propertyChargeService.getChargesForDate(
        transaction.propertyId,
        transaction.transactionDate,
      );

      if (charges.length === 0) {
        return {
          id: transaction.id,
          statusCode: 400,
          message: 'No active charges found for transaction date',
        } as DataSaveResultRowDto;
      }

      const chargesSum = charges.reduce((sum, c) => sum + c.amount, 0);
      if (Math.abs(transaction.amount) !== chargesSum) {
        return {
          id: transaction.id,
          statusCode: 400,
          message: `Transaction amount (${Math.abs(transaction.amount)}) does not match charges sum (${chargesSum})`,
        } as DataSaveResultRowDto;
      }

      const expenses = [];
      for (const charge of charges) {
        const expenseTypeKey = chargeTypeToExpenseTypeKey.get(charge.chargeType);
        if (!expenseTypeKey) continue;

        const expenseType = await this.expenseTypeService.findByKey(expenseTypeKey);
        if (!expenseType) continue;

        expenses.push({
          expenseTypeId: expenseType.id,
          propertyId: transaction.propertyId,
          transactionId: transaction.id,
          description: expenseType.key,
          amount: charge.amount,
          quantity: 1,
          totalAmount: charge.amount,
          accountingDate: transaction.accountingDate,
        });
      }

      transaction.type = TransactionType.EXPENSE;
      transaction.expenses = expenses as Expense[];

      await this.repository.save(transaction);

      return {
        id: transaction.id,
        statusCode: 200,
        message: 'OK',
      } as DataSaveResultRowDto;
    } catch (e) {
      return {
        id: transaction.id,
        statusCode: e.status || 500,
        message: e.message,
      } as DataSaveResultRowDto;
    }
  });

  return this.getSaveTaskResult(saveTask, transactions);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest --testPathPattern="transaction.service.spec" --verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/accounting/transaction/transaction.service.ts backend/src/accounting/transaction/transaction.service.spec.ts backend/src/accounting/transaction/dtos/split-charge-payment-bulk-input.dto.ts
git commit -m "feat: add splitChargePaymentBulk to TransactionService"
```

---

### Task 6: Add controller endpoints

**Files:**
- Modify: `backend/src/accounting/transaction/transaction.controller.ts`

- [ ] **Step 1: Add imports**

In `backend/src/accounting/transaction/transaction.controller.ts`, add import:

```typescript
import { SplitChargePaymentBulkInputDto } from '@asset-backend/accounting/transaction/dtos/split-charge-payment-bulk-input.dto';
```

- [ ] **Step 2: Add bulk endpoint**

Add after the existing `splitLoanPayment` endpoint (after line 111):

```typescript
@Post('/split-charge-payment')
async splitChargePaymentBulk(
  @User() user: JWTUser,
  @Body() input: SplitChargePaymentBulkInputDto,
): Promise<DataSaveResultDto> {
  return this.service.splitChargePaymentBulk(user, input);
}

@Post('/:id/split-charge-payment')
async splitChargePayment(
  @User() user: JWTUser,
  @Param('id') id: string,
): Promise<Transaction> {
  return this.service.splitChargePayment(user, Number(id));
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/accounting/transaction/transaction.controller.ts
git commit -m "feat: add split charge payment controller endpoints"
```

---

### Task 7: Add allocation rule integration

**Files:**
- Modify: `backend/src/accounting/allocation-rule/allocation-rule.service.ts`
- Modify: `backend/src/accounting/allocation-rule/allocation-rule.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add to `backend/src/accounting/allocation-rule/allocation-rule.service.spec.ts`, after the existing `LOAN_PAYMENT handling` describe block (before the closing `});` of the main describe):

First update `mockExpenseTypeService` in `beforeEach` to include `housing-charge`:
```typescript
mockExpenseTypeService = {
  findByKey: jest.fn().mockImplementation((key: string) => {
    const types: Record<string, { id: number; key: string }> = {
      'loan-principal': { id: 1, key: 'loan-principal' },
      'loan-interest': { id: 2, key: 'loan-interest' },
      'loan-handling-fee': { id: 3, key: 'loan-handling-fee' },
      'loan-payment': { id: 4, key: 'loan-payment' },
      'housing-charge': { id: 5, key: 'housing-charge' },
      'maintenance-charge': { id: 10, key: 'maintenance-charge' },
      'financial-charge': { id: 11, key: 'financial-charge' },
      'water': { id: 12, key: 'water' },
      'other-charge-based': { id: 13, key: 'other-charge-based' },
    };
    return Promise.resolve(types[key] || null);
  }),
};
```

Then add the tests:
```typescript
describe('HOUSING_CHARGE handling', () => {
  beforeEach(() => {
    mockAuthService.hasOwnership.mockResolvedValue(true);
  });

  it('splits charge payment when HOUSING_CHARGE rule matches', async () => {
    mockRuleRepository.find.mockResolvedValue([
      createAllocationRule({
        id: 1,
        name: 'Charge Payment Rule',
        transactionType: TransactionType.EXPENSE,
        expenseTypeId: 5, // HOUSING_CHARGE type ID
        conditions: [{ field: 'sender', operator: 'contains', value: 'Taloyhtiö' }],
      }),
    ]);

    mockTransactionRepository.find.mockResolvedValue([
      createTransaction({
        id: 1,
        propertyId: 1,
        status: TransactionStatus.PENDING,
        type: TransactionType.UNKNOWN,
        description: 'Taloyhtiö Vastike',
        amount: -350,
      }),
    ]);

    mockTransactionService.splitChargePayment = jest.fn().mockResolvedValue({});

    const result = await service.apply(testUser, 1, [1]);

    expect(result.allocated).toHaveLength(1);
    expect(result.allocated[0].action).toBe('charge_split');
    expect(mockTransactionService.splitChargePayment).toHaveBeenCalledWith(
      testUser,
      1,
    );
  });

  it('skips charge payment when splitChargePayment fails', async () => {
    mockRuleRepository.find.mockResolvedValue([
      createAllocationRule({
        id: 1,
        name: 'Charge Payment Rule',
        transactionType: TransactionType.EXPENSE,
        expenseTypeId: 5, // HOUSING_CHARGE type ID
        conditions: [{ field: 'sender', operator: 'contains', value: 'Taloyhtiö' }],
      }),
    ]);

    mockTransactionRepository.find.mockResolvedValue([
      createTransaction({
        id: 1,
        propertyId: 1,
        status: TransactionStatus.PENDING,
        type: TransactionType.UNKNOWN,
        description: 'Taloyhtiö Vastike',
        amount: -350,
      }),
    ]);

    mockTransactionService.splitChargePayment = jest.fn().mockRejectedValue(
      new BadRequestException('No active charges found'),
    );

    const result = await service.apply(testUser, 1, [1]);

    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toBe('charge_split_failed');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest --testPathPattern="allocation-rule.service.spec" --verbose`
Expected: FAIL (the service doesn't handle HOUSING_CHARGE yet)

- [ ] **Step 3: Implement allocation rule integration**

In `backend/src/accounting/allocation-rule/allocation-rule.service.ts`:

Add import:
```typescript
import { TransactionService } from '@asset-backend/accounting/transaction/transaction.service';
```

Note: `TransactionService` is already imported. We just need to use it.

In the `apply` method, update the pre-fetch section (around line 192-198) to also fetch the housing charge expense type:

```typescript
const [principalExpenseType, interestExpenseType, handlingFeeExpenseType, loanPaymentExpenseType, housingChargeExpenseType] =
  await Promise.all([
    this.expenseTypeService.findByKey(ExpenseTypeKey.LOAN_PRINCIPAL),
    this.expenseTypeService.findByKey(ExpenseTypeKey.LOAN_INTEREST),
    this.expenseTypeService.findByKey(ExpenseTypeKey.LOAN_HANDLING_FEE),
    this.expenseTypeService.findByKey(ExpenseTypeKey.LOAN_PAYMENT),
    this.expenseTypeService.findByKey(ExpenseTypeKey.HOUSING_CHARGE),
  ]);
```

In the single-match block (around line 235-273), add an `else if` for the housing charge type after the loan payment handling:

```typescript
} else if (
  housingChargeExpenseType &&
  rule.expenseTypeId === housingChargeExpenseType.id
) {
  // Handle charge payment auto-split
  try {
    await this.transactionService.splitChargePayment(
      user,
      transaction.id,
    );
    result.allocated.push({
      transactionId: transaction.id,
      ruleId: rule.id,
      ruleName: rule.name,
      action: 'charge_split',
    } as AllocatedTransactionDto);
  } catch {
    result.skipped.push({
      transactionId: transaction.id,
      reason: 'charge_split_failed',
    } as SkippedTransactionDto);
  }
} else {
```

The full if/else if/else chain should be:
1. `if (loanPaymentExpenseType && rule.expenseTypeId === loanPaymentExpenseType.id)` — loan split
2. `else if (housingChargeExpenseType && rule.expenseTypeId === housingChargeExpenseType.id)` — charge split
3. `else` — standard type allocation

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest --testPathPattern="allocation-rule.service.spec" --verbose`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/accounting/allocation-rule/allocation-rule.service.ts backend/src/accounting/allocation-rule/allocation-rule.service.spec.ts
git commit -m "feat: add housing charge split to allocation rules"
```

---

### Task 8: Add E2E tests for charge payment splitting

**Files:**
- Modify: `backend/test/transaction.controller.e2e-spec.ts`

- [ ] **Step 1: Add E2E tests**

Add to `backend/test/transaction.controller.e2e-spec.ts`, after the existing loan split e2e tests (after the `POST /:id/split-loan-payment` describe block):

```typescript
// ==========================================
// 10. POST /accounting/transaction/split-charge-payment - Bulk charge split
// ==========================================
describe('POST /accounting/transaction/split-charge-payment', () => {
  it('splits charge payment transactions in bulk', async () => {
    // First, create charges for the property
    const propertyChargeService = app.get(PropertyChargeService);
    const propertyId = mainUser.properties[0].id;

    await propertyChargeService.create(mainUser.jwtUser, {
      propertyId,
      chargeType: ChargeType.MAINTENANCE_FEE,
      amount: 200,
      startDate: '2024-01-01',
    });
    await propertyChargeService.create(mainUser.jwtUser, {
      propertyId,
      chargeType: ChargeType.FINANCIAL_CHARGE,
      amount: 100,
      startDate: '2024-01-01',
    });

    const transaction = await addTransaction(app, mainUser.jwtUser, {
      sender: 'Taloyhtiö',
      receiver: 'My Account',
      description: 'Yhtiövastike',
      transactionDate: new Date('2024-06-15'),
      accountingDate: new Date('2024-06-15'),
      amount: -300,
      propertyId,
      status: TransactionStatus.PENDING,
      type: TransactionType.UNKNOWN,
      externalId: `charge-bulk-${Date.now()}`,
    });

    const response = await request(server)
      .post('/accounting/transaction/split-charge-payment')
      .set('Authorization', getBearerToken(mainUserToken))
      .send({ ids: [transaction.id] })
      .expect(201);

    expect(response.body).toHaveProperty('allSuccess');
    expect(response.body.allSuccess).toBe(true);
  });

  it('returns 400 when no ids provided', async () => {
    await request(server)
      .post('/accounting/transaction/split-charge-payment')
      .set('Authorization', getBearerToken(mainUserToken))
      .send({ ids: [] })
      .expect(400);
  });

  it('returns 401 when not authenticated', async () => {
    await request(server)
      .post('/accounting/transaction/split-charge-payment')
      .send({ ids: [1] })
      .expect(401);
  });
});

// ==========================================
// 11. POST /:id/split-charge-payment - Single charge split
// ==========================================
describe('POST /accounting/transaction/:id/split-charge-payment', () => {
  it('splits a single charge payment transaction', async () => {
    const propertyChargeService = app.get(PropertyChargeService);
    const propertyId = mainUser.properties[0].id;

    // Charges may already exist from previous test, create new ones with different start date
    await propertyChargeService.create(mainUser.jwtUser, {
      propertyId,
      chargeType: ChargeType.MAINTENANCE_FEE,
      amount: 250,
      startDate: '2025-01-01',
    });
    await propertyChargeService.create(mainUser.jwtUser, {
      propertyId,
      chargeType: ChargeType.FINANCIAL_CHARGE,
      amount: 150,
      startDate: '2025-01-01',
    });

    const transaction = await addTransaction(app, mainUser.jwtUser, {
      sender: 'Taloyhtiö',
      receiver: 'My Account',
      description: 'Yhtiövastike',
      transactionDate: new Date('2025-06-15'),
      accountingDate: new Date('2025-06-15'),
      amount: -400,
      propertyId,
      status: TransactionStatus.PENDING,
      type: TransactionType.UNKNOWN,
      externalId: `charge-single-${Date.now()}`,
    });

    const response = await request(server)
      .post(`/accounting/transaction/${transaction.id}/split-charge-payment`)
      .set('Authorization', getBearerToken(mainUserToken))
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.type).toBe(TransactionType.EXPENSE);
  });

  it('returns 404 for non-existent transaction', async () => {
    await request(server)
      .post('/accounting/transaction/999999/split-charge-payment')
      .set('Authorization', getBearerToken(mainUserToken))
      .expect(404);
  });

  it('returns 401 when not authenticated', async () => {
    await request(server)
      .post('/accounting/transaction/1/split-charge-payment')
      .expect(401);
  });
});
```

Add imports at the top of the e2e test file:
```typescript
import { PropertyChargeService } from '@asset-backend/real-estate/property/property-charge.service';
import { ChargeType } from '@asset-backend/common/types';
```

- [ ] **Step 2: Run E2E tests**

Run: `cd backend && npx jest --testPathPattern="transaction.controller.e2e-spec" --verbose`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add backend/test/transaction.controller.e2e-spec.ts
git commit -m "test: add e2e tests for charge payment splitting"
```

---

### Task 9: Add frontend type and API call

**Files:**
- Modify: `frontend/src/types/inputs.ts`

- [ ] **Step 1: Add frontend type**

Add after `SplitLoanPaymentBulkInput` (around line 124) in `frontend/src/types/inputs.ts`:

```typescript
// Split charge payment bulk input
export interface SplitChargePaymentBulkInput {
  ids: number[];
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/inputs.ts
git commit -m "feat: add SplitChargePaymentBulkInput frontend type"
```

---

### Task 10: Add translations for charge split

**Files:**
- Modify: `frontend/src/translations/transaction/en.ts`
- Modify: `frontend/src/translations/transaction/fi.ts`
- Modify: `frontend/src/translations/transaction/sv.ts`
- Modify: `frontend/src/translations/en.ts` (toast)
- Modify: `frontend/src/translations/fi.ts` (toast)
- Modify: `frontend/src/translations/sv.ts` (toast)
- Modify: `frontend/src/translations/allocation/en.ts`
- Modify: `frontend/src/translations/allocation/fi.ts`
- Modify: `frontend/src/translations/allocation/sv.ts`

- [ ] **Step 1: Add transaction translations**

In `frontend/src/translations/transaction/en.ts`, add near the existing `splitLoanPayment` key:
```typescript
splitChargePayment: "Split to charges",
chargeSplitErrors: {
  noCharges: "No active charges found for transaction date",
  amountMismatch: "Transaction amount does not match charges",
},
```

In `frontend/src/translations/transaction/fi.ts`:
```typescript
splitChargePayment: "Jaa vastikkeisiin",
chargeSplitErrors: {
  noCharges: "Aktiivisia vastikkeita ei löytynyt tapahtuman päivämäärälle",
  amountMismatch: "Tapahtuman summa ei täsmää vastikkeiden kanssa",
},
```

In `frontend/src/translations/transaction/sv.ts`:
```typescript
splitChargePayment: "Dela till avgifter",
chargeSplitErrors: {
  noCharges: "Inga aktiva avgifter hittades för transaktionsdatumet",
  amountMismatch: "Transaktionsbeloppet matchar inte avgifterna",
},
```

- [ ] **Step 2: Add toast translations**

In `frontend/src/translations/en.ts`, add near `loanSplit` (around line 133):
```typescript
chargeSplit: "Charge payment split",
```

In `frontend/src/translations/fi.ts`:
```typescript
chargeSplit: "Vastikemaksu jaettu",
```

In `frontend/src/translations/sv.ts`:
```typescript
chargeSplit: "Avgiftsbetalning uppdelad",
```

- [ ] **Step 3: Add allocation translations**

In `frontend/src/translations/allocation/en.ts`, add near `loanSplitFailed`:
```typescript
chargeSplitFailed: 'Charge split failed',
```

In `frontend/src/translations/allocation/fi.ts`:
```typescript
chargeSplitFailed: 'Vastikkeen jako epäonnistui',
```

In `frontend/src/translations/allocation/sv.ts`:
```typescript
chargeSplitFailed: 'Avgiftsdelning misslyckades',
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/translations/
git commit -m "feat: add charge split translations (en, fi, sv)"
```

---

### Task 11: Add split charge payment to `TransactionsPendingActions` and `CompactActionBar`

**Files:**
- Modify: `frontend/src/components/transaction/pending/TransactionsPendingActions.tsx`
- Modify: `frontend/src/components/transaction/pending/CompactActionBar.tsx`

- [ ] **Step 1: Add prop to `TransactionsPendingActions`**

In `frontend/src/components/transaction/pending/TransactionsPendingActions.tsx`, add to the `TransactionsPendingActionsProps` interface (around line 43):
```typescript
onSplitChargePayment: () => Promise<void>;
```

Add handler function (after `handleLoanSplit` around line 105):
```typescript
const handleChargeSplit = async () => {
  await props.onSplitChargePayment();
};
```

In the full-size layout, add the button after the split loan payment button (after line 363):
```typescript
<AssetButton
  label={props.t("splitChargePayment")}
  variant="text"
  onClick={handleChargeSplit}
  endIcon={<CallSplitIcon />}
/>
```

In the compact mode pass-through (where `CompactActionBar` is rendered, around line 164-165), add:
```typescript
onSplitChargePayment={handleChargeSplit}
```

- [ ] **Step 2: Add prop to `CompactActionBar`**

In `frontend/src/components/transaction/pending/CompactActionBar.tsx`, add to the props interface:
```typescript
onSplitChargePayment?: () => Promise<void>;
```

Add handler:
```typescript
const handleChargeSplit = async () => {
  if (props.onSplitChargePayment) {
    await props.onSplitChargePayment();
  }
};
```

Add button after the split loan payment button in the expanded section (after line 442):
```typescript
{props.onSplitChargePayment && (
  <AssetButton
    label={props.t("splitChargePayment")}
    variant="text"
    size="small"
    onClick={handleChargeSplit}
    endIcon={<CallSplitIcon />}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/transaction/pending/TransactionsPendingActions.tsx frontend/src/components/transaction/pending/CompactActionBar.tsx
git commit -m "feat: add split charge payment buttons to action bars"
```

---

### Task 12: Add charge split handler to pending transactions view

**Files:**
- Modify: `frontend/src/components/transaction/pending/TransactionsPending.tsx`

- [ ] **Step 1: Add handler and pass to actions component**

In `frontend/src/components/transaction/pending/TransactionsPending.tsx`, add import:
```typescript
import { SplitChargePaymentBulkInput } from "@asset-types";
```

Add handler after `handleSplitLoanPaymentForSelected` (around line 223):
```typescript
const handleSplitChargePaymentForSelected = async () => {
  if (selectedIds.length > 0) {
    const result =
      await ApiClient.postSaveTask<SplitChargePaymentBulkInput>(
        transactionContext.apiPath + "/split-charge-payment",
        { ids: selectedIds },
      );
    if (result.allSuccess) {
      showToast({ message: t("common:toast.chargeSplit"), severity: "success" });
      setRefreshTrigger((prev) => prev + 1);
    } else {
      showToast({ message: t("common:toast.updateError"), severity: "error" });
    }
  }
};
```

Where `TransactionsPendingActions` is rendered, add the prop:
```typescript
onSplitChargePayment={handleSplitChargePaymentForSelected}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/transaction/pending/TransactionsPending.tsx
git commit -m "feat: add charge split handler to pending transactions view"
```

---

### Task 13: Add charge split to import wizard

**Files:**
- Modify: `frontend/src/components/transaction/import-wizard/hooks/useImportWizard.ts`
- Modify: `frontend/src/components/transaction/import-wizard/TransactionImportWizard.tsx`
- Modify: `frontend/src/components/transaction/import-wizard/steps/ReviewStep.tsx`

- [ ] **Step 1: Add handler to useImportWizard hook**

In `frontend/src/components/transaction/import-wizard/hooks/useImportWizard.ts`, add import:
```typescript
import { SplitChargePaymentBulkInput } from "@asset-types";
```

Add handler after `splitLoanPaymentForSelected` (around line 479):
```typescript
const splitChargePaymentForSelected = useCallback(
  async () => {
    if (state.selectedIds.length === 0) return;

    const result = await ApiClient.postSaveTask<SplitChargePaymentBulkInput>(
      transactionContext.apiPath + "/split-charge-payment",
      { ids: state.selectedIds }
    );

    if (result.allSuccess) {
      showToast({ message: t("common:toast.chargeSplit"), severity: "success" });
    } else if (result.rows?.success > 0) {
      const firstError = result.results?.find(r => r.statusCode !== 200);
      showToast({
        message: firstError?.message || t("common:toast.partialSuccess", {
          success: result.rows.success,
          failed: result.rows.failed
        }),
        severity: "warning"
      });
    } else {
      const firstError = result.results?.[0];
      showToast({ message: firstError?.message || t("common:toast.error"), severity: "error" });
    }

    await fetchTransactions(state.importedTransactionIds);
    clearSelection();
  },
  [state.selectedIds, state.importedTransactionIds, fetchTransactions, clearSelection, showToast, t]
);
```

Add `splitChargePaymentForSelected` to the return object (around line 605, near `splitLoanPaymentForSelected`):
```typescript
splitChargePaymentForSelected,
```

- [ ] **Step 2: Pass through TransactionImportWizard**

In `frontend/src/components/transaction/import-wizard/TransactionImportWizard.tsx`, destructure the new function from the hook (around line 34):
```typescript
splitChargePaymentForSelected,
```

Pass it to the `ReviewStep` (around line 116):
```typescript
onSplitChargePayment={splitChargePaymentForSelected}
```

- [ ] **Step 3: Add to ReviewStep**

In `frontend/src/components/transaction/import-wizard/steps/ReviewStep.tsx`, add to the props interface (around line 53):
```typescript
onSplitChargePayment: () => Promise<void>;
```

Destructure it from props (around line 77):
```typescript
onSplitChargePayment,
```

Add handler (near `handleSplitLoanPayment` around line 175):
```typescript
const handleSplitChargePayment = async () => {
  await onSplitChargePayment();
};
```

Pass to `TransactionsPendingActions` (around line 298):
```typescript
onSplitChargePayment={handleSplitChargePayment}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/transaction/import-wizard/
git commit -m "feat: add charge split to import wizard"
```

---

### Task 14: Fix frontend tests for new prop

**Files:**
- Modify: `frontend/src/components/transaction/pending/TransactionsPendingActions.test.tsx`
- Modify: `frontend/src/components/transaction/pending/CompactActionBar.test.tsx`
- Modify: `frontend/src/components/transaction/import-wizard/steps/ReviewStep.test.tsx`

- [ ] **Step 1: Update test default props**

In `TransactionsPendingActions.test.tsx`, add to `defaultProps`:
```typescript
onSplitChargePayment: jest.fn(),
```

In `CompactActionBar.test.tsx`, add to `defaultProps`:
```typescript
onSplitChargePayment: jest.fn(),
```

In `ReviewStep.test.tsx`, add to the default props:
```typescript
onSplitChargePayment: jest.fn(),
```

- [ ] **Step 2: Run frontend tests**

Run: `cd frontend && npm test -- --watchAll=false`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/transaction/pending/TransactionsPendingActions.test.tsx frontend/src/components/transaction/pending/CompactActionBar.test.tsx frontend/src/components/transaction/import-wizard/steps/ReviewStep.test.tsx
git commit -m "test: update frontend tests for split charge payment prop"
```

---

### Task 15: Run all tests and verify

**Files:** None (verification only)

- [ ] **Step 1: Run backend unit tests**

Run: `cd backend && npm test`
Expected: All tests pass

- [ ] **Step 2: Run backend e2e tests**

Run: `cd backend && npm run test:e2e`
Expected: All tests pass

- [ ] **Step 3: Run frontend tests**

Run: `cd frontend && npm test -- --watchAll=false`
Expected: All tests pass

- [ ] **Step 4: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 5: Run backend build**

Run: `cd backend && npm run build`
Expected: Build succeeds