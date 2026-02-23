import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetRadioGroup, { AssetRadioGroupItem } from './AssetRadioGroup';

describe('AssetRadioGroup', () => {
  const mockItems: AssetRadioGroupItem[] = [
    { id: 1, name: 'Option 1' },
    { id: 2, name: 'Option 2' },
    { id: 3, name: 'Option 3' },
  ];

  it('renders all options', () => {
    renderWithProviders(
      <AssetRadioGroup
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('renders with label', () => {
    renderWithProviders(
      <AssetRadioGroup
        label="Select Option"
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Select Option')).toBeInTheDocument();
  });

  it('has correct default value selected', () => {
    renderWithProviders(
      <AssetRadioGroup
        value={2}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toBeChecked();
  });

  it('calls onChange when option is clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AssetRadioGroup
        value={1}
        items={mockItems}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByText('Option 2'));
    expect(mockOnChange).toHaveBeenCalledWith(2);
  });

  it('renders in row direction', () => {
    const { container } = renderWithProviders(
      <AssetRadioGroup
        value={1}
        items={mockItems}
        onChange={jest.fn()}
        direction="row"
      />
    );

    const radioGroup = container.querySelector('.MuiRadioGroup-root');
    expect(radioGroup).toHaveStyle({ flexDirection: 'row' });
  });

  it('renders in column direction', () => {
    const { container } = renderWithProviders(
      <AssetRadioGroup
        value={1}
        items={mockItems}
        onChange={jest.fn()}
        direction="column"
      />
    );

    const radioGroup = container.querySelector('.MuiRadioGroup-root');
    expect(radioGroup).toHaveStyle({ flexDirection: 'column' });
  });

  it('renders with empty items array', () => {
    renderWithProviders(
      <AssetRadioGroup
        value={0}
        items={[]}
        onChange={jest.fn()}
      />
    );

    const radios = screen.queryAllByRole('radio');
    expect(radios).toHaveLength(0);
  });
});
