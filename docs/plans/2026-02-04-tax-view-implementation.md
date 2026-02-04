# Tax View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a tax reporting view that calculates and displays Finnish tax-relevant data for property investors.

**Architecture:** Backend TaxService calculates tax data from income/expense tables and stores results in property_statistics. Frontend TaxView displays summary cards and a breakdown matching the Finnish 7H tax form structure.

**Tech Stack:** NestJS + TypeORM (backend), React + MUI (frontend), PostgreSQL

---

## Task 1: Add isCapitalImprovement to ExpenseType Entity

**Files:**
- Modify: `backend/src/accounting/expense/entities/expense-type.entity.ts:38-40`

**Step 1: Add the new column**

Add after line 39 (`isTaxDeductible` column):

```typescript
@Column({ default: false })
isCapitalImprovement: boolean;
```

**Step 2: Verify TypeORM sync**

Run: `cd backend && npm run start:dev`

Check that the column is added to the database (TypeORM auto-sync).

**Step 3: Commit**

```bash
git add backend/src/accounting/expense/entities/expense-type.entity.ts
git commit -m "$(cat <<'EOF'
Add isCapitalImprovement field to ExpenseType

Capital improvements are depreciated at 10% per year instead of
being fully deducted in the year of expense.
EOF
)"
```

---

## Task 2: Add Tax-Related StatisticKey Values

**Files:**
- Modify: `backend/src/common/types.ts:43-49`

**Step 1: Add new enum values**

Update the StatisticKey enum to include tax keys:

```typescript
export enum StatisticKey {
  BALANCE = 'balance',
  INCOME = 'income',
  EXPENSE = 'expense',
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TAX_GROSS_INCOME = 'tax_gross_income',
  TAX_DEDUCTIONS = 'tax_deductions',
  TAX_DEPRECIATION = 'tax_depreciation',
  TAX_NET_INCOME = 'tax_net_income',
}
```

**Step 2: Commit**

```bash
git add backend/src/common/types.ts
git commit -m "$(cat <<'EOF'
Add tax-related StatisticKey values

Keys for storing calculated tax data: gross income, deductions,
depreciation, and net taxable income.
EOF
)"
```

---

## Task 3: Create Tax DTOs

**Files:**
- Create: `backend/src/real-estate/property/dtos/tax-calculate-input.dto.ts`
- Create: `backend/src/real-estate/property/dtos/tax-response.dto.ts`

**Step 1: Create TaxCalculateInputDto**

```typescript
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class TaxCalculateInputDto {
  @IsOptional()
  @IsInt()
  propertyId?: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
```

**Step 2: Create TaxResponseDto**

```typescript
export class TaxBreakdownItemDto {
  category: string;
  amount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

export class TaxResponseDto {
  year: number;
  propertyId?: number;
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
  breakdown: TaxBreakdownItemDto[];
  calculatedAt?: Date;
}
```

**Step 3: Commit**

```bash
git add backend/src/real-estate/property/dtos/tax-calculate-input.dto.ts
git add backend/src/real-estate/property/dtos/tax-response.dto.ts
git commit -m "$(cat <<'EOF'
Add DTOs for tax calculation API

TaxCalculateInputDto for request validation and TaxResponseDto
for structured tax data response with category breakdown.
EOF
)"
```

---

## Task 4: Create TaxService

**Files:**
- Create: `backend/src/real-estate/property/tax.service.ts`

**Step 1: Create the service**

```typescript
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PropertyStatistics } from './entities/property-statistics.entity';
import { PropertyService } from './property.service';
import { JWTUser } from '@alisa-backend/auth/types';
import { TaxCalculateInputDto } from './dtos/tax-calculate-input.dto';
import { TaxResponseDto, TaxBreakdownItemDto } from './dtos/tax-response.dto';
import { StatisticKey, TransactionStatus } from '@alisa-backend/common/types';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(PropertyStatistics)
    private statisticsRepository: Repository<PropertyStatistics>,
    @Inject(forwardRef(() => PropertyService))
    private propertyService: PropertyService,
    private dataSource: DataSource,
  ) {}

  async calculate(
    user: JWTUser,
    input: TaxCalculateInputDto,
  ): Promise<TaxResponseDto> {
    const propertyIds = await this.getPropertyIds(user, input.propertyId);

    if (propertyIds.length === 0) {
      return this.emptyResponse(input.year, input.propertyId);
    }

    // Calculate gross income
    const grossIncome = await this.calculateGrossIncome(propertyIds, input.year);

    // Calculate deductions (tax deductible, not capital improvements)
    const { total: deductions, breakdown: deductionBreakdown } =
      await this.calculateDeductions(propertyIds, input.year);

    // Calculate depreciation (capital improvements at 10%)
    const { total: depreciation, breakdown: depreciationBreakdown } =
      await this.calculateDepreciation(propertyIds, input.year);

    // Calculate net income
    const netIncome = grossIncome - deductions - depreciation;

    // Save to property_statistics
    await this.saveStatistics(propertyIds, input.year, {
      grossIncome,
      deductions,
      depreciation,
      netIncome,
    });

    return {
      year: input.year,
      propertyId: input.propertyId,
      grossIncome,
      deductions,
      depreciation,
      netIncome,
      breakdown: [...deductionBreakdown, ...depreciationBreakdown],
      calculatedAt: new Date(),
    };
  }

  async get(
    user: JWTUser,
    propertyId: number | undefined,
    year: number,
  ): Promise<TaxResponseDto | null> {
    const propertyIds = await this.getPropertyIds(user, propertyId);

    if (propertyIds.length === 0) {
      return null;
    }

    // Get saved statistics
    const stats = await this.statisticsRepository.find({
      where: propertyIds.map((id) => ({
        propertyId: id,
        year,
        month: null as unknown as number,
        key: StatisticKey.TAX_GROSS_INCOME,
      })),
    });

    if (stats.length === 0) {
      return null;
    }

    // Aggregate values across properties
    const allStats = await this.statisticsRepository.find({
      where: propertyIds.map((id) => ({
        propertyId: id,
        year,
        month: null as unknown as number,
      })),
    });

    const grossIncome = this.sumStatsByKey(allStats, StatisticKey.TAX_GROSS_INCOME);
    const deductions = this.sumStatsByKey(allStats, StatisticKey.TAX_DEDUCTIONS);
    const depreciation = this.sumStatsByKey(allStats, StatisticKey.TAX_DEPRECIATION);
    const netIncome = this.sumStatsByKey(allStats, StatisticKey.TAX_NET_INCOME);

    // Get breakdown (calculated live)
    const { breakdown: deductionBreakdown } = await this.calculateDeductions(
      propertyIds,
      year,
    );
    const { breakdown: depreciationBreakdown } = await this.calculateDepreciation(
      propertyIds,
      year,
    );

    return {
      year,
      propertyId,
      grossIncome,
      deductions,
      depreciation,
      netIncome,
      breakdown: [...deductionBreakdown, ...depreciationBreakdown],
    };
  }

  private async getPropertyIds(
    user: JWTUser,
    propertyId?: number,
  ): Promise<number[]> {
    if (propertyId) {
      // Verify user owns this property
      const property = await this.propertyService.findOne(user, propertyId);
      return property ? [propertyId] : [];
    }

    const properties = await this.propertyService.search(user, {
      select: ['id'],
    });
    return properties.map((p) => p.id);
  }

  private async calculateGrossIncome(
    propertyIds: number[],
    year: number,
  ): Promise<number> {
    const result = await this.dataSource.query(
      `SELECT COALESCE(SUM(i."totalAmount"), 0) as total
       FROM income i
       INNER JOIN transaction t ON t.id = i."transactionId"
       WHERE i."propertyId" = ANY($1)
         AND t.status = $2
         AND EXTRACT(YEAR FROM t."accountingDate") = $3`,
      [propertyIds, TransactionStatus.ACCEPTED, year],
    );
    return parseFloat(result[0]?.total) || 0;
  }

  private async calculateDeductions(
    propertyIds: number[],
    year: number,
  ): Promise<{ total: number; breakdown: TaxBreakdownItemDto[] }> {
    const result = await this.dataSource.query(
      `SELECT
         et.name as category,
         COALESCE(SUM(e."totalAmount"), 0) as amount
       FROM expense e
       INNER JOIN transaction t ON t.id = e."transactionId"
       INNER JOIN expense_type et ON et.id = e."expenseTypeId"
       WHERE e."propertyId" = ANY($1)
         AND t.status = $2
         AND EXTRACT(YEAR FROM t."accountingDate") = $3
         AND et."isTaxDeductible" = true
         AND et."isCapitalImprovement" = false
       GROUP BY et.id, et.name
       ORDER BY et.name`,
      [propertyIds, TransactionStatus.ACCEPTED, year],
    );

    const breakdown: TaxBreakdownItemDto[] = result.map((row: { category: string; amount: string }) => ({
      category: row.category,
      amount: parseFloat(row.amount) || 0,
      isTaxDeductible: true,
      isCapitalImprovement: false,
    }));

    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

    return { total, breakdown };
  }

  private async calculateDepreciation(
    propertyIds: number[],
    year: number,
  ): Promise<{ total: number; breakdown: TaxBreakdownItemDto[] }> {
    // Get all capital improvements up to and including this year
    const result = await this.dataSource.query(
      `SELECT
         et.name as category,
         COALESCE(SUM(e."totalAmount"), 0) as amount
       FROM expense e
       INNER JOIN transaction t ON t.id = e."transactionId"
       INNER JOIN expense_type et ON et.id = e."expenseTypeId"
       WHERE e."propertyId" = ANY($1)
         AND t.status = $2
         AND EXTRACT(YEAR FROM t."accountingDate") <= $3
         AND et."isCapitalImprovement" = true
       GROUP BY et.id, et.name
       ORDER BY et.name`,
      [propertyIds, TransactionStatus.ACCEPTED, year],
    );

    const breakdown: TaxBreakdownItemDto[] = result.map((row: { category: string; amount: string }) => {
      const totalAmount = parseFloat(row.amount) || 0;
      const depreciationAmount = totalAmount * 0.1; // 10% depreciation
      return {
        category: row.category,
        amount: totalAmount,
        isTaxDeductible: true,
        isCapitalImprovement: true,
        depreciationAmount,
      };
    });

    const total = breakdown.reduce(
      (sum, item) => sum + (item.depreciationAmount || 0),
      0,
    );

    return { total, breakdown };
  }

  private async saveStatistics(
    propertyIds: number[],
    year: number,
    values: {
      grossIncome: number;
      deductions: number;
      depreciation: number;
      netIncome: number;
    },
  ): Promise<void> {
    // For simplicity, save aggregated values to the first property
    // In a more complex scenario, you might distribute or save per-property
    const propertyId = propertyIds[0];

    const stats = [
      { key: StatisticKey.TAX_GROSS_INCOME, value: values.grossIncome },
      { key: StatisticKey.TAX_DEDUCTIONS, value: values.deductions },
      { key: StatisticKey.TAX_DEPRECIATION, value: values.depreciation },
      { key: StatisticKey.TAX_NET_INCOME, value: values.netIncome },
    ];

    for (const stat of stats) {
      await this.dataSource.query(
        `INSERT INTO property_statistics ("propertyId", "key", "year", "month", "value")
         VALUES ($1, $2, $3, NULL, $4)
         ON CONFLICT ("propertyId", "year", "month", "key")
         DO UPDATE SET "value" = $4`,
        [propertyId, stat.key, year, stat.value.toFixed(2)],
      );
    }
  }

  private sumStatsByKey(stats: PropertyStatistics[], key: StatisticKey): number {
    return stats
      .filter((s) => s.key === key)
      .reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0);
  }

  private emptyResponse(year: number, propertyId?: number): TaxResponseDto {
    return {
      year,
      propertyId,
      grossIncome: 0,
      deductions: 0,
      depreciation: 0,
      netIncome: 0,
      breakdown: [],
    };
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/real-estate/property/tax.service.ts
git commit -m "$(cat <<'EOF'
Add TaxService for calculating tax data

Calculates gross income, deductions, capital improvement depreciation,
and net taxable income from income/expense tables. Saves results to
property_statistics for quick retrieval.
EOF
)"
```

---

## Task 5: Create TaxController

**Files:**
- Create: `backend/src/real-estate/property/tax.controller.ts`

**Step 1: Create the controller**

```typescript
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@alisa-backend/auth/jwt.auth.guard';
import { User } from '@alisa-backend/common/decorators/user.decorator';
import { JWTUser } from '@alisa-backend/auth/types';
import { TaxService } from './tax.service';
import { TaxCalculateInputDto } from './dtos/tax-calculate-input.dto';
import { TaxResponseDto } from './dtos/tax-response.dto';

@UseGuards(JwtAuthGuard)
@Controller('real-estate/property/tax')
export class TaxController {
  constructor(private taxService: TaxService) {}

  @Post('/calculate')
  @HttpCode(200)
  async calculate(
    @User() user: JWTUser,
    @Body() input: TaxCalculateInputDto,
  ): Promise<TaxResponseDto> {
    return this.taxService.calculate(user, input);
  }

  @Get('/')
  async get(
    @User() user: JWTUser,
    @Query('propertyId') propertyId?: string,
    @Query('year') year?: string,
  ): Promise<TaxResponseDto | null> {
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear() - 1;
    const propId = propertyId ? parseInt(propertyId, 10) : undefined;
    return this.taxService.get(user, propId, yearNum);
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/real-estate/property/tax.controller.ts
git commit -m "$(cat <<'EOF'
Add TaxController with calculate and get endpoints

POST /calculate triggers tax calculation and storage.
GET / retrieves previously calculated tax data.
EOF
)"
```

---

## Task 6: Register Tax Service and Controller in Module

**Files:**
- Modify: `backend/src/real-estate/real-estate.module.ts`

**Step 1: Add imports and register**

Update the file to include TaxService and TaxController:

```typescript
import { forwardRef, Module } from '@nestjs/common';
import { InvestmentController } from './investment/investment.controller';
import { InvestmentService } from './investment/investment.service';
import { Investment } from './investment/entities/investment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyController } from './property/property.controller';
import { PropertyService } from './property/property.service';
import { Property } from './property/entities/property.entity';
import { Ownership } from '@alisa-backend/people/ownership/entities/ownership.entity';
import { PeopleModule } from '@alisa-backend/people/people.module';
import { AuthModule } from '@alisa-backend/auth/auth.module';
import { PropertyStatistics } from '@alisa-backend/real-estate/property/entities/property-statistics.entity';
import { PropertyStatisticsService } from '@alisa-backend/real-estate/property/property-statistics.service';
import { AccountingModule } from '@alisa-backend/accounting/accounting.module';
import { TaxController } from './property/tax.controller';
import { TaxService } from './property/tax.service';

@Module({
  controllers: [InvestmentController, PropertyController, TaxController],
  providers: [InvestmentService, PropertyService, PropertyStatisticsService, TaxService],
  imports: [
    TypeOrmModule.forFeature([
      Investment,
      Property,
      PropertyStatistics,
      Ownership,
    ]),
    forwardRef(() => AccountingModule),
    AuthModule,
    PeopleModule,
  ],
  exports: [PropertyService],
})
export class RealEstateModule {}
```

**Step 2: Verify backend starts**

Run: `cd backend && npm run start:dev`

Expected: No errors, new endpoints available.

**Step 3: Commit**

```bash
git add backend/src/real-estate/real-estate.module.ts
git commit -m "$(cat <<'EOF'
Register TaxService and TaxController in RealEstateModule
EOF
)"
```

---

## Task 7: Add taxContext to Frontend

**Files:**
- Modify: `frontend/src/lib/alisa-contexts.ts`

**Step 1: Add taxContext**

Add after dashboardContext (around line 79):

```typescript
export const taxContext: AlisaContext = {
    name: 'tax',
    apiPath: 'real-estate/property/tax',
    routePath: '/tax',
}
```

**Step 2: Commit**

```bash
git add frontend/src/lib/alisa-contexts.ts
git commit -m "$(cat <<'EOF'
Add taxContext for tax view routing and API
EOF
)"
```

---

## Task 8: Create Tax Translations

**Files:**
- Create: `frontend/src/translations/tax/fi.ts`
- Create: `frontend/src/translations/tax/en.ts`

**Step 1: Create Finnish translations**

```typescript
const tax = {
  title: 'Verotus',
  infoText: 'Nämä tiedot tarvitset veroilmoitukseen. Kopioi luvut lomakkeelle 7H (Osakehuoneistot).',
  year: 'Verovuosi',
  calculate: 'Laske verotiedot',
  calculating: 'Lasketaan...',
  grossIncome: 'Vuokratulot',
  deductions: 'Vähennykset',
  depreciation: 'Poistot',
  netIncome: 'Verotettava tulo',
  form7H: 'Lomake 7H: Vuokratulot - Osakehuoneistot',
  totalIncome: 'Vuokratulot yhteensä',
  deductionsSection: 'Vähennykset',
  deductionsTotal: 'Vähennykset yhteensä',
  depreciationSection: 'Perusparannuspoistot (10%)',
  depreciationTotal: 'Poistot yhteensä',
  taxableIncome: 'Verotettava tulo',
  noData: 'Verotietoja ei ole vielä laskettu tälle vuodelle.',
  noDataHint: 'Paina "Laske verotiedot" -painiketta aloittaaksesi.',
  allProperties: 'Kaikki asunnot',
}

export default tax
```

**Step 2: Create English translations**

```typescript
const tax = {
  title: 'Taxes',
  infoText: 'You need this information for your tax return. Copy the figures to form 7H (Apartments).',
  year: 'Tax year',
  calculate: 'Calculate tax data',
  calculating: 'Calculating...',
  grossIncome: 'Rental income',
  deductions: 'Deductions',
  depreciation: 'Depreciation',
  netIncome: 'Taxable income',
  form7H: 'Form 7H: Rental Income - Apartments',
  totalIncome: 'Total rental income',
  deductionsSection: 'Deductions',
  deductionsTotal: 'Total deductions',
  depreciationSection: 'Capital improvement depreciation (10%)',
  depreciationTotal: 'Total depreciation',
  taxableIncome: 'Taxable income',
  noData: 'Tax data has not been calculated for this year yet.',
  noDataHint: 'Press "Calculate tax data" button to start.',
  allProperties: 'All properties',
}

export default tax
```

**Step 3: Register translations in i18n**

Modify `frontend/src/translations/i18n.ts` to include the new tax translations (follow existing pattern).

**Step 4: Commit**

```bash
git add frontend/src/translations/tax/fi.ts
git add frontend/src/translations/tax/en.ts
git add frontend/src/translations/i18n.ts
git commit -m "$(cat <<'EOF'
Add tax view translations for Finnish and English
EOF
)"
```

---

## Task 9: Create TaxSummaryCards Component

**Files:**
- Create: `frontend/src/components/tax/TaxSummaryCards.tsx`

**Step 1: Create the component**

```typescript
import { Grid, Paper, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";

interface TaxSummaryCardsProps {
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
}

function TaxSummaryCards({
  grossIncome,
  deductions,
  depreciation,
  netIncome,
}: TaxSummaryCardsProps) {
  const { t } = useTranslation("tax");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const cards = [
    {
      label: t("grossIncome"),
      value: grossIncome,
      color: "success.main",
    },
    {
      label: t("deductions"),
      value: deductions + depreciation,
      color: "error.main",
    },
    {
      label: t("netIncome"),
      value: netIncome,
      color: "primary.main",
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid key={card.label} size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              textAlign: "center",
              borderTop: 4,
              borderColor: card.color,
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {card.label}
            </Typography>
            <Typography variant="h4" sx={{ color: card.color }}>
              {formatCurrency(card.value)}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export default TaxSummaryCards;
```

**Step 2: Commit**

```bash
git add frontend/src/components/tax/TaxSummaryCards.tsx
git commit -m "$(cat <<'EOF'
Add TaxSummaryCards component

Displays three summary cards: gross income, total deductions, and
taxable income with color-coded borders.
EOF
)"
```

---

## Task 10: Create TaxBreakdown Component

**Files:**
- Create: `frontend/src/components/tax/TaxBreakdown.tsx`

**Step 1: Create the component**

```typescript
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Divider,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface BreakdownItem {
  category: string;
  amount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

interface TaxBreakdownProps {
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
  breakdown: BreakdownItem[];
}

function TaxBreakdown({
  grossIncome,
  deductions,
  depreciation,
  netIncome,
  breakdown,
}: TaxBreakdownProps) {
  const { t } = useTranslation("tax");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const deductionItems = breakdown.filter((item) => !item.isCapitalImprovement);
  const depreciationItems = breakdown.filter((item) => item.isCapitalImprovement);

  return (
    <Paper elevation={3} sx={{ mt: 3 }}>
      <Box sx={{ p: 2, bgcolor: "primary.main", color: "primary.contrastText" }}>
        <Typography variant="h6">{t("form7H")}</Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableBody>
            {/* Gross Income */}
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>
                {t("totalIncome")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatCurrency(grossIncome)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell colSpan={2}>
                <Divider />
              </TableCell>
            </TableRow>

            {/* Deductions Header */}
            <TableRow>
              <TableCell
                colSpan={2}
                sx={{ bgcolor: "grey.100", fontWeight: "bold" }}
              >
                {t("deductionsSection")}
              </TableCell>
            </TableRow>

            {/* Deduction Items */}
            {deductionItems.map((item) => (
              <TableRow key={item.category}>
                <TableCell sx={{ pl: 4 }}>{item.category}</TableCell>
                <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
              </TableRow>
            ))}

            {/* Deductions Total */}
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>
                {t("deductionsTotal")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatCurrency(deductions)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell colSpan={2}>
                <Divider />
              </TableCell>
            </TableRow>

            {/* Depreciation Header */}
            {depreciationItems.length > 0 && (
              <>
                <TableRow>
                  <TableCell
                    colSpan={2}
                    sx={{ bgcolor: "grey.100", fontWeight: "bold" }}
                  >
                    {t("depreciationSection")}
                  </TableCell>
                </TableRow>

                {/* Depreciation Items */}
                {depreciationItems.map((item) => (
                  <TableRow key={item.category}>
                    <TableCell sx={{ pl: 4 }}>
                      {item.category} ({formatCurrency(item.amount)} × 10%)
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.depreciationAmount || 0)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Depreciation Total */}
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {t("depreciationTotal")}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {formatCurrency(depreciation)}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={2}>
                    <Divider />
                  </TableCell>
                </TableRow>
              </>
            )}

            {/* Taxable Income */}
            <TableRow sx={{ bgcolor: "primary.light" }}>
              <TableCell sx={{ fontWeight: "bold", color: "primary.contrastText" }}>
                {t("taxableIncome")}
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", fontSize: "1.1rem", color: "primary.contrastText" }}
              >
                {formatCurrency(netIncome)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default TaxBreakdown;
```

**Step 2: Commit**

```bash
git add frontend/src/components/tax/TaxBreakdown.tsx
git commit -m "$(cat <<'EOF'
Add TaxBreakdown component

Displays tax data in Finnish 7H form structure with sections for
income, deductions, depreciation, and taxable income.
EOF
)"
```

---

## Task 11: Create TaxView Main Component

**Files:**
- Create: `frontend/src/components/tax/TaxView.tsx`

**Step 1: Create the component**

```typescript
import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import { useTranslation } from "react-i18next";
import useAuthHeader from "react-auth-kit/hooks/useAuthHeader";
import { taxContext } from "@alisa-lib/alisa-contexts";
import DataService from "@alisa-lib/data-service";
import TaxSummaryCards from "./TaxSummaryCards";
import TaxBreakdown from "./TaxBreakdown";

interface BreakdownItem {
  category: string;
  amount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

interface TaxData {
  year: number;
  propertyId?: number;
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
  breakdown: BreakdownItem[];
  calculatedAt?: string;
}

function TaxView() {
  const { t } = useTranslation("tax");
  const authHeader = useAuthHeader();

  const currentYear = new Date().getFullYear();
  const defaultYear = currentYear - 1; // Default to previous year for tax purposes

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [taxData, setTaxData] = useState<TaxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate year options (last 10 years)
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 1 - i);

  const dataService = new DataService<TaxData>({
    context: taxContext,
    authHeader: authHeader,
  });

  const fetchTaxData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dataService.getRaw(`?year=${selectedYear}`);
      if (response) {
        setTaxData(response);
      } else {
        setTaxData(null);
      }
    } catch (err) {
      console.error("Error fetching tax data:", err);
      setTaxData(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateTaxData = async () => {
    setCalculating(true);
    setError(null);
    try {
      const response = await dataService.postRaw("calculate", {
        year: selectedYear,
      });
      setTaxData(response);
    } catch (err) {
      console.error("Error calculating tax data:", err);
      setError("Failed to calculate tax data");
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, [selectedYear]);

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  };

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">{t("title")}</Typography>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="tax-year-select">{t("year")}</InputLabel>
          <Select
            labelId="tax-year-select"
            value={selectedYear}
            label={t("year")}
            onChange={handleYearChange}
          >
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        {t("infoText")}
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No Data State */}
      {!loading && !taxData && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary" gutterBottom>
            {t("noData")}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
            {t("noDataHint")}
          </Typography>
          <Button
            variant="contained"
            startIcon={
              calculating ? <CircularProgress size={20} /> : <CalculateIcon />
            }
            onClick={calculateTaxData}
            disabled={calculating}
          >
            {calculating ? t("calculating") : t("calculate")}
          </Button>
        </Paper>
      )}

      {/* Tax Data Display */}
      {!loading && taxData && (
        <>
          {/* Summary Cards */}
          <TaxSummaryCards
            grossIncome={taxData.grossIncome}
            deductions={taxData.deductions}
            depreciation={taxData.depreciation}
            netIncome={taxData.netIncome}
          />

          {/* Calculate Button */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={
                calculating ? <CircularProgress size={20} /> : <CalculateIcon />
              }
              onClick={calculateTaxData}
              disabled={calculating}
            >
              {calculating ? t("calculating") : t("calculate")}
            </Button>
          </Box>

          {/* Breakdown */}
          <TaxBreakdown
            grossIncome={taxData.grossIncome}
            deductions={taxData.deductions}
            depreciation={taxData.depreciation}
            netIncome={taxData.netIncome}
            breakdown={taxData.breakdown}
          />
        </>
      )}
    </Box>
  );
}

export default TaxView;
```

**Step 2: Commit**

```bash
git add frontend/src/components/tax/TaxView.tsx
git commit -m "$(cat <<'EOF'
Add TaxView main component

Main tax reporting page with year selector, calculate button,
summary cards, and 7H form breakdown display.
EOF
)"
```

---

## Task 12: Add Tax Route to AppRoutes

**Files:**
- Modify: `frontend/src/components/AppRoutes.tsx`

**Step 1: Import taxContext and TaxView**

Add imports at the top:

```typescript
import { taxContext } from "@alisa-lib/alisa-contexts";
import TaxView from "./tax/TaxView";
```

**Step 2: Add the route**

Add after the incomes route (around line 81):

```typescript
<Route
  path={taxContext.routePath}
  element={<TaxView />}
></Route>
```

**Step 3: Commit**

```bash
git add frontend/src/components/AppRoutes.tsx
git commit -m "$(cat <<'EOF'
Add tax view route to AppRoutes
EOF
)"
```

---

## Task 13: Update Navigation Link

**Files:**
- Modify: `frontend/src/components/layout/MainMenuItems.tsx:161-167`

**Step 1: Import taxContext**

Add to imports:

```typescript
import { taxContext } from "@alisa-lib/alisa-contexts";
```

**Step 2: Update the taxes menu item**

Change the href from "#" to the actual route:

```typescript
{menuItem(
  "taxes",
  taxContext.routePath,
  t("taxes"),
  <CalculateIcon sx={{ color: "warning.main" }} />,
  currentPath.startsWith(taxContext.routePath)
)}
```

**Step 3: Commit**

```bash
git add frontend/src/components/layout/MainMenuItems.tsx
git commit -m "$(cat <<'EOF'
Update taxes navigation link to actual route
EOF
)"
```

---

## Task 14: Final Verification

**Step 1: Start backend**

Run: `cd backend && npm run start:dev`

Expected: Backend starts without errors.

**Step 2: Start frontend**

Run: `cd frontend && npm run dev`

Expected: Frontend starts without errors.

**Step 3: Manual test**

1. Navigate to http://localhost:8080
2. Login
3. Click "Verot" in the navigation
4. Verify the tax view loads
5. Click "Laske verotiedot"
6. Verify data is calculated and displayed

**Step 4: Run tests**

Run: `cd backend && npm run test`
Run: `cd frontend && npm run test`

Expected: All tests pass.

**Step 5: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Complete tax view feature implementation

Adds a comprehensive tax reporting view for Finnish property investors
with calculation of gross income, deductions, capital improvement
depreciation, and taxable income. Data is saved to property_statistics
and displayed in a format matching the Finnish 7H tax form.
EOF
)"
```

---

## Summary

This plan implements:

1. **Backend changes:**
   - `isCapitalImprovement` field on ExpenseType
   - New StatisticKey values for tax data
   - TaxService with calculation logic
   - TaxController with calculate/get endpoints

2. **Frontend changes:**
   - Tax translations (fi/en)
   - TaxSummaryCards component
   - TaxBreakdown component (7H form layout)
   - TaxView main page
   - Route and navigation updates
