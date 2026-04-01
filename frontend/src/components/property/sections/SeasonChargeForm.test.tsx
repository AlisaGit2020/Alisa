import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@test-utils/test-wrapper';
import SeasonChargeForm from './SeasonChargeForm';

describe('SeasonChargeForm', () => {
  const defaultProps = {
    propertyId: 1,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all charge type inputs', () => {
    renderWithProviders(<SeasonChargeForm {...defaultProps} />);

    expect(screen.getByLabelText(/maintenance/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/financial/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/water/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/other/i)).toBeInTheDocument();
  });

  it('auto-calculates total', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SeasonChargeForm {...defaultProps} />);

    const maintenanceInput = screen.getByLabelText(/maintenance/i);
    const financialInput = screen.getByLabelText(/financial/i);

    await user.clear(maintenanceInput);
    await user.type(maintenanceInput, '150');
    await user.clear(financialInput);
    await user.type(financialInput, '50');

    await waitFor(() => {
      // Finnish currency format: "200,00 €"
      expect(screen.getByText(/200,00\s*€/)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with all charge inputs', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderWithProviders(<SeasonChargeForm {...defaultProps} onSubmit={onSubmit} />);

    // Set start date first (required field)
    const startDateInputs = screen.getAllByLabelText(/start date/i);
    await user.click(startDateInputs[0]);
    await user.keyboard('04/01/2024');

    const maintenanceInput = screen.getByLabelText(/maintenance/i);
    await user.clear(maintenanceInput);
    await user.type(maintenanceInput, '150');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('requires start date', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SeasonChargeForm {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
  });
});
