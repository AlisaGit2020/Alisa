# Asset

Asset is a financial and property management application designed to help property owners and investors track transactions, manage properties, analyze investment returns, and visualize financial data through an interactive dashboard.

## Features

### Financial Management
- **Transaction Tracking** - Import bank transactions from CSV (OP bank format) and categorize them as income, expense, deposit, or withdrawal
- **Income & Expense Categories** - Create custom income and expense types with tax designation
- **Loan Payment Splitting** - Split loan payments into principal, interest, and handling fees for accurate accounting
- **Bulk Operations** - Accept, delete, or categorize multiple transactions at once

### Property Management
- **Property Portfolio** - Manage multiple properties with details like address, size, type, and photos
- **Ownership Tracking** - Track property ownership shares among multiple users
- **Property Statistics** - View aggregated monthly and yearly statistics per property

### Investment Analysis
- **Investment Calculator** - Calculate key investment metrics including:
  - Rental yield percentage
  - Monthly and annual cash flow (before and after tax)
  - Return on investment
  - Loan financing details
- **Saved Calculations** - Persist investment calculations for future reference

### Dashboard & Visualization
- **Customizable Dashboard** - Drag-and-drop widget management with visibility controls
- **Interactive Charts** - Visualize income, expenses, deposits, withdrawals, and net results
- **Monthly/Yearly Views** - Switch between different time period views

### User Experience
- **Light & Dark Theme** - Toggle between light and dark mode
- **Multi-language Support** - Available in English and Finnish
- **Google OAuth** - Sign in with Google account

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, TypeScript, Vite, Material-UI, Recharts, i18next |
| Backend | NestJS, TypeORM, PostgreSQL, Passport (JWT + Google OAuth) |
| Infrastructure | Docker, docker-compose |

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL 16
- Docker (optional, for containerized setup)

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=asset

JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ALLOWED_ORIGIN=http://localhost:8080
```

### Local Development

**Backend** (from `backend/` directory):
```bash
npm install
npm run start:dev    # Starts NestJS in watch mode
```

**Frontend** (from `frontend/` directory):
```bash
npm install
npm run dev          # Starts Vite dev server on port 8080
```

### Docker Setup

From the project root:
```bash
docker-compose up
```

This starts:
- PostgreSQL on port 5432
- Backend API on port 3000
- Frontend on port 3001

## User Flows

### Authentication
1. Click "Sign In" to authenticate via Google OAuth
2. Upon successful authentication, a JWT token is stored for API requests
3. Access protected features like dashboard and transaction management

### Transaction Management
1. **Import** - Upload a CSV file from your bank (OP format supported)
2. **Review** - Transactions are created with "Pending" status
3. **Categorize** - Assign transaction types (income, expense, deposit, withdrawal) and categories
4. **Accept** - Mark transactions as accepted to include them in statistics
5. **Analyze** - View aggregated data in charts and statistics

### Property Management
1. **Create** - Add a new property with basic information
2. **Configure** - Upload photos, set ownership shares
3. **Link Transactions** - Associate transactions with properties
4. **Monitor** - View property-specific financial statistics

### Investment Analysis
1. **Input Parameters** - Enter property price, loan details, expected rent, and expenses
2. **Calculate** - Run the investment calculator to compute metrics
3. **Analyze** - Review cash flow, yield, and ROI projections
4. **Save** - Store calculations for future reference

## Project Structure

```
Asset/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components by domain
│   │   │   ├── accounting/   # Accounting views
│   │   │   ├── admin/        # Admin panel
│   │   │   ├── asset/        # Shared UI components (AssetTextField, etc.)
│   │   │   ├── dashboard/    # Dashboard and widgets
│   │   │   ├── datatables/   # Reusable data table components
│   │   │   ├── investment-calculator/ # Investment calculator
│   │   │   ├── landing/      # Landing page
│   │   │   ├── layout/       # App shell components
│   │   │   ├── login/        # Login views
│   │   │   ├── property/     # Property management
│   │   │   ├── settings/     # User settings
│   │   │   ├── tax/          # Tax-related views
│   │   │   ├── templates/    # Template components
│   │   │   ├── transaction/  # Transaction views
│   │   │   ├── user/         # User profile views
│   │   │   └── widgets/      # Shared UI widgets
│   │   ├── lib/              # Utilities and services
│   │   │   ├── api-client.ts # API communication
│   │   │   └── data-service.ts
│   │   └── translations/     # i18n translation files
│   └── package.json
│
├── backend/                  # NestJS backend application
│   ├── src/
│   │   ├── accounting/       # Transaction, income, expense modules
│   │   ├── admin/            # Admin functionality
│   │   ├── auth/             # Authentication (JWT, Google OAuth)
│   │   ├── common/           # Shared utilities and base classes
│   │   ├── defaults/         # Default data management
│   │   ├── google/           # Google service integrations
│   │   ├── import/           # Bank CSV import utilities
│   │   ├── people/           # User and ownership management
│   │   └── real-estate/      # Property and investment modules
│   └── package.json
│
├── docker-compose.yml        # Docker orchestration
└── CLAUDE.md                 # Development guidelines
```

## API Overview

The backend exposes RESTful endpoints:

| Domain | Endpoints |
|--------|-----------|
| Auth | `/auth/google`, `/auth/user`, `/auth/user/settings` |
| Properties | `/real-estate/property/*`, `/real-estate/property/:id/statistics/*` |
| Transactions | `/accounting/transaction/*` |
| Income | `/accounting/income/*`, `/accounting/income/type/*` |
| Expenses | `/accounting/expense/*`, `/accounting/expense/type/*` |
| Investments | `/real-estate/investment/*` |
| Import | `/import/op` |

## Development Commands

### Frontend (`frontend/`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 8080) |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |

### Backend (`backend/`)
| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile NestJS application |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |

## Documentation Maintenance

**Keep this README up to date.** When making changes that affect this documentation (new features, architecture changes, dependency updates, etc.), update this file as part of the same commit or PR.

## License

Private project - All rights reserved.