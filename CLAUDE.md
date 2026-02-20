# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alisa is a financial and property management application built as a full-stack TypeScript monorepo with separate frontend and backend directories.

## Commands

### Frontend (from `frontend/`)
```bash
npm run dev          # Start Vite dev server on port 8080
npm run build        # TypeScript check + production build
npm run lint         # ESLint
npm run test         # Jest tests
```

### Backend (from `backend/`)
```bash
npm run start:dev    # Watch mode development
npm run build        # NestJS compilation
npm run lint         # ESLint with auto-fix
npm run test         # Unit tests
npm run test:watch   # Watch mode testing
npm run test:e2e     # End-to-end tests
```

### Docker (from root)
```bash
docker-compose up    # Start all services (database:5432, backend:3000, frontend:3001)
```

## Architecture

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Material-UI + i18next
- **Backend:** NestJS + TypeORM + PostgreSQL + Passport JWT/Google OAuth
- **Database:** PostgreSQL with TypeORM auto-sync enabled

### Backend Modules
The backend uses NestJS feature modules located in `backend/src/`:
- `accounting/` - Transactions, expenses, income with type entities
- `auth/` - JWT and Google OAuth authentication with Passport strategies
- `people/` - User management and property ownership
- `real-estate/` - Property and investment management
- `google/` - Google service integrations
- `import/` - Data import utilities (e.g., OP bank imports)
- `pricing/` - Public pricing tiers endpoint
- `feedback/` - User feedback

### API Prefix
All backend endpoints use the global `/api` prefix (configured in `backend/src/main.ts`). For example:
- `/api/auth/user`
- `/api/pricing/tiers`
- `/api/real-estate/property/search`

The nginx configuration has a single `/api/` location block that proxies all API requests to the backend. **No nginx changes are needed when adding new backend endpoints.**

### Frontend Structure
Components in `frontend/src/components/` are organized by domain:
- `property/`, `transaction/`, `user/` - Domain-specific views
- `layout/` - AppBar, containers, layout wrappers
- `datatables/` - Reusable data table components
- `widgets/` - Shared UI widgets

Shared utilities in `frontend/src/lib/`:
- `api-client.ts` - Axios wrapper with JWT token injection
- `data-service.ts` - Frontend data layer
- `alisa-contexts.ts` - React context providers
- `theme-context.tsx` - Theme mode context (light/dark)

### Theming
The app supports light and dark themes. Theme selection is stored in localStorage and can be changed from Settings > Theme.

When writing frontend code:
- Avoid hardcoding colors; use Material-UI theme colors (`theme.palette.*`)
- Use `sx` prop with theme-aware values (e.g., `backgroundColor: "grey.100"` instead of `backgroundColor: "#f5f5f5"`)
- For custom colors, use theme palette colors that adapt to light/dark mode
- Access current theme mode via `useThemeMode()` hook from `@alisa-lib/theme-context` if needed

### Alisa Component Usage

**Always use Alisa components instead of raw MUI components.**

| Instead of (MUI) | Use (Alisa) |
|------------------|-------------|
| `Button` | `AlisaButton` |
| `TextField` | `AlisaTextField` or `AlisaNumberField` |
| `TextField` + `Button` | `AlisaTextButton` (combined input with action button) |
| `Dialog` | `AlisaDialog` or `AlisaConfirmDialog` |
| `DatePicker` | `AlisaDatePicker` |
| `Select` | `AlisaSelectField` or `AlisaSelectVariant` |
| `Switch` | `AlisaSwitch` |
| `RadioGroup` | `AlisaRadioGroup` |
| `Table` | `AlisaDataTable` |
| `Alert` | `AlisaAlert` |
| `Snackbar` | `AlisaToast` + `useToast` |

**Why:**
- Consistent theming (light/dark mode works automatically)
- Unified UX across the application
- Single point of change for styling updates
- Built-in accessibility and i18n support

**Exception:** Layout components (Box, Stack, Grid, Paper) can be used directly from MUI.

Alisa components are located in `frontend/src/components/alisa/`.

### Data Tables

**Always use `AlisaDataTable` for displaying tabular data.**

Never use raw MUI Table components (Table, TableRow, TableCell, TableHead, TableBody, etc.) directly. AlisaDataTable provides:
- Consistent styling and theming (light/dark mode)
- Built-in row selection (single and bulk)
- Integrated delete confirmation dialogs
- Currency/date/number formatting via field config
- Sum calculations for numeric columns
- i18n support through the `t` function
- Action buttons (edit, delete, add)
- Empty state handling

Example usage:
```tsx
<AlisaDataTable<MyDataType>
  t={t}
  dataService={dataService}
  fields={[
    { name: "name" },
    { name: "amount", format: "currency", sum: true },
    { name: "date", format: "date" },
  ]}
  selectedIds={selectedIds}
  onSelectChange={handleSelectChange}
  onSelectAllChange={handleSelectAllChange}
  onOpen={handleOpen}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onNewRow={handleNewRow}
/>
```

### Path Aliases
Both projects use TypeScript path aliases:
- `@alisa-backend/*` → Backend source (used by both frontend and backend)
- `@alisa-lib/*` → Frontend lib directory
- `@alisa-mocks/*` → Test mocks

### Assets
Always store images and other static assets in the `frontend/assets/` folder, organized by category:
- `frontend/assets/banks/` - Bank logos (e.g., op-logo.svg)
- `frontend/assets/flags/` - Country/language flags
- `frontend/assets/properties/` - Property images

Import assets in components using relative paths from the assets folder.

### Persistent Storage
All persistent data is stored in `data/` directory which is bind-mounted into Docker containers. This directory:
- Persists across container restarts and deletions
- Survives `docker-compose down -v` and `docker volume prune`
- Should be backed up regularly in production

**Directory structure:**
- `data/postgres/` - PostgreSQL database files
- `data/uploads/properties/` - Property images

**Backup:** Ensure your production backup strategy includes the entire `data/` directory.

#### Migration: PostgreSQL from named volume to bind mount

> **⚠️ CRITICAL:** Run this migration BEFORE deploying the docker-compose.prod.yml change!
> Deploying without migration will result in an empty database.

```bash
# 1. Create backup first (recommended)
docker exec alisa-postgres pg_dump -U $DB_USERNAME $DB_DATABASE > backup_$(date +%Y%m%d).sql

# 2. Create target directory
mkdir -p ./data/postgres

# 3. Copy data from named volume (container must be running)
docker cp alisa-postgres:/var/lib/postgresql/data/. ./data/postgres/

# 4. Fix permissions (postgres user UID is 999)
sudo chown -R 999:999 ./data/postgres

# 5. Now deploy the new docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 6. Verify database works
docker exec alisa-postgres psql -U $DB_USERNAME -d $DB_DATABASE -c "SELECT COUNT(*) FROM property;"
```

#### Migration: Uploads from named volume (if not already done)

```bash
mkdir -p ./data/uploads
docker cp alisa-backend:/app/uploads/. ./data/uploads/
```

#### Local development migration

Developers with existing local setups need to migrate before pulling this change:

```bash
# If you have data in the old named volume, migrate it:
mkdir -p ./data/postgres
docker cp alisa-postgres:/var/lib/postgresql/data/. ./data/postgres/
sudo chown -R 999:999 ./data/postgres
docker-compose down && docker-compose up -d
```

If starting fresh, just `docker-compose up -d` will create a new database.

### Environment Variables
Backend requires in `.env`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` - PostgreSQL connection
- JWT and Google OAuth credentials for authentication

### Internationalization
Frontend uses i18next with translation files in `frontend/src/translations/` organized by feature domain.

**Never hardcode user-visible text in components.** Always use translation keys via `t('namespace:key')`. This applies to all labels, headings, descriptions, button texts, error messages, and any other text shown to the user. Add new keys to both `en.ts` and `fi.ts` translation files.

### Financial Data Conventions
**Transaction amounts:**
- INCOME and DEPOSIT: Store as **positive** values
- EXPENSE and WITHDRAW: Store as **negative** values
- This allows simple balance calculation: `balance = SUM(all transaction amounts)`

**Property statistics:**
- All statistic values (income, expense, deposit, withdraw) are stored as **positive** numbers
- The `key` field indicates the type, so the sign is not needed
- This simplifies display in charts and reports (no need for `Math.abs()` in UI)

## Testing Requirements

**Every backend service must have both unit tests AND e2e tests.**

### Frontend Tests

**Every React component and view should have tests.**

#### Component Unit Tests
- Colocate `.test.tsx` files with components (e.g., `AlisaTextField.tsx` → `AlisaTextField.test.tsx`)
- Use `renderWithProviders` from `@test-utils/test-wrapper` for rendering
- Use `@testing-library/user-event` for user interactions
- Cover these scenarios:
  - Renders with required props
  - User interactions trigger callbacks
  - Disabled/loading states work correctly
  - Edge cases (empty, null values)

#### View Integration Tests
- Place in `frontend/test/views/*.test.tsx`
- Use MSW to mock API responses
- Test critical paths + error scenarios:
  - Happy path (user workflow completes successfully)
  - Not found errors (404)
  - Server errors (500)
  - Validation errors

#### Translation Validation
- All translation keys must exist in all language files (en.json, fi.json)
- Translation coverage test runs automatically
- Missing keys cause test failures

#### Running Frontend Tests
```bash
cd frontend
npm test              # Run all tests
npm test -- --watch   # Watch mode for TDD
npm test -- --coverage # Check coverage
```

#### Test Utilities
- `renderWithProviders(component)` - Render with all providers (theme, i18n, router)
- `createMockProperty(overrides)` - Factory for test property data
- `createMockTransaction(overrides)` - Factory for test transaction data
- `handlers.get/post/put/delete(endpoint, data)` - MSW handler builders
- `handlers.error(endpoint, status, message)` - MSW error responses

See `frontend/docs/testing-guide.md` for detailed examples and patterns.

### Unit Tests
- Colocate `.spec.ts` files with their service (e.g., `example.service.ts` → `example.service.spec.ts`)
- Use existing mock utilities from `backend/test/mocks/`
- Use test factories from `backend/test/factories/` to create test data
- Test authorization/ownership checks to ensure users can only access their own data
- Cover these scenarios:
  - Success cases (happy path)
  - Not found errors (404)
  - Unauthorized access (403)
  - Validation errors (400)

### E2E Tests
- Place in `backend/test/*.e2e-spec.ts`
- Use helper functions from `backend/test/helper-functions.ts`
- Test full HTTP request/response cycle including authentication
- Verify response status codes and body structure

## CI/CD

### Workflow Principles

#### Flexible Development Flow
- **Direct pushes allowed** for quick fixes and small changes
- **PRs encouraged** for larger features (optional, no approval required)
- Feature branches named: `feat/description`, `fix/description`, `chore/description`
- When using PRs: CI must pass before merge

#### Conditional CI Execution
- **Pull requests**: Run lint + tests (validates code before merge)
- **Push to master**: Run lint only (tests already passed in PR)
- Path filtering: Only run jobs for changed areas (backend/frontend)
- Docs/config only: Skip lint and tests

#### Parallel CI Jobs
CI is split into independent jobs that run concurrently:
- `lint-backend` - Backend ESLint (push + PR)
- `lint-frontend` - Frontend ESLint (push + PR)
- `test-backend` - Backend unit + e2e tests (PR only)
- `test-frontend` - Frontend Jest tests (PR only)

### GitHub Actions Workflows
- **CI workflow** (`ci.yml`): Runs lint on all pushes, tests only on PRs
- **Deploy workflow** (`deploy.yml`): Runs after successful CI on master branch (excludes PR events)

### Skipping Deployment
When committing changes that don't require deployment (CI config, docs, refactoring, lint fixes), add `[skip deploy]` to the commit message:

```bash
git commit -m "ci: update workflow config [skip deploy]"
```

**Always use `[skip deploy]` for:**
- CI/CD configuration changes
- Documentation updates
- Lint fixes and code style changes
- Refactoring without functional changes
- Test-only changes

### Local Git Hooks
The project uses Husky for git hooks:
- **pre-commit**: Runs lint-staged on changed files
- **pre-push**: Smart detection - runs only relevant tests based on changed files
  - Backend changes → runs backend tests
  - Frontend changes → runs frontend tests + build
  - Docs/config only → skips tests entirely

### Branch Protection (GitHub Settings)
The master branch has these protections configured:
- Direct pushes allowed (for quick fixes)
- Force pushes prevented (protects history)
- Branch deletion prevented

## Backend DTOs and Input Types

### DTO Location
DTOs are located in `/dtos` subdirectories within each service module:
- `backend/src/accounting/transaction/dtos/` - Transaction-related DTOs
- `backend/src/accounting/expense/dtos/` - Expense DTOs
- `backend/src/accounting/income/dtos/` - Income DTOs
- `backend/src/real-estate/property/dtos/` - Property DTOs
- `backend/src/import/*/dtos/` - Import-specific DTOs
- `backend/src/common/dtos/` - Shared DTOs (e.g., `DataSaveResultDto`)

### DTO Creation Pattern
DTOs use `class-validator` decorators for validation:

```typescript
import { IsNotEmpty } from 'class-validator';

export class TransactionInputDto {
  id?: number;  // Optional for create, used for update

  @IsNotEmpty()
  sender: string = '';

  @IsNotEmpty()
  description: string = '';

  amount: number = 0;
  propertyId?: number;
}
```

### When to Use DTO vs Entity
- **DTO (Data Transfer Object)**: Use for API input/output, validation, and data transformation
- **Entity**: Use for database operations and TypeORM relationships
- DTOs are named `*InputDto` for inputs (e.g., `PropertyInputDto`)
- Response DTOs are named `*Dto` (e.g., `TransactionStatisticsDto`)

### Frontend Type Synchronization
Frontend types in `frontend/src/types/` mirror backend DTOs:
- `inputs.ts` - Mirrors backend `*InputDto` classes as TypeScript interfaces
- `entities.ts` - Entity types for frontend display
- `common.ts` - Shared enums and types (e.g., `TransactionStatus`, `TransactionType`)

When modifying backend DTOs, update corresponding frontend types in `frontend/src/types/inputs.ts`.

## Error Handling Patterns

### Backend (NestJS)
Use NestJS built-in exceptions:

```typescript
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';

// 404 - Resource not found
throw new NotFoundException('Property not found');

// 401 - Unauthorized access
throw new UnauthorizedException();

// 400 - Validation error
throw new BadRequestException('Invalid input');
```

Standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no access)
- `403` - Forbidden
- `404` - Not Found

### Frontend Error Handling
Use try/catch with user notifications:

```typescript
try {
  await apiClient.post('/endpoint', data);
  // Success handling
} catch (error) {
  // Display error to user via snackbar or alert
  console.error(error);
}
```

## Common Module & Utilities

The `backend/src/common/` directory contains shared utilities:

### Types (`common/types.ts`)
- `TransactionStatus` - PENDING, ACCEPTED
- `TransactionType` - UNKNOWN, INCOME, EXPENSE, DEPOSIT, WITHDRAW
- `StatisticKey` - Balance and tax-related keys
- `FindOptionsWhereWithUserId<T>` - TypeORM helper for user filtering

### Decorators (`common/decorators/`)
- `@User()` - Parameter decorator to extract JWT user from request

### Transformers (`common/transformer/`)
- `DecimalToNumberTransformer` - TypeORM value transformer for decimal columns
- `TypeormWhereTransformer` - Transforms frontend filter objects to TypeORM where clauses

### Other Utilities
- `typeorm.column.definitions.ts` - Reusable column definitions
- `event-tracker.service.ts` - Tracks async events for graceful shutdown
- `dashboard-config.ts` - Dashboard configuration
- `loan-message-parser.ts` - Parses loan payment messages

## Import Module

The import module (`backend/src/import/`) handles CSV imports from Finnish banks.

### Supported Banks
| Bank | Service | Controller |
|------|---------|------------|
| OP | `OpImportService` | `OpImportController` |
| S-Pankki | `SPankkiImportService` | `SPankkiImportController` |

### Architecture
Each bank import follows the same pattern:
1. **Controller** - Handles HTTP request with file upload
2. **Service** - Validates, parses CSV, transforms to transactions
3. **DTO** - Input validation (`*ImportInput`)

### Import Flow
```
CSV File → Validate User Ownership → Parse CSV Rows → Transform to TransactionInputDto → Save
```

Key features:
- Generates unique `externalId` from CSV row hash to prevent duplicates
- Skips already accepted transactions during re-import
- Returns `ImportResultDto` with saved IDs and skip count

### Adding a New Bank Format

1. Create service directory: `backend/src/import/newbank/`

2. Create DTO:
```typescript
// dtos/newbank-import-input.dto.ts
export class NewBankImportInput {
  file: string;
  fileName?: string;
  propertyId: number;
}
```

3. Create service following existing pattern:
```typescript
@Injectable()
export class NewBankImportService {
  constructor(
    private transactionService: TransactionService,
    private propertyService: PropertyService,
    private authService: AuthService,
  ) {}

  async importCsv(user: JWTUser, options: NewBankImportInput): Promise<ImportResultDto> {
    await this.validate(user, options);
    const rows = await this.readCsv(options);
    return await this.saveRows(user, rows, options);
  }

  private async readCsv(options): Promise<CSVRow[]> {
    // Parse CSV with bank-specific column mapping
  }
}
```

4. Create controller and register in `import.module.ts`

5. Add frontend type in `frontend/src/types/inputs.ts`

6. Add bank logo to `frontend/assets/banks/`

## Documentation Maintenance

**Keep README.md and CLAUDE.md up to date.** When making changes that affect documentation accuracy (new features, architecture changes, dependency updates, new modules, etc.), update the relevant documentation as part of the same commit or PR.
