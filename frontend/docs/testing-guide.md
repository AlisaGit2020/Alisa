# Frontend Testing Guide

This guide explains how to write tests for React components and views in the Asset frontend.

## Overview

We use a two-tier testing strategy:

1. **Component Unit Tests** - Test individual components in isolation
2. **View Integration Tests** - Test complete views with API mocking

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for TDD)
npm test -- --watch

# Run specific test file
npm test -- ComponentName.test.tsx

# Run with coverage
npm test -- --coverage
```

## Component Unit Tests

Component tests live next to the component file:

```
src/components/asset/form/
├── AssetTextField.tsx
└── AssetTextField.test.tsx
```

### Basic Component Test Template

```typescript
import { renderWithProviders, screen } from '@test-utils/test-wrapper';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders with required props', () => {
    renderWithProviders(<MyComponent label="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls callback when user interacts', async () => {
    const user = userEvent.setup();
    const mockCallback = jest.fn();

    renderWithProviders(<MyComponent onClick={mockCallback} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', () => {
    renderWithProviders(<MyComponent disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### What to Test

✅ **DO test:**
- Component renders with required props
- User interactions trigger callbacks
- Disabled/loading states work correctly
- Validation errors display
- Edge cases (empty values, null, undefined)

❌ **DON'T test:**
- Material-UI implementation details
- CSS styles or layout
- Third-party library behavior

### Using Test Utilities

```typescript
import { renderWithProviders } from '@test-utils/test-wrapper';
import { createMockProperty } from '@test-utils/test-data';

// renderWithProviders automatically wraps with theme, i18n, router
const { getByText } = renderWithProviders(<MyComponent />);

// Use factory functions for test data
const property = createMockProperty({ name: 'Custom Name' });
```

## View Integration Tests

View tests live in the `test/views/` directory:

```
test/views/
└── PropertyDetailsView.test.tsx
```

### View Test Template

```typescript
import { renderWithProviders, screen, waitFor } from '@test-utils/test-wrapper';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { server } from '../msw/server';
import { handlers } from '@test-utils/msw-handlers';
import { createMockProperty } from '@test-utils/test-data';
import PropertyDetailsView from '../../src/components/property/PropertyDetailsView';

describe('PropertyDetailsView', () => {
  const mockProperty = createMockProperty();

  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Happy path', () => {
    it('loads and displays property data', async () => {
      server.use(
        handlers.get('/properties/1', mockProperty)
      );

      renderWithProviders(<PropertyDetailsView propertyId={1} />);

      await waitFor(() => {
        expect(screen.getByText(mockProperty.name)).toBeInTheDocument();
      });
    });

    it('saves changes successfully', async () => {
      const user = userEvent.setup();

      server.use(
        handlers.get('/properties/1', mockProperty),
        handlers.put('/properties/1', { ...mockProperty, name: 'Updated' })
      );

      renderWithProviders(<PropertyDetailsView propertyId={1} />);

      // Wait for load
      await waitFor(() => {
        expect(screen.getByText(mockProperty.name)).toBeInTheDocument();
      });

      // Click edit
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Update name
      const nameField = screen.getByLabelText(/name/i);
      await user.clear(nameField);
      await user.type(nameField, 'Updated');

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify success
      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
      });
    });
  });

  describe('Error scenarios', () => {
    it('shows error when property not found', async () => {
      server.use(
        handlers.error('/properties/1', 404, 'Not found')
      );

      renderWithProviders(<PropertyDetailsView propertyId={1} />);

      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });

    it('shows error when save fails', async () => {
      const user = userEvent.setup();

      server.use(
        handlers.get('/properties/1', mockProperty),
        handlers.error('/properties/1', 500, 'Server error', 'put')
      );

      renderWithProviders(<PropertyDetailsView propertyId={1} />);

      await waitFor(() => {
        expect(screen.getByText(mockProperty.name)).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
```

### What to Test in Views

✅ **DO test:**
- Critical user workflows (happy paths)
- Error handling (404, 500, network errors)
- Form validation
- Navigation after actions
- Loading states

❌ **DON'T test:**
- Every possible button click
- Exhaustive combinations
- Implementation details

## Translation Testing

Translation keys are automatically validated in two ways:

### 1. Translation Coverage Test

The `test/translations.test.ts` file scans all `.tsx` files and ensures every `t('key')` has a corresponding entry in all translation files.

This test runs automatically with `npm test`.

### 2. Component Tests with Translations

```typescript
it('renders translated text', () => {
  renderWithProviders(<MyComponent />);

  // Translation keys are automatically available via i18n provider
  expect(screen.getByText(/expected translation/i)).toBeInTheDocument();
});
```

## Common Patterns

### Testing Async Operations

```typescript
it('handles async operation', async () => {
  server.use(handlers.get('/data', mockData));

  renderWithProviders(<MyComponent />);

  // Use waitFor for async assertions
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Testing Form Submission

```typescript
it('submits form data', async () => {
  const user = userEvent.setup();

  renderWithProviders(<MyForm />);

  const input = screen.getByLabelText(/name/i);
  await user.type(input, 'Test Name');

  const submitButton = screen.getByRole('button', { name: /submit/i });
  await user.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/success/i)).toBeInTheDocument();
  });
});
```

### Testing Conditional Rendering

```typescript
it('shows error message when validation fails', () => {
  renderWithProviders(<MyComponent hasError={true} />);
  expect(screen.getByText(/error/i)).toBeInTheDocument();
});

it('hides error message when no error', () => {
  renderWithProviders(<MyComponent hasError={false} />);
  expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
});
```

## TDD Workflow

### For New Components

1. **Write the test first** (RED)
   ```typescript
   it('renders with label', () => {
     renderWithProviders(<NewComponent label="Test" />);
     expect(screen.getByText('Test')).toBeInTheDocument();
   });
   ```

2. **Run test to see it fail**
   ```bash
   npm test -- --watch NewComponent
   ```

3. **Write minimal code to pass** (GREEN)
   ```typescript
   export default function NewComponent({ label }: Props) {
     return <div>{label}</div>;
   }
   ```

4. **Refine and repeat**

### For Bug Fixes

1. **Write test that reproduces bug** (RED)
2. **Verify test fails** (confirms bug exists)
3. **Fix the code** (GREEN)
4. **Test passes** (bug won't regress)

## Best Practices

1. **Use semantic queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Test behavior, not implementation** - Test what users see and do
3. **Keep tests simple** - One concept per test
4. **Use meaningful test names** - Describe what should happen
5. **Avoid testing library internals** - Don't test MUI implementation
6. **Mock external dependencies** - Use MSW for API, mocks for contexts
7. **Clean up after tests** - MSW server resets automatically in beforeEach

## Troubleshooting

### Test times out

Add timeout or check for async issues:
```typescript
it('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Can't find element

Use `screen.debug()` to see rendered output:
```typescript
it('debug test', () => {
  renderWithProviders(<MyComponent />);
  screen.debug(); // Prints DOM to console
});
```

### Act warnings

Wrap state updates in waitFor:
```typescript
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

## Logic-Based Testing Pattern

Due to Jest ESM limitations with mock hoisting, some complex components are difficult to test with full rendering. In these cases, use the **logic-based testing pattern** where you test data transformation and business logic separately from React component rendering.

### When to Use

Use this pattern when:
- Component uses `withTranslation` HOC with complex i18n setup
- Component has circular imports that break mocking
- Component relies on `import.meta.env` or Vite-specific features
- Full rendering would require excessive mocking

### Pattern Example

```typescript
// Instead of rendering the full component, test the logic directly

describe('Transactions Component Logic', () => {
  describe('getSearchFilter logic', () => {
    it('returns undefined when searchText is empty', () => {
      const filter = { searchText: '' };
      const getSearchFilter = () => {
        if (!filter.searchText) return undefined;
        return { $ilike: `%${filter.searchText}%` };
      };

      expect(getSearchFilter()).toBeUndefined();
    });

    it('returns ilike filter when searchText is provided', () => {
      const filter = { searchText: 'vuokra' };
      const getSearchFilter = () => {
        if (!filter.searchText) return undefined;
        return { $ilike: `%${filter.searchText}%` };
      };

      expect(getSearchFilter()).toEqual({ $ilike: '%vuokra%' });
    });
  });

  describe('fetchOptions construction', () => {
    it('includes propertyId when greater than 0', () => {
      const filter = { propertyId: 5 };
      const where = {
        propertyId: filter.propertyId > 0 ? filter.propertyId : undefined,
      };

      expect(where.propertyId).toBe(5);
    });
  });
});
```

### Best Practices for Logic Tests

1. **Extract and replicate logic** - Copy the exact logic from the component
2. **Test all branches** - Cover all if/else conditions
3. **Test edge cases** - Empty arrays, null values, boundary conditions
4. **Keep tests focused** - One logical concept per test
5. **Name tests clearly** - Describe input and expected output

### Real Examples

See these files for logic-based testing patterns:
- `src/components/transaction/Transactions.test.tsx` - Filter and search logic
- `src/components/accounting/expenses/Expenses.test.tsx` - Date filters and fetch options
- `src/components/dashboard/Dashboard.test.tsx` - Widget state management
- `src/components/property/PropertyForm.test.tsx` - Form data handling

## Examples

See existing tests for examples:
- Component: `src/components/asset/form/AssetTextField.test.tsx`
- View: `test/views/PropertyView.test.tsx`
- Logic-based: `src/components/transaction/Transactions.test.tsx`
- Translation: `test/translations.test.ts`

## Coverage Thresholds

The project enforces **50% minimum coverage** for branches, functions, lines, and statements. These thresholds are configured in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
},
```

To check coverage locally:

```bash
npm test -- --coverage
```

## API Mocking with jest.spyOn

For components that use `ApiClient` directly, mock API calls using `jest.spyOn`:

```typescript
import ApiClient from '@asset-lib/api-client';

let mockSearch: jest.SpyInstance;
let mockDelete: jest.SpyInstance;

beforeEach(() => {
  mockSearch = jest.spyOn(ApiClient, 'search');
  mockDelete = jest.spyOn(ApiClient, 'delete');
});

afterEach(() => {
  mockSearch.mockRestore();
  mockDelete.mockRestore();
});

it('loads data from API', async () => {
  mockSearch.mockResolvedValue([{ id: 1, name: 'Test' }]);

  renderWithProviders(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  expect(mockSearch).toHaveBeenCalledWith('endpoint', expectedOptions);
});
```

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
