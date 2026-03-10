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

  // Total charge field tests (totalCharge = maintenanceFee + financialCharge)
  describe('totalCharge field (UI helper, not saved to DB)', () => {
    it('renders totalCharge input field in monthly costs section', async () => {
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      await waitFor(() => {
        expect(screen.getByLabelText(/maintenance fee/i)).toBeInTheDocument();
      });

      // Should have a totalCharge field alongside maintenanceFee and financialCharge
      expect(screen.getByLabelText(/total charge/i)).toBeInTheDocument();
    });

    it('calculates totalCharge when maintenanceFee and financialCharge are filled', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      await waitFor(() => {
        expect(screen.getByLabelText(/maintenance fee/i)).toBeInTheDocument();
      });

      // Fill maintenanceFee (150) and financialCharge (50)
      const maintenanceFeeField = screen.getByLabelText(/maintenance fee/i);
      const financialChargeField = screen.getByLabelText(/financial charge/i);

      await user.clear(maintenanceFeeField);
      await user.type(maintenanceFeeField, '150');
      await user.clear(financialChargeField);
      await user.type(financialChargeField, '50');

      // totalCharge should be calculated as 200
      await waitFor(() => {
        const totalChargeField = screen.getByLabelText(/total charge/i);
        expect(totalChargeField).toHaveValue('200');
      });
    });

    it('calculates financialCharge when totalCharge and maintenanceFee are filled', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      await waitFor(() => {
        expect(screen.getByLabelText(/maintenance fee/i)).toBeInTheDocument();
      });

      // Fill totalCharge (200) and maintenanceFee (150)
      const totalChargeField = screen.getByLabelText(/total charge/i);
      const maintenanceFeeField = screen.getByLabelText(/maintenance fee/i);

      await user.clear(totalChargeField);
      await user.type(totalChargeField, '200');
      await user.clear(maintenanceFeeField);
      await user.type(maintenanceFeeField, '150');

      // financialCharge should be calculated as 50
      await waitFor(() => {
        const financialChargeField = screen.getByLabelText(/financial charge/i);
        expect(financialChargeField).toHaveValue('50');
      });
    });

    it('calculates maintenanceFee when totalCharge and financialCharge are filled', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      await waitFor(() => {
        expect(screen.getByLabelText(/financial charge/i)).toBeInTheDocument();
      });

      // Fill totalCharge (200) and financialCharge (50)
      const totalChargeField = screen.getByLabelText(/total charge/i);
      const financialChargeField = screen.getByLabelText(/financial charge/i);

      await user.clear(totalChargeField);
      await user.type(totalChargeField, '200');
      await user.clear(financialChargeField);
      await user.type(financialChargeField, '50');

      // maintenanceFee should be calculated as 150
      await waitFor(() => {
        const maintenanceFeeField = screen.getByLabelText(/maintenance fee/i);
        expect(maintenanceFeeField).toHaveValue('150');
      });
    });
  });

  // District field tests (TDD - implementation does not exist yet)
  describe('district field', () => {
    it('renders district input field in the form', async () => {
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      // Should have a district field
      // This test should FAIL because district field doesn't exist yet
      expect(screen.getByLabelText(/district/i)).toBeInTheDocument();
    });

    it('updates district when user types', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      // Find and interact with district field
      // This test should FAIL because district field doesn't exist yet
      const districtField = screen.getByLabelText(/district/i);
      await user.type(districtField, 'Kallio');

      expect(districtField).toHaveValue('Kallio');
    });

    it('district field is in the location/address section', async () => {
      renderWithRouter(<PropertyForm />, { initialEntries: ['/app/portfolio/own/add'] });

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      // The district field should be near the city field (they're both location-related)
      const cityField = screen.getByLabelText(/city/i);
      const districtField = screen.getByLabelText(/district/i);

      // Both fields should exist
      expect(cityField).toBeInTheDocument();
      expect(districtField).toBeInTheDocument();
    });
  });

});
