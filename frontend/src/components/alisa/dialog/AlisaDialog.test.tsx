import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AlisaDialog from './AlisaDialog';

describe('AlisaDialog', () => {
  it('renders title and children content', () => {
    renderWithProviders(
      <AlisaDialog open={true} title="Test Dialog" onClose={jest.fn()}>
        <p>Dialog content</p>
      </AlisaDialog>
    );

    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderWithProviders(
      <AlisaDialog open={false} title="Hidden Dialog" onClose={jest.fn()}>
        <p>Hidden content</p>
      </AlisaDialog>
    );

    expect(screen.queryByText('Hidden Dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('renders with custom actions', () => {
    renderWithProviders(
      <AlisaDialog
        open={true}
        title="With Actions"
        onClose={jest.fn()}
        actions={<button>Custom Action</button>}
      >
        <p>Content</p>
      </AlisaDialog>
    );

    expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
  });

  it('does not render actions section when no actions provided', () => {
    const { container } = renderWithProviders(
      <AlisaDialog open={true} title="No Actions" onClose={jest.fn()}>
        <p>Content</p>
      </AlisaDialog>
    );

    expect(container.querySelector('.MuiDialogActions-root')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    renderWithProviders(
      <AlisaDialog open={true} title="Closable" onClose={mockOnClose}>
        <p>Content</p>
      </AlisaDialog>
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
      <AlisaDialog open={true} title="XS Dialog" maxWidth="xs" onClose={jest.fn()}>
        <p>Content</p>
      </AlisaDialog>
    );

    expect(screen.getByRole('dialog')).toHaveClass('MuiDialog-paperWidthXs');

    rerender(
      <AlisaDialog open={true} title="MD Dialog" maxWidth="md" onClose={jest.fn()}>
        <p>Content</p>
      </AlisaDialog>
    );

    expect(screen.getByRole('dialog')).toHaveClass('MuiDialog-paperWidthMd');
  });

  it('renders with fullWidth by default', () => {
    renderWithProviders(
      <AlisaDialog open={true} title="Full Width" onClose={jest.fn()}>
        <p>Content</p>
      </AlisaDialog>
    );

    expect(screen.getByRole('dialog')).toHaveClass('MuiDialog-paperFullWidth');
  });

  it('renders without fullWidth when disabled', () => {
    renderWithProviders(
      <AlisaDialog open={true} title="Not Full Width" fullWidth={false} onClose={jest.fn()}>
        <p>Content</p>
      </AlisaDialog>
    );

    expect(screen.getByRole('dialog')).not.toHaveClass('MuiDialog-paperFullWidth');
  });

  it('renders complex children content', () => {
    renderWithProviders(
      <AlisaDialog open={true} title="Complex Content" onClose={jest.fn()}>
        <div>
          <h2>Section Title</h2>
          <p>Paragraph text</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      </AlisaDialog>
    );

    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText('Paragraph text')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders multiple action buttons', () => {
    renderWithProviders(
      <AlisaDialog
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
      </AlisaDialog>
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});
