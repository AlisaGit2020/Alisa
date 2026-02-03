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
- **Frontend:** React 18 + TypeScript + Vite + Material-UI + i18next
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

### Environment Variables
Backend requires in `.env`:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` - PostgreSQL connection
- JWT and Google OAuth credentials for authentication

### Internationalization
Frontend uses i18next with translation files in `frontend/src/translations/` organized by feature domain.

### Financial Data Conventions
**Transaction amounts:**
- INCOME and DEPOSIT: Store as **positive** values
- EXPENSE and WITHDRAW: Store as **negative** values
- This allows simple balance calculation: `balance = SUM(all transaction amounts)`

**Property statistics:**
- All statistic values (income, expense, deposit, withdraw) are stored as **positive** numbers
- The `key` field indicates the type, so the sign is not needed
- This simplifies display in charts and reports (no need for `Math.abs()` in UI)
