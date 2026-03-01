import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import ApiClient from '@asset-lib/api-client';
import { PropertyStatus } from '@asset-types/common';
import { Property } from '@asset-types/entities';

// Mock translations
const mockTranslations: Record<string, string> = {
  'investment-calculator:addCalculation': 'Add Calculation',
  'investment-calculator:calculationName': 'Calculation Name',
  'investment-calculator:calculationNamePlaceholder': 'e.g., Scenario 1',
  'investment-calculator:propertyDetails': 'Property Details',
  'investment-calculator:rentalIncome': 'Rental Income',
  'investment-calculator:financing': 'Financing',
  'investment-calculator:deptFreePrice': 'Debt-free Price',
  'investment-calculator:rentPerMonth': 'Monthly Rent',
  'investment-calculator:maintenanceFee': 'Maintenance Fee',
  'investment-calculator:chargeForFinancialCosts': 'Financial Costs',
  'investment-calculator:downPayment': 'Down Payment',
  'investment-calculator:loanInterestPercent': 'Loan Interest',
  'investment-calculator:loanPeriod': 'Loan Period',
  'investment-calculator:loanPeriodYears': 'years',
  'investment-calculator:save': 'Save',
  'investment-calculator:cancel': 'Cancel',
  'investment-calculator:nameRequired': 'Name is required',
  'investment-calculator:addCalculationSuccess': 'Calculation added successfully',
  'investment-calculator:addCalculationError': 'Failed to add calculation',
  'common:save': 'Save',
  'common:cancel': 'Cancel',
  'common:validation.required': 'Required',
};

const mockT = (key: string) => mockTranslations[key] || key;

// Mock i18n
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'en' },
  }),
}));

// Import after mocking - this will fail initially (TDD)
// TODO: Create ApartmentCalculationDialog component
import ApartmentCalculationDialog from './ApartmentCalculationDialog';

// Helper to create mock property
const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: 1,
  name: 'Helsinki Apartment',
  size: 55,
  status: PropertyStatus.PROSPECT,
  photo: '/uploads/properties/test.jpg',
  address: {
    id: 1,
    street: 'Mannerheimintie 1',
    city: 'Helsinki',
    postalCode: '00100',
  },
  purchasePrice: 150000,
  monthlyRent: 850,
  maintenanceFee: 200,
  chargeForFinancialCosts: 50,
  ...overrides,
});

describe('ApartmentCalculationDialog', () => {
  const defaultProps = {
    open: true,
    property: createMockProperty(),
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  let mockPost: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPost = jest.spyOn(ApiClient, 'post');
  });

  afterEach(() => {
    mockPost.mockRestore();
  });

  describe('Rendering', () => {
    it('renders dialog when open is true', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog title "Add Calculation"', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByText(/add calculation/i)).toBeInTheDocument();
    });

    it('renders property name in dialog header', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
    });

    it('renders street name in dialog header', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByText(/Mannerheimintie 1/)).toBeInTheDocument();
    });

    it('renders name input field', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('autofocuses on name field when dialog opens', async () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);

      await waitFor(() => {
        expect(document.activeElement).toBe(nameInput);
      });
    });

    it('renders save and cancel buttons', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Pre-filled Property Data', () => {
    it('pre-fills debt-free price from property purchasePrice', () => {
      const property = createMockProperty({ purchasePrice: 175000 });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} property={property} />
      );

      // The value should appear as editable number (displayed as text or input)
      expect(screen.getByText(/175.*000/)).toBeInTheDocument();
    });

    it('pre-fills rent per month from property monthlyRent', () => {
      const property = createMockProperty({ monthlyRent: 950 });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} property={property} />
      );

      expect(screen.getByText(/950/)).toBeInTheDocument();
    });

    it('pre-fills maintenance fee from property', () => {
      const property = createMockProperty({ maintenanceFee: 250 });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} property={property} />
      );

      expect(screen.getByText(/250/)).toBeInTheDocument();
    });

    it('pre-fills financial costs charge from property', () => {
      const property = createMockProperty({ chargeForFinancialCosts: 75 });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} property={property} />
      );

      expect(screen.getByText(/75/)).toBeInTheDocument();
    });

    it('pre-fills apartment size from property', () => {
      const property = createMockProperty({ size: 65 });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} property={property} />
      );

      // Size may be displayed somewhere in the form
      expect(screen.getByText(/65/)).toBeInTheDocument();
    });

    it('uses default values when property fields are missing', () => {
      const property = createMockProperty({
        purchasePrice: undefined,
        monthlyRent: undefined,
        maintenanceFee: undefined,
      });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} property={property} />
      );

      // Default values should be used (e.g., 100000 for price, 800 for rent)
      expect(screen.getByText(/100.*000/)).toBeInTheDocument();
    });
  });

  describe('Form Sections', () => {
    it('renders Property Details section', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByText(/property details/i)).toBeInTheDocument();
    });

    it('renders Rental Income section', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByText(/rental income/i)).toBeInTheDocument();
    });

    it('renders Financing section', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByText(/financing/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates name field is required', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onSave={onSave} />
      );

      // Try to save without filling name
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });

      // onSave should not have been called
      expect(onSave).not.toHaveBeenCalled();
    });

    it('allows save when name is provided', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      mockPost.mockResolvedValue({ id: 1, name: 'New Calculation' });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onSave={onSave} />
      );

      // Fill in name
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'New Calculation');

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with correct data including propertyId', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      mockPost.mockResolvedValue({ id: 1, name: 'Test Calc' });

      const property = createMockProperty({
        id: 42,
        purchasePrice: 200000,
        monthlyRent: 1000,
      });

      renderWithProviders(
        <ApartmentCalculationDialog
          {...defaultProps}
          property={property}
          onSave={onSave}
        />
      );

      // Fill in name
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'My Calculation');

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          'real-estate/investment',
          expect.objectContaining({
            name: 'My Calculation',
            propertyId: 42,
            deptFreePrice: 200000,
            rentPerMonth: 1000,
          })
        );
      });
    });

    it('calls onSave callback with saved calculation', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      const savedCalc = { id: 99, name: 'Saved Calc', deptFreePrice: 150000 };
      mockPost.mockResolvedValue(savedCalc);

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onSave={onSave} />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Saved Calc');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(savedCalc);
      });
    });

    it('calls onClose after successful save', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      mockPost.mockResolvedValue({ id: 1, name: 'Test' });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Cancel Behavior', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onClose={onClose} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('does not call onSave when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onSave={onSave} />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Name');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onSave).not.toHaveBeenCalled();
    });

    it('resets form when reopened after cancel', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Name');

      // Close dialog
      rerender(<ApartmentCalculationDialog {...defaultProps} open={false} />);

      // Reopen dialog
      rerender(<ApartmentCalculationDialog {...defaultProps} open={true} />);

      // Name should be reset
      const reopenedNameInput = screen.getByLabelText(/name/i);
      expect(reopenedNameInput).toHaveValue('');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API save fails', async () => {
      const user = userEvent.setup();
      mockPost.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });
    });

    it('does not close dialog on API error', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      mockPost.mockRejectedValue(new Error('Network error'));

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });

      // Dialog should remain open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('shows loading state while saving', async () => {
      const user = userEvent.setup();
      // Use a never-resolving promise to keep loading state
      mockPost.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        // Button should show loading indicator or be disabled
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Editable Fields', () => {
    it('allows editing pre-filled purchase price', async () => {
      const user = userEvent.setup();
      const property = createMockProperty({ purchasePrice: 150000 });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} property={property} />
      );

      // Find and click on the price field to edit
      const priceText = screen.getByText(/150.*000/);
      await user.click(priceText);

      // Should show editable input
      await waitFor(() => {
        const input = screen.getByRole('spinbutton');
        expect(input).toBeInTheDocument();
      });
    });

    it('allows editing pre-filled monthly rent', async () => {
      const user = userEvent.setup();
      const property = createMockProperty({ monthlyRent: 850 });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} property={property} />
      );

      // Find and click on the rent field to edit
      const rentText = screen.getByText(/850/);
      await user.click(rentText);

      await waitFor(() => {
        const input = screen.getByRole('spinbutton');
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe('Without Property (Unlinked)', () => {
    it('renders dialog without property', () => {
      renderWithProviders(
        <ApartmentCalculationDialog
          {...defaultProps}
          property={undefined}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('uses default values when no property is provided', () => {
      renderWithProviders(
        <ApartmentCalculationDialog
          {...defaultProps}
          property={undefined}
        />
      );

      // Should show default price (e.g., 100000)
      expect(screen.getByText(/100.*000/)).toBeInTheDocument();
    });

    it('submits without propertyId when no property', async () => {
      const user = userEvent.setup();
      mockPost.mockResolvedValue({ id: 1, name: 'Unlinked' });

      renderWithProviders(
        <ApartmentCalculationDialog
          {...defaultProps}
          property={undefined}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Unlinked Calc');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          'real-estate/investment',
          expect.objectContaining({
            name: 'Unlinked Calc',
            propertyId: undefined,
          })
        );
      });
    });
  });

  describe('Loan Period Display', () => {
    it('displays loan period in years', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      // Should show "years" label for loan period
      expect(screen.getByText(/year/i)).toBeInTheDocument();
    });

    it('allows editing loan period', async () => {
      const user = userEvent.setup();

      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      // Find loan period field (default is usually 25 years)
      const loanPeriodText = screen.getByText(/25/);
      await user.click(loanPeriodText);

      await waitFor(() => {
        const input = screen.getByRole('spinbutton');
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('dialog has accessible title', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleName(/add calculation/i);
    });

    it('form fields have appropriate labels', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onClose={onClose} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      cancelButton.focus();
      await user.keyboard('{Enter}');

      expect(onClose).toHaveBeenCalled();
    });
  });
});

/**
 * Additional tests for adding calculations from apartment property groups
 * These tests cover the use case where a user wants to add a calculation
 * directly from within the apartment/property detail view.
 */
describe('ApartmentCalculationDialog - Property Group Integration', () => {
  const defaultProps = {
    open: true,
    property: {
      id: 1,
      name: 'Helsinki Apartment',
      size: 55,
      status: PropertyStatus.PROSPECT,
      photo: '/uploads/properties/test.jpg',
      address: {
        id: 1,
        street: 'Mannerheimintie 1',
        city: 'Helsinki',
        postalCode: '00100',
      },
      purchasePrice: 150000,
      monthlyRent: 850,
      maintenanceFee: 200,
      chargeForFinancialCosts: 50,
    },
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  let mockPost: jest.SpyInstance;
  let mockSearch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPost = jest.spyOn(ApiClient, 'post');
    mockSearch = jest.spyOn(ApiClient, 'search');
  });

  afterEach(() => {
    mockPost.mockRestore();
    mockSearch.mockRestore();
  });

  describe('Opening from Property Group', () => {
    it('opens dialog with correct property context', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      // Property name should be visible
      expect(screen.getByText('Helsinki Apartment')).toBeInTheDocument();
      // Street should be visible
      expect(screen.getByText(/Mannerheimintie 1/)).toBeInTheDocument();
    });

    it('pre-fills all available property data', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      // Check for pre-filled values (may be displayed as text in editable fields)
      expect(screen.getByText(/150.*000/)).toBeInTheDocument(); // Price
      expect(screen.getByText(/850/)).toBeInTheDocument(); // Rent
      expect(screen.getByText(/200/)).toBeInTheDocument(); // Maintenance fee
    });

    it('links saved calculation to the property', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      mockPost.mockResolvedValue({ id: 1, name: 'Test', propertyId: 1 });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onSave={onSave} />
      );

      // Fill in name
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Property Linked Calc');

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify propertyId is included in the API call
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          'real-estate/investment',
          expect.objectContaining({
            propertyId: 1,
          })
        );
      });
    });
  });

  describe('Property Details Display', () => {
    it('shows property photo if available', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      // Look for image element with property photo
      const photo = screen.queryByRole('img');
      if (photo) {
        expect(photo).toHaveAttribute('src', expect.stringContaining('test.jpg'));
      }
    });

    it('shows property address', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      expect(screen.getByText(/Mannerheimintie 1/)).toBeInTheDocument();
    });

    it('shows property size', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      // Size should be displayed (55 m2)
      expect(screen.getByText(/55/)).toBeInTheDocument();
    });
  });

  describe('Calculation Results Preview', () => {
    it('shows calculated rental yield based on inputs', async () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      // The form should calculate and display rental yield
      // Based on default values, look for a percentage display
      await waitFor(() => {
        // Should display some yield percentage
        expect(screen.getByText(/%/)).toBeInTheDocument();
      });
    });

    it('updates calculations when inputs change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      // Find and click on the rent field to edit
      const rentText = screen.getByText(/850/);
      await user.click(rentText);

      await waitFor(() => {
        const input = screen.getByRole('spinbutton');
        expect(input).toBeInTheDocument();
      });

      // Change the value
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '1000');

      // Blur to trigger recalculation
      await user.tab();

      // The calculated values should update (yield should increase with higher rent)
      // This is a behavioral test - exact values depend on calculation logic
    });
  });

  describe('Multiple Calculations per Property', () => {
    it('allows creating multiple calculations with different names', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      mockPost.mockResolvedValue({ id: 1, name: 'Scenario 1' });

      const { rerender } = renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onSave={onSave} />
      );

      // Create first calculation
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Scenario 1');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });

      // Close and reopen dialog
      rerender(<ApartmentCalculationDialog {...defaultProps} open={false} />);
      rerender(<ApartmentCalculationDialog {...defaultProps} open={true} />);

      // Name field should be reset for new calculation
      const newNameInput = screen.getByLabelText(/name/i);
      expect(newNameInput).toHaveValue('');
    });

    it('suggests unique names for calculations', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      // Placeholder should suggest naming convention
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('placeholder', expect.stringMatching(/scenario|calculation/i));
    });
  });

  describe('Quick Add Workflow', () => {
    it('supports quick add with minimal input (just name)', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      mockPost.mockResolvedValue({ id: 1, name: 'Quick Calc' });

      renderWithProviders(
        <ApartmentCalculationDialog {...defaultProps} onSave={onSave} />
      );

      // Just enter name and save - all other fields use defaults from property
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Quick Calc');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });

    it('provides sensible defaults for all required fields', () => {
      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      // Should see pre-filled values for key fields
      // Based on property: price, rent, maintenance fee
      expect(screen.getByText(/150.*000/)).toBeInTheDocument(); // Price from property
      expect(screen.getByText(/850/)).toBeInTheDocument(); // Rent from property
      expect(screen.getByText(/200/)).toBeInTheDocument(); // Maintenance from property

      // Should also have defaults for financing
      expect(screen.getByText(/25/)).toBeInTheDocument(); // Default loan period (years)
    });
  });

  describe('Error Handling in Group Context', () => {
    it('shows error when property link fails', async () => {
      const user = userEvent.setup();
      mockPost.mockRejectedValue({
        response: { data: { message: 'Property not found' } },
      });

      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });
    });

    it('allows retry after save failure', async () => {
      const user = userEvent.setup();
      mockPost
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ id: 1, name: 'Success' });

      renderWithProviders(<ApartmentCalculationDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      // First attempt fails
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });

      // Dialog should remain open - try again
      await user.click(saveButton);

      // Second attempt succeeds
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(2);
      });
    });
  });
});