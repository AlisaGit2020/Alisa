# Frontend Testing Routine - Design

**Date:** 2026-02-05
**Status:** Approved

## Overview

Establish a comprehensive test-first development routine for React components and views that catches broken components, missing translations, and interaction failures before code is merged.

## Architecture

### Two-Tier Testing Strategy

**Tier 1: Component Unit Tests**
- Location: Colocated with components (`ComponentName.tsx` → `ComponentName.test.tsx`)
- Scope: Reusable UI components in `src/components/alisa/`
- Coverage: Full interaction coverage - every prop, callback, and edge case
- Dependencies: All mocked (i18n, contexts, etc.)
- Speed: Very fast (<100ms per test)

**Tier 2: View Integration Tests**
- Location: Separate test directory (`test/views/ViewName.test.tsx`)
- Scope: Complete views/pages
- Coverage: Critical user paths + error scenarios
- Dependencies: MSW for API mocking, mocked React contexts
- Speed: Fast (100-500ms per test)
- Verifies: User interactions → API calls → UI updates → navigation

### Translation Validation

**Strict enforcement in component tests:**
- Missing translation key = test fails immediately
- Every `t('key')` must exist in translation files

**Automated coverage check:**
- Dedicated test scans all `.tsx` files for `t('...')` calls
- Validates keys exist in all languages (en, fi)
- Fails if any translation missing from any language file

### Tech Stack

- Jest + React Testing Library (existing)
- MSW (Mock Service Worker) for HTTP mocking
- @testing-library/user-event for realistic interactions
- Custom test utilities for common setup

## TDD Workflow

### For New Components

1. Create `ComponentName.test.tsx` first
2. Write test describing desired behavior (red)
3. Run `npm test -- --watch ComponentName`
4. Write minimal component code (green)
5. Refine test for edge cases, repeat

### For New Views

1. Create `test/views/ViewName.test.tsx` first
2. Set up MSW handlers for expected API calls
3. Write test for critical path (red)
4. Implement view (green)
5. Add error scenario tests
6. Implement error handling

### For Bug Fixes

1. Write test that reproduces bug (red)
2. Fix the code (green)
3. Test passes, bug won't regress

### Translation Workflow

1. Use translation keys in components: `t('property.details.title')`
2. Tests fail if key missing
3. Add keys to `frontend/src/translations/en.json` and `fi.json`
4. Tests pass

### Running Tests

- `npm test` - run all tests once
- `npm test -- --watch` - watch mode for TDD
- `npm test -- --coverage` - check coverage
- Target: >80% coverage on new code
- Tests run in CI, block merge if failing

## Test Structure & Patterns

### Component Unit Test Template

```typescript
// src/components/alisa/form/ComponentName.test.tsx
describe('ComponentName', () => {
  it('renders with required props', () => { /* ... */ });
  it('calls callbacks when user interacts', () => { /* ... */ });
  it('shows validation errors', () => { /* ... */ });
  it('respects disabled state', () => { /* ... */ });
  it('fails when translation key missing', () => { /* ... */ });
});
```

### View Integration Test Template

```typescript
// test/views/ViewName.test.tsx
describe('ViewName', () => {
  beforeEach(() => {
    // Setup MSW handlers
    // Mock auth context
  });

  describe('Happy path', () => {
    it('loads data and displays it', async () => { /* ... */ });
    it('completes user workflow successfully', async () => { /* ... */ });
  });

  describe('Error scenarios', () => {
    it('shows error when data not found', async () => { /* ... */ });
    it('shows error when operation fails', async () => { /* ... */ });
    it('shows validation errors for invalid input', async () => { /* ... */ });
  });
});
```

## Test Utilities & Setup

### Shared Utilities (`test/utils/`)

**test/utils/test-wrapper.tsx**
- `renderWithProviders(ui, options)` - wraps components with theme, i18n, router, auth

**test/utils/msw-handlers.ts**
- Reusable MSW handlers for common API endpoints
- `handlers.getProperties(data)`
- `handlers.createProperty(response)`
- `handlers.apiError(status, message)`

**test/utils/test-data.ts**
- Factory functions for test data
- `createMockProperty(overrides)`
- `createMockTransaction(overrides)`

### MSW Setup (`test/msw/`)

**test/msw/server.ts**
- MSW server instance for Node environment
- Configured in jest.setup.ts (beforeAll/afterEach/afterAll)

### Jest Configuration

- Add `test/views/**/*.test.tsx` to test patterns
- Setup MSW server globally
- Configure path aliases for test directory
- Custom matchers for translation checking

### Translation Test

**test/translations.test.ts**
- Scans all `.tsx` files for `t('key')` calls
- Validates keys exist in all translation files
- Single test covering entire codebase
- Fails if any key missing from any language

## Implementation Plan

### Phase 1: Foundation
- Install MSW (`msw` package)
- Create test utility functions
- Update Jest config
- Create translation validation test

### Phase 2: Component Tests
- Review existing tests in `src/components/alisa/`
- Enhance good tests with translation checks and edge cases
- Rewrite weak tests using new template
- Add tests for untested components
- Target: All `alisa/` components fully tested

### Phase 3: View Tests
- Create `test/views/` directory
- Identify critical views (property details, transaction list, user management)
- Write integration tests (critical paths + errors)
- Prioritize most important views first

### Phase 4: Documentation
- Create `docs/testing-guide.md` with examples
- Document TDD workflow
- Add testing checklist to PR template

## Rollout Strategy

**Requirements:**
- All new React code MUST have tests before merge
- Existing code: tests encouraged but not required
- If modifying existing component/view, add/update its tests

**Success Metrics:**
- Test suite runs in <15 seconds
- >80% coverage on new code
- Zero missing translation keys
- CI catches broken components before merge

## Test Criteria

Tests will catch:

1. **Broken React components** - Component crashes or doesn't render
2. **Broken views** - View doesn't load or critical functionality fails
3. **Missing translations** - Any `t('key')` without corresponding translation entry
4. **Interaction failures** - Buttons don't work, inputs don't update, forms don't submit
5. **API integration issues** - Wrong request format, unhandled error responses
6. **Navigation issues** - Wrong redirect after action
7. **Validation failures** - Form validation not working

## Migration Strategy

Existing tests:
- **Keep:** Tests following good patterns (e.g., AlisaTextField.test.tsx)
- **Enhance:** Add translation checks and edge cases to kept tests
- **Rewrite:** Tests with poor patterns or incomplete coverage
- **Delete:** Duplicate or obsolete tests
