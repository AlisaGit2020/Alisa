import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetDialog from './AssetDialog';

describe('AssetDialog', () => {
  it('renders title and children content', () => {
    renderWithProviders(
      <AssetDialog open={true} title="Test Dialog" onClose={jest.fn()}>
        <p>Dialog content</p>
      </AssetDialog>
    );

    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderWithProviders(
      <AssetDialog open={false} title="Hidden Dialog" onClose={jest.fn()}>
        <p>Hidden content</p>
      </AssetDialog>
    );

    expect(screen.queryByText('Hidden Dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('renders with custom actions', () => {
    renderWithProviders(
      <AssetDialog
        open={true}
        title="With Actions"
        onClose={jest.fn()}
        actions={<button>Custom Action</button>}
      >
        <p>Content</p>
      </AssetDialog>
    );

    expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
  });

  it('does not render actions section when no actions provided', () => {
    const { container } = renderWithProviders(
      <AssetDialog open={true} title="No Actions" onClose={jest.fn()}>
        <p>Content</p>
      </AssetDialog>
    );

    expect(container.querySelector('.MuiDialogActions-root')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    renderWithProviders(
      <AssetDialog open={true} title="Closable" onClose={mockOnClose}>
        <p>Content</p>
      </AssetDialog>
    );

    // Click the backdrop (the dialog container's background)
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement?.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('renders with different maxWidth values', () => {
    const { rerender } = renderWithProviders(
      <AssetDialog open={true} title="XS Dialog" maxWidth="xs" onClose={jest.fn()}>
        <p>Content</p>
      </AssetDialog>
    );

    expect(screen.getByRole('dialog')).toHaveClass('MuiDialog-paperWidthXs');

    rerender(
      <AssetDialog open={true} title="MD Dialog" maxWidth="md" onClose={jest.fn()}>
        <p>Content</p>
      </AssetDialog>
    );

    expect(screen.getByRole('dialog')).toHaveClass('MuiDialog-paperWidthMd');
  });

  it('renders with fullWidth by default', () => {
    renderWithProviders(
      <AssetDialog open={true} title="Full Width" onClose={jest.fn()}>
        <p>Content</p>
      </AssetDialog>
    );

    expect(screen.getByRole('dialog')).toHaveClass('MuiDialog-paperFullWidth');
  });

  it('renders without fullWidth when disabled', () => {
    renderWithProviders(
      <AssetDialog open={true} title="Not Full Width" fullWidth={false} onClose={jest.fn()}>
        <p>Content</p>
      </AssetDialog>
    );

    expect(screen.getByRole('dialog')).not.toHaveClass('MuiDialog-paperFullWidth');
  });

  it('renders complex children content', () => {
    renderWithProviders(
      <AssetDialog open={true} title="Complex Content" onClose={jest.fn()}>
        <div>
          <h2>Section Title</h2>
          <p>Paragraph text</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      </AssetDialog>
    );

    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText('Paragraph text')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders multiple action buttons', () => {
    renderWithProviders(
      <AssetDialog
        open={true}
        title="Multiple Actions"
        onClose={jest.fn()}
        actions={
          <>
            <button>Cancel</button>
            <button>Confirm</button>
          </>
        }
      >
        <p>Content</p>
      </AssetDialog>
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});
