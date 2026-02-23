import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';
import AssetForm from './AssetForm';

describe('AssetForm', () => {
  it('renders children components', () => {
    const mockFormComponents = <input type="text" placeholder="Username" />;

    renderWithProviders(
      <AssetForm
        formComponents={mockFormComponents}
        submitButtonText="Submit"
        cancelButtonText="Cancel"
        validationMessage=""
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
  });

  it('renders submit and cancel buttons', () => {
    const mockFormComponents = <input type="text" placeholder="Username" />;

    renderWithProviders(
      <AssetForm
        formComponents={mockFormComponents}
        submitButtonText="Submit"
        cancelButtonText="Cancel"
        validationMessage=""
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onSubmit when submit button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn();
    const mockFormComponents = <input type="text" placeholder="Username" />;

    renderWithProviders(
      <AssetForm
        formComponents={mockFormComponents}
        submitButtonText="Submit"
        cancelButtonText="Cancel"
        validationMessage=""
        onSubmit={mockOnSubmit}
        onCancel={jest.fn()}
      />
    );

    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCancel = jest.fn();
    const mockFormComponents = <input type="text" placeholder="Username" />;

    renderWithProviders(
      <AssetForm
        formComponents={mockFormComponents}
        submitButtonText="Submit"
        cancelButtonText="Cancel"
        validationMessage=""
        onSubmit={jest.fn()}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('renders multiple form fields', () => {
    const mockFormComponents = (
      <>
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
      </>
    );

    renderWithProviders(
      <AssetForm
        formComponents={mockFormComponents}
        submitButtonText="Submit"
        cancelButtonText="Cancel"
        validationMessage=""
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });
});
