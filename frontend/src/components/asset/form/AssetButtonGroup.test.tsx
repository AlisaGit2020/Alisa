import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetButtonGroup, { AssetButtonGroupItem } from './AssetButtonGroup';

describe('AssetButtonGroup', () => {
  const mockItems: AssetButtonGroupItem[] = [
    { id: 1, name: 'Button 1' },
    { id: 2, name: 'Button 2' },
    { id: 3, name: 'Button 3' },
  ];

  it('renders all buttons', () => {
    renderWithProviders(
      <AssetButtonGroup
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Button 1')).toBeInTheDocument();
    expect(screen.getByText('Button 2')).toBeInTheDocument();
    expect(screen.getByText('Button 3')).toBeInTheDocument();
  });

  it('shows selected button as contained variant', () => {
    renderWithProviders(
      <AssetButtonGroup
        value={2}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    const selectedButton = screen.getByText('Button 2').closest('button');
    expect(selectedButton).toHaveClass('MuiButton-contained');
  });

  it('shows unselected buttons as outlined variant', () => {
    renderWithProviders(
      <AssetButtonGroup
        value={2}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    const unselectedButton = screen.getByText('Button 1').closest('button');
    expect(unselectedButton).toHaveClass('MuiButton-outlined');
  });

  it('calls onChange when button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AssetButtonGroup
        value={1}
        items={mockItems}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByText('Button 3'));
    expect(mockOnChange).toHaveBeenCalledWith(3);
  });

  it('renders horizontally with row direction', () => {
    const { container } = renderWithProviders(
      <AssetButtonGroup
        value={1}
        items={mockItems}
        onChange={jest.fn()}
        direction="row"
      />
    );

    const buttonGroup = container.querySelector('.MuiButtonGroup-root');
    expect(buttonGroup).toHaveClass('MuiButtonGroup-horizontal');
  });

  it('renders vertically with column direction', () => {
    const { container } = renderWithProviders(
      <AssetButtonGroup
        value={1}
        items={mockItems}
        onChange={jest.fn()}
        direction="column"
      />
    );

    const buttonGroup = container.querySelector('.MuiButtonGroup-root');
    expect(buttonGroup).toHaveClass('MuiButtonGroup-vertical');
  });

  it('renders with empty items array', () => {
    renderWithProviders(
      <AssetButtonGroup
        value={0}
        items={[]}
        onChange={jest.fn()}
      />
    );

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });
});
