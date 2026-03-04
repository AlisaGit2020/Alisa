import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders, server } from '@test-utils/index';
import { http, HttpResponse } from 'msw';
import Cookies from 'js-cookie';
import InvestmentCalculatorForm from './InvestmentCalculatorForm';

const API_BASE = 'http://localhost:3000';

// Mock property data returned by fetch endpoints
const mockEtuoviPropertyData = {
  url: 'https://www.etuovi.com/kohde/12345',
  deptFreePrice: 150000,
  deptShare: 20000,
  apartmentSize: 45,
  maintenanceFee: 180,
  waterCharge: 25,
  chargeForFinancialCosts: 50,
  address: 'Testikatu 1, Helsinki',
};

const mockOikotiePropertyData = {
  url: 'https://asunnot.oikotie.fi/myytavat-asunnot/12345',
  deptFreePrice: 200000,
  deptShare: 30000,
  apartmentSize: 60,
  maintenanceFee: 250,
  waterCharge: 30,
  chargeForFinancialCosts: 75,
  address: 'Oikotiekatu 2, Espoo',
};

describe('InvestmentCalculatorForm', () => {
  const defaultProps = {
    onCancel: jest.fn(),
    onAfterSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up mock auth cookie for ApiClient.getToken()
    Cookies.set('_auth', 'mock-test-token');
  });

  afterEach(() => {
    Cookies.remove('_auth');
  });

  describe('Basic Form Rendering', () => {
    it('renders form with required fields', () => {
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Check for key inputs - use getAllByRole for inputs that may have multiple matches
      const textboxes = screen.getAllByRole('textbox');
      expect(textboxes.length).toBeGreaterThan(0);

      const spinbuttons = screen.getAllByRole('spinbutton');
      expect(spinbuttons.length).toBeGreaterThanOrEqual(6);
    });

    it('renders with default numeric values', () => {
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Find inputs by their values
      const spinbuttons = screen.getAllByRole('spinbutton');

      // Check that we have expected default values in the form
      const values = spinbuttons.map(input => (input as HTMLInputElement).value);
      expect(values).toContain('100000'); // deptFreePrice
      expect(values).toContain('200'); // maintenanceFee
      expect(values).toContain('800'); // rentPerMonth
    });

    it('renders with initial values when provided', () => {
      const initialValues = {
        deptFreePrice: 150000,
        deptShare: 50000,
        transferTaxPercent: 2.5,
        maintenanceFee: 250,
        chargeForFinancialCosts: 75,
        rentPerMonth: 1000,
        name: 'Test Calculation',
      };

      renderWithProviders(
        <InvestmentCalculatorForm
          {...defaultProps}
          initialValues={initialValues}
        />
      );

      // Name input should have the initial value
      const textboxes = screen.getAllByRole('textbox');
      const nameInput = textboxes.find(input => (input as HTMLInputElement).value === 'Test Calculation');
      expect(nameInput).toBeTruthy();

      const spinbuttons = screen.getAllByRole('spinbutton');
      const values = spinbuttons.map(input => (input as HTMLInputElement).value);
      expect(values).toContain('150000');
      expect(values).toContain('1000');
    });

    it('renders save and cancel buttons', () => {
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      const buttons = screen.getAllByRole('button');
      // Should have Save, Cancel, and Fetch buttons
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders multiple input fields for investment calculation', () => {
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Count number of spinbuttons (number inputs)
      const spinbuttons = screen.getAllByRole('spinbutton');
      // Should have at least 6 number fields
      expect(spinbuttons.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Form Updates', () => {
    it('updates form data when inputs change', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      const spinbuttons = screen.getAllByRole('spinbutton');

      // Find and change debt-free price (first spinbutton with value 100000)
      const deptFreePriceInput = spinbuttons.find(input => (input as HTMLInputElement).value === '100000');
      if (deptFreePriceInput) {
        await user.clear(deptFreePriceInput);
        await user.type(deptFreePriceInput, '200000');
      }

      // Verify the value changed
      expect((deptFreePriceInput as HTMLInputElement).value).toBe('200000');
    });

    it('resets form when remounted with new key', () => {
      // Form now uses internal state and requires key change to reset
      // This matches how parent components use it (e.g., InvestmentCalculatorProtected)
      const initialValues1 = {
        deptFreePrice: 100000,
        rentPerMonth: 800,
        name: 'First',
      };

      const initialValues2 = {
        deptFreePrice: 200000,
        rentPerMonth: 1200,
        name: 'Second',
      };

      const { rerender } = renderWithProviders(
        <InvestmentCalculatorForm
          key={1}
          {...defaultProps}
          initialValues={initialValues1}
        />
      );

      // Find the name input and verify first value
      let textboxes = screen.getAllByRole('textbox');
      const firstNameInput = textboxes.find(input => (input as HTMLInputElement).value === 'First');
      expect(firstNameInput).toBeTruthy();

      // Rerender with new key to force remount
      rerender(
        <InvestmentCalculatorForm
          key={2}
          {...defaultProps}
          initialValues={initialValues2}
        />
      );

      // Form should update with new values after remount
      textboxes = screen.getAllByRole('textbox');
      const secondNameInput = textboxes.find(input => (input as HTMLInputElement).value === 'Second');
      expect(secondNameInput).toBeTruthy();

      const spinbuttons = screen.getAllByRole('spinbutton');
      const values = spinbuttons.map(input => (input as HTMLInputElement).value);
      expect(values).toContain('200000');
      expect(values).toContain('1200');
    });
  });

  describe('Listing Source Selector', () => {
    it('renders listing source selector', () => {
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Should have a combobox for source selection
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('source selector shows both Etuovi and Oikotie options', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Open source selector
      const sourceSelect = screen.getByRole('combobox');
      await user.click(sourceSelect);

      // Should show both options
      expect(screen.getByRole('option', { name: /etuovi/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /oikotie/i })).toBeInTheDocument();
    });

    it('source selector changes URL placeholder text', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Initially should show Etuovi in URL input/placeholder
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0]; // URL input is the first textbox
      expect(urlInput).toHaveAttribute('placeholder', expect.stringMatching(/etuovi/i));

      // Switch to Oikotie
      const sourceSelect = screen.getByRole('combobox');
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole('option', { name: /oikotie/i });
      await user.click(oikotieOption);

      // Placeholder should change to Oikotie
      expect(screen.getAllByRole('textbox')[0]).toHaveAttribute(
        'placeholder',
        expect.stringMatching(/oikotie/i)
      );
    });
  });

  describe('Etuovi Fetch', () => {
    it('renders etuovi fetch section', () => {
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Should have the URL input
      const textboxes = screen.getAllByRole('textbox');
      expect(textboxes.length).toBeGreaterThanOrEqual(2); // URL + name at minimum
    });

    it('fetches data from Etuovi and populates form', async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/fetch`, () => {
          return HttpResponse.json(mockEtuoviPropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Enter Etuovi URL in the first textbox
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'https://www.etuovi.com/kohde/12345');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Wait for form to be populated with fetched data
      await waitFor(() => {
        const spinbuttons = screen.getAllByRole('spinbutton');
        const values = spinbuttons.map(input => (input as HTMLInputElement).value);
        expect(values).toContain('150000'); // deptFreePrice
        expect(values).toContain('180'); // maintenanceFee
      });
    });

    it('shows error toast on Etuovi fetch failure', async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/fetch`, () => {
          return HttpResponse.json(
            { message: 'Property listing not found' },
            { status: 404 }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Enter Etuovi URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'https://www.etuovi.com/kohde/99999');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Should show error toast
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('validates Etuovi URL before fetching', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Enter invalid URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'not-a-valid-url');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid|valid/i)).toBeInTheDocument();
      });
    });
  });

  describe('Oikotie Fetch', () => {
    it('fetches data from Oikotie and populates form', async () => {
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/fetch`, () => {
          return HttpResponse.json(mockOikotiePropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Switch to Oikotie
      const sourceSelect = screen.getByRole('combobox');
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole('option', { name: /oikotie/i });
      await user.click(oikotieOption);

      // Enter Oikotie URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'https://asunnot.oikotie.fi/myytavat-asunnot/12345');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Wait for form to be populated with fetched data
      await waitFor(() => {
        const spinbuttons = screen.getAllByRole('spinbutton');
        const values = spinbuttons.map(input => (input as HTMLInputElement).value);
        expect(values).toContain('200000'); // deptFreePrice
        expect(values).toContain('250'); // maintenanceFee
      });
    });

    it('shows error toast on Oikotie fetch failure', async () => {
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/fetch`, () => {
          return HttpResponse.json(
            { message: 'Property listing not found' },
            { status: 404 }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Switch to Oikotie
      const sourceSelect = screen.getByRole('combobox');
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole('option', { name: /oikotie/i });
      await user.click(oikotieOption);

      // Enter Oikotie URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'https://asunnot.oikotie.fi/myytavat-asunnot/99999');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Should show error toast
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('validates Oikotie URL before fetching', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Switch to Oikotie
      const sourceSelect = screen.getByRole('combobox');
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole('option', { name: /oikotie/i });
      await user.click(oikotieOption);

      // Enter invalid URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'not-a-valid-url');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid|valid/i)).toBeInTheDocument();
      });
    });

    it('calls correct Oikotie API endpoint', async () => {
      let apiCalled = false;
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/fetch`, () => {
          apiCalled = true;
          return HttpResponse.json(mockOikotiePropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Switch to Oikotie
      const sourceSelect = screen.getByRole('combobox');
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole('option', { name: /oikotie/i });
      await user.click(oikotieOption);

      // Enter Oikotie URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'https://asunnot.oikotie.fi/myytavat-asunnot/12345');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      await waitFor(() => {
        expect(apiCalled).toBe(true);
      });
    });
  });

  describe('Form Population from Fetch', () => {
    it('populates name field with address from fetched data', async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/fetch`, () => {
          return HttpResponse.json(mockEtuoviPropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Enter Etuovi URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'https://www.etuovi.com/kohde/12345');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Wait for name field to be populated with address
      await waitFor(() => {
        const allTextboxes = screen.getAllByRole('textbox');
        const nameInput = allTextboxes.find(
          input => (input as HTMLInputElement).value === 'Testikatu 1, Helsinki'
        );
        expect(nameInput).toBeTruthy();
      });
    });

    it('populates apartment size from fetched data', async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/fetch`, () => {
          return HttpResponse.json(mockEtuoviPropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Enter Etuovi URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'https://www.etuovi.com/kohde/12345');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Wait for apartment size to be populated
      await waitFor(() => {
        const spinbuttons = screen.getAllByRole('spinbutton');
        const values = spinbuttons.map(input => (input as HTMLInputElement).value);
        expect(values).toContain('45'); // apartmentSize
      });
    });

    it('populates water charge from fetched data', async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/fetch`, () => {
          return HttpResponse.json(mockEtuoviPropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Enter Etuovi URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'https://www.etuovi.com/kohde/12345');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Wait for water charge to be populated
      await waitFor(() => {
        const spinbuttons = screen.getAllByRole('spinbutton');
        const values = spinbuttons.map(input => (input as HTMLInputElement).value);
        expect(values).toContain('25'); // waterCharge
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state during fetch', async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/fetch`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(mockEtuoviPropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Enter Etuovi URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'https://www.etuovi.com/kohde/12345');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('disables fetch button during loading', async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/fetch`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(mockEtuoviPropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <InvestmentCalculatorForm {...defaultProps} />
      );

      // Enter Etuovi URL
      const textboxes = screen.getAllByRole('textbox');
      const urlInput = textboxes[0];
      await user.type(urlInput, 'https://www.etuovi.com/kohde/12345');

      // Click fetch button
      const fetchButton = screen.getByRole('button', { name: /search|fetch/i });
      await user.click(fetchButton);

      // Fetch button should be disabled during loading
      expect(fetchButton).toBeDisabled();
    });
  });
});
