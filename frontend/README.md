# Alisa Frontend

React user interface for the Alisa property management system.

## Tech Stack

- **React 19** + TypeScript
- **Vite** - development server and build tool
- **Material-UI 7** - UI component library
- **i18next** - internationalization (FI/EN)
- **Recharts** - charts

## Commands

```bash
npm run dev          # Start development server (port 8080)
npm run build        # TypeScript check + production build
npm run test         # Jest tests
npm run lint         # ESLint
```

## Project Structure

```
src/
├── components/           # React components (domain-based)
│   ├── alisa/            # Shared UI components (AlisaTextField, AlisaDataTable, etc.)
│   ├── accounting/       # Accounting
│   ├── dashboard/        # Dashboard and widgets
│   ├── property/         # Property management
│   ├── transaction/      # Transaction management
│   ├── layout/           # Page layouts (AppBar, menus)
│   ├── settings/         # Settings
│   └── ...
├── lib/                  # Utilities and services
│   ├── api-client.ts     # Axios wrapper with JWT token
│   ├── data-service.ts   # Data layer
│   ├── theme-context.tsx # Theme management (light/dark)
│   └── alisa-contexts.ts # React contexts
├── types/                # TypeScript types (synced with backend)
│   ├── entities.ts       # Entity types
│   ├── inputs.ts         # DTO types (matches backend *InputDto)
│   └── common.ts         # Shared enums and types
├── translations/         # i18n translations (FI/EN)
└── App.tsx               # Main component
```

## Alisa Component Library

Shared UI components are located in `components/alisa/`:

| Folder | Contents |
|--------|----------|
| `form/` | AlisaTextField, AlisaNumberField, AlisaDatePicker, AlisaSelectField, etc. |
| `datatable/` | AlisaDataTable, AlisaDataTableActionButtons |
| `dialog/` | AlisaConfirmDialog, AlisaAlert |
| `data/` | AlisaPropertySelect, AlisaTransactionTypeSelect |

All shared components use the `Alisa` prefix.

## Development Guidelines

- **Theme:** Use Material-UI theme colors (`theme.palette.*`), don't hardcode colors
- **i18n:** All user-visible text via translation keys (`t('namespace:key')`)
- **Types:** Keep frontend types synced with backend DTO classes

## Documentation

- [Testing Guide](docs/testing-guide.md) - Writing component tests
- [CLAUDE.md](../CLAUDE.md) - Project development guidelines
