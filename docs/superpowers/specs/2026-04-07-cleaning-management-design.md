# Cleaning Management Feature — Design Spec

## Overview

Add cleaning tracking and cleaner payment management for Airbnb properties. Admins create cleaner accounts, assign them to properties, and browse monthly cleaning records. Cleaners log in and record their cleanings with a percentage share.

## User Roles

### Role System
- Add `roles: UserRole[]` array column to User entity (PostgreSQL array)
- Enum values: `ADMIN`, `OWNER`, `CLEANER`
- Default for new users: `['OWNER']`
- Replace existing `isAdmin: boolean` field
- Migration: `isAdmin = true` → `['ADMIN', 'OWNER']`, `isAdmin = false` → `['OWNER']`

### Role Permissions
- **ADMIN**: Full access. Can create cleaner accounts, assign cleaners to own properties, view all cleanings on own properties, delete any cleaning on own properties.
- **OWNER**: Same as current behavior. Sees property dashboard, transactions, reports.
- **CLEANER**: Limited access. Can only see assigned properties. Can add cleanings, view own cleaning history, delete own cleanings.

A user can have multiple roles (e.g., `['ADMIN', 'OWNER']`).

## Data Model

### UserRole Enum (common/types.ts)
```typescript
export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  CLEANER = 'cleaner',
}
```

### User Entity Changes
- Remove: `isAdmin: boolean`
- Add: `roles: UserRole[]` — `@Column({ type: 'text', array: true, default: '{owner}' })`

### Property Entity Changes
- Add: `cleaningBruttoPrice?: number` — `decimal(12, 2)`, nullable

### New Entity: PropertyCleaner (join table)
Links cleaners to properties they're allowed to clean.

| Column | Type | Notes |
|--------|------|-------|
| propertyId | int (PK, FK) | → Property.id, ON DELETE CASCADE |
| userId | int (PK, FK) | → User.id, ON DELETE CASCADE |

Constraint: Admin can only assign cleaners to properties they own (enforced in service layer via Ownership check).

### New Entity: Cleaning
| Column | Type | Notes |
|--------|------|-------|
| id | int (PK) | Auto-generated |
| date | date | Date of cleaning |
| propertyId | int (FK) | → Property.id, ON DELETE CASCADE |
| userId | int (FK) | → User.id (the cleaner) |
| percentage | int | 1–100, the cleaner's share |

## Backend API

### Authorization
- New `RolesGuard` that checks `user.roles` array
- `@Roles('ADMIN')` decorator for admin-only endpoints
- Cleaners validated against PropertyCleaner for property access

### Cleaning Module Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/cleaning/property/:propertyId` | ADMIN/OWNER | List cleanings for a property. Query params: `month`, `year` |
| GET | `/api/cleaning/my` | CLEANER | List cleaner's own cleanings |
| POST | `/api/cleaning` | CLEANER | Add a cleaning: `{ date, propertyId, percentage }` |
| DELETE | `/api/cleaning/:id` | ADMIN (any on own property) + CLEANER (own only) | Delete a cleaning |

### Property Cleaner Management

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/property/:id/cleaners` | ADMIN | List assigned cleaners for a property |
| POST | `/api/property/:id/cleaners` | ADMIN | Assign cleaner: `{ userId }` |
| DELETE | `/api/property/:id/cleaners/:userId` | ADMIN | Remove cleaner from property |

### User/Cleaner Management

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/user/cleaner` | ADMIN | Create cleaner account: `{ email, firstName, lastName }`. Sets roles to `['CLEANER']` |
| GET | `/api/user/cleaners` | ADMIN | List all users with CLEANER role assigned to any property owned by the requesting admin |

## Frontend

### New Routes
- `/property/:id/cleanings` — Admin cleaning management page
- `/cleaner` — Cleaner dashboard

### Navigation Changes

**PropertyView.tsx**: Add "Siivous" button in the property actions area, visible only when `property.isAirbnb === true`. Navigates to `/property/:id/cleanings`.

**Login redirect**: If user has only `CLEANER` role → redirect to `/cleaner`. Otherwise → normal dashboard.

**PropertyForm.tsx**: When `isAirbnb` is checked, show `cleaningBruttoPrice` field (AssetMoneyField).

### Admin Cleaning Page (`/property/:id/cleanings`)

- Back link to property view
- Property name + brutto price display
- Month navigator (prev/next arrows)
- AssetDataTable showing cleanings for selected month:
  - Fields: date (format: date), cleaner name, percentage, calculated amount (format: currency)
  - Sum on amount column
  - Admin can delete any cleaning
- Per-cleaner summary cards below the table showing monthly totals per cleaner

### Cleaner Dashboard (`/cleaner`)

- **Property selector**:
  - If 1 property: show property name as static text
  - If 2+ properties: show AssetSelectField dropdown, first property pre-selected
  - Show brutto price below property name
- **Add cleaning form**:
  - AssetDatePicker (default: today)
  - AssetNumberField for percentage (default: 100)
  - Calculated sum display (read-only): `bruttoPrice * percentage / 100`
  - Save button
- **Cleaning history**: AssetDataTable showing cleaner's own past cleanings
  - Fields: date, property name, percentage, amount
  - Monthly total in footer
  - Cleaner can delete own cleanings

### Admin Cleaner Management
- In property actions menu (PropertyActionsMenu): new option "Manage cleaners" (visible when `isAirbnb`)
- Opens a dialog to:
  - See assigned cleaners
  - Add cleaner (select from created cleaner accounts)
  - Remove cleaner

## Translations

Add keys to all three language files (en, fi, sv) for:
- Cleaning module labels (date, cleaner, percentage, amount, total)
- Role names
- Cleaner view labels
- Admin cleaning page labels
- Error messages

## Database Migration

Single migration covering:
1. Add `roles` column to `user` table (text array, default `{owner}`)
2. Migrate `isAdmin` data: set roles to `{admin,owner}` where `isAdmin = true`
3. Drop `isAdmin` column
4. Add `cleaningBruttoPrice` column to `property` table
5. Create `property_cleaner` table
6. Create `cleaning` table

## Testing

### Backend Unit Tests
- CleaningService: CRUD operations, authorization checks, percentage validation
- PropertyCleaner: assignment/removal, ownership verification
- RolesGuard: role checking logic

### Backend E2E Tests
- Full HTTP cycle for cleaning endpoints with auth
- Cleaner can only access assigned properties
- Admin can only assign cleaners to own properties
- Role-based access control

### Frontend Tests
- CleanerDashboard: form rendering, property selector logic (1 vs multiple), history display
- AdminCleaningPage: month navigation, table rendering, delete flow
- PropertyForm: cleaningBruttoPrice field visibility when isAirbnb toggled
