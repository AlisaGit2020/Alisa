// frontend/src/components/property/PropertyForm.rendering.test.tsx
// TDD: RED phase - these tests should FAIL until we implement the fixes

import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '@test-utils/test-wrapper';
import PropertyForm from './PropertyForm';

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ idParam: undefined }), // New property mode
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/app/portfolio/own/add', state: null }),
}));

// Mock the API client and toast
jest.mock('@asset-lib/api-client', () => ({
  __esModule: true,
  default: {
    getOptions: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@asset-lib/initial-data', () => ({
  setTransactionPropertyId: jest.fn(),
}));

describe('PropertyForm rendering', () => {
  describe('rooms field', () => {
    it('renders rooms text field in the form', async () => {
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      // Should have a rooms field
      // This test should FAIL because rooms field doesn't exist yet
      expect(screen.getByLabelText(/rooms/i)).toBeInTheDocument();
    });

    it('allows entering rooms value', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      // Find and interact with rooms field
      // This test should FAIL because rooms field doesn't exist yet
      const roomsField = screen.getByLabelText(/rooms/i);
      await user.type(roomsField, '3h+k');

      expect(roomsField).toHaveValue('3h+k');
    });
  });

  describe('apartment type dropdown translation', () => {
    it('shows translated apartment type options', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      await waitFor(() => {
        expect(screen.getByLabelText(/apartment type/i)).toBeInTheDocument();
      });

      // Open the apartment type dropdown
      const dropdown = screen.getByLabelText(/apartment type/i);
      await user.click(dropdown);

      // Should show translated options, not raw keys
      // This test should FAIL because translations use wrong namespace syntax
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Apartment' })).toBeInTheDocument();
      });
    });

    it('shows all apartment type options with translations', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      await waitFor(() => {
        expect(screen.getByLabelText(/apartment type/i)).toBeInTheDocument();
      });

      // Open the apartment type dropdown
      const dropdown = screen.getByLabelText(/apartment type/i);
      await user.click(dropdown);

      // Verify multiple translated options exist
      // These should FAIL until we fix the translation namespace
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Apartment' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Row House' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Detached' })).toBeInTheDocument();
      });
    });
  });
});
