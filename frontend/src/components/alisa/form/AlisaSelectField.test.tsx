import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaSelectField from './AlisaSelectField';

const mockItems = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
];

describe('AlisaSelectField', () => {
  it('renders with label', () => {
    renderWithProviders(
      <AlisaSelectField
        label="Test Label"
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('displays selected value', () => {
    renderWithProviders(
      <AlisaSelectField
        label="Test Label"
        value={2}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('shows options when opened', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AlisaSelectField
        label="Test Label"
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    expect(screen.getByRole('option', { name: 'Item 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Item 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Item 3' })).toBeInTheDocument();
  });

  it('calls onChange when option is selected', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AlisaSelectField
        label="Test Label"
        value={1}
        items={mockItems}
        onChange={mockOnChange}
      />
    );

    const selectButton = screen.getByRole('combobox');
    await user.click(selectButton);

    const option = screen.getByRole('option', { name: 'Item 2' });
    await user.click(option);

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('renders in disabled state', () => {
    renderWithProviders(
      <AlisaSelectField
        label="Test Label"
        value={1}
        items={mockItems}
        disabled
        onChange={jest.fn()}
      />
    );

    const selectButton = screen.getByRole('combobox');
    expect(selectButton).toHaveClass('Mui-disabled');
  });

  it('handles empty items array', () => {
    renderWithProviders(
      <AlisaSelectField
        label="Test Label"
        value=""
        items={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('renders fullWidth when specified', () => {
    const { container } = renderWithProviders(
      <AlisaSelectField
        label="Test Label"
        value={1}
        items={mockItems}
        fullWidth
        onChange={jest.fn()}
      />
    );

    const formControl = container.querySelector('.MuiFormControl-root');
    expect(formControl).toHaveClass('MuiFormControl-fullWidth');
  });
});
