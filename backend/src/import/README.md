# Import Module

This module handles CSV imports from Finnish banks to create transactions.

## Structure

```
import/
├── op/                        # OP Bank import
│   ├── dtos/
│   │   └── op-import-input.dto.ts
│   ├── op-import.controller.ts
│   ├── op-import.service.ts
│   └── op-import.service-spec.ts
├── s-pankki/                  # S-Pankki import
│   ├── dtos/
│   │   └── s-pankki-import-input.dto.ts
│   ├── s-pankki-import.controller.ts
│   ├── s-pankki-import.service.ts
│   └── s-pankki-import.service.spec.ts
├── dtos/
│   └── import-result.dto.ts   # Shared result DTO
└── import.module.ts
```

## Supported Banks

| Bank | CSV Format | Date Format | Decimal Separator |
|------|-----------|-------------|-------------------|
| OP | Semicolon-separated | YYYY-MM-DD | Comma |
| S-Pankki | Semicolon-separated | DD.MM.YYYY | Comma |

## Import Flow

```
1. User uploads CSV file
2. Controller receives file + propertyId
3. Service validates user ownership
4. CSV rows parsed based on bank format
5. Each row transformed to TransactionInputDto
6. Duplicate check via externalId hash
7. Skip already accepted transactions
8. Save new/pending transactions
9. Return ImportResultDto
```

## Key Features

### Duplicate Prevention
Each row is hashed to create a unique `externalId`:
```typescript
const externalId = crypto
  .createHash('sha256')
  .update(Object.values(csvRow).join(''))
  .digest('hex');
```

If a transaction with the same `externalId` exists and is ACCEPTED, it's skipped.

### Transaction Status
- Imported transactions start as `PENDING`
- User reviews and accepts transactions in the UI
- Re-importing updates pending transactions, skips accepted ones

### Result Tracking
```typescript
interface ImportResultDto {
  totalRows: number;      // Total CSV rows processed
  savedIds: number[];     // IDs of saved transactions
  skippedCount: number;   // Skipped (already accepted)
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/import/op` | Import OP CSV |
| POST | `/import/s-pankki` | Import S-Pankki CSV |

## CSV Column Mapping

### OP Bank
| Index | Column | Field |
|-------|--------|-------|
| 0 | Date Posted | transactionDate |
| 1 | Value Date | (unused) |
| 2 | Amount | amount |
| 3 | Type | (unused) |
| 4 | Description | (unused) |
| 5 | Payer/Payee | sender/receiver |
| 6 | Account Number | (unused) |
| 7 | Bank BIC | (unused) |
| 8 | Reference | (unused) |
| 9 | Message | description |
| 10 | Archive ID | (header check) |

### S-Pankki
| Index | Column | Field |
|-------|--------|-------|
| 0 | Date Posted | transactionDate |
| 1 | Value Date | (unused) |
| 2 | Amount | amount |
| 3 | Type | (unused) |
| 4 | Payer | sender |
| 5 | Payee Name | receiver |
| 6 | Payee Account | (unused) |
| 7 | Payee BIC | (unused) |
| 8 | Reference | (unused) |
| 9 | Message | description |
| 10 | Archive ID | (header check) |

## Adding a New Bank

1. **Create directory structure**:
   ```
   backend/src/import/newbank/
   ├── dtos/
   │   └── newbank-import-input.dto.ts
   ├── newbank-import.controller.ts
   ├── newbank-import.service.ts
   └── newbank-import.service.spec.ts
   ```

2. **Create input DTO**:
   ```typescript
   export class NewBankImportInput {
     file: string;
     fileName?: string;
     propertyId: number;
   }
   ```

3. **Create service** (copy pattern from op-import.service.ts):
   - Implement `readCsv()` with bank-specific column mapping
   - Implement `parseDate()` for bank's date format
   - Implement `getAmount()` for bank's decimal format

4. **Create controller**:
   ```typescript
   @Controller('import/newbank')
   export class NewBankImportController {
     constructor(private service: NewBankImportService) {}

     @Post()
     @UseGuards(JwtAuthGuard)
     async import(@User() user: JWTUser, @Body() input: NewBankImportInput) {
       return this.service.importCsv(user, input);
     }
   }
   ```

5. **Register in import.module.ts**:
   ```typescript
   @Module({
     controllers: [OpImportController, SPankkiImportController, NewBankImportController],
     providers: [OpImportService, SPankkiImportService, NewBankImportService],
   })
   ```

6. **Add frontend support**:
   - Add type to `frontend/src/types/inputs.ts`
   - Add bank logo to `frontend/assets/banks/`
   - Update import UI component

## Testing

Unit tests mock the TransactionService and verify:
- CSV parsing correctness
- Duplicate handling
- Ownership validation
- Error cases

```typescript
describe('OpImportService', () => {
  it('skips already accepted transactions', async () => {
    // Setup mock to return accepted transaction
    mockTransactionService.search.mockResolvedValue([
      { id: 1, status: TransactionStatus.ACCEPTED }
    ]);

    const result = await service.importCsv(user, input);

    expect(result.skippedCount).toBe(1);
  });
});
```

## Related Modules

- **accounting**: Transactions created by import
- **auth**: Ownership validation before import
- **real-estate**: Property that transactions belong to
