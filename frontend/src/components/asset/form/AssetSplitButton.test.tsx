import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetSplitButton from './AssetSplitButton';
import { AssetSelectFieldItem } from './AssetSelectField';

describe('AssetSplitButton', () => {
  const mockItems: AssetSelectFieldItem[] = [
    { id: 1, name: 'Action 1' },
    { id: 2, name: 'Action 2' },
    { id: 3, name: 'Action 3' },
  ];

  it('renders with selected value displayed', () => {
    renderWithProviders(
      <AssetSplitButton
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Action 1')).toBeInTheDocument();
  });

  it('renders with label', () => {
    renderWithProviders(
      <AssetSplitButton
        label="Choose Action"
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Choose Action')).toBeInTheDocument();
  });

  it('opens dropdown menu when arrow button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AssetSplitButton
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    // Click the dropdown arrow button
    const arrowButton = screen.getByRole('button', { name: /select merge strategy/i });
    await user.click(arrowButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  it('shows all options in dropdown', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AssetSplitButton
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    const arrowButton = screen.getByRole('button', { name: /select merge strategy/i });
    await user.click(arrowButton);

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Action 1' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Action 2' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Action 3' })).toBeInTheDocument();
    });
  });

  it('calls onChange when menu item is selected', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    renderWithProviders(
      <AssetSplitButton
        value={1}
        items={mockItems}
        onChange={mockOnChange}
      />
    );

    const arrowButton = screen.getByRole('button', { name: /select merge strategy/i });
    await user.click(arrowButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('menuitem', { name: 'Action 2' }));
    expect(mockOnChange).toHaveBeenCalledWith(2);
  });

  it('closes dropdown after selection', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AssetSplitButton
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    const arrowButton = screen.getByRole('button', { name: /select merge strategy/i });
    await user.click(arrowButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('menuitem', { name: 'Action 2' }));

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('displays correct selected value', () => {
    renderWithProviders(
      <AssetSplitButton
        value={2}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    // The main button should show Action 2
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Action 2');
  });

  it('opens dropdown when main button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AssetSplitButton
        value={1}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    // Click the main button (first button with the action name)
    const mainButton = screen.getByText('Action 1').closest('button');
    await user.click(mainButton!);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  it('defaults to first item when value not found', () => {
    renderWithProviders(
      <AssetSplitButton
        value={999}
        items={mockItems}
        onChange={jest.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Action 1');
  });
});
