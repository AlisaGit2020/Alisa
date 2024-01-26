import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlisaForm from './AlisaForm';

describe('AlisaForm', () => {
  it('renders form components, handles button clicks, and displays alerts', () => {
    // Mock form components
    const mockFormComponents = (
      <>
        <input type="text" placeholder="Username" />
      </>
    );

    // Mock functions for submit and cancel actions
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    // Render AlisaForm with mock form components and functions
    render(
      <AlisaForm
        formComponents={mockFormComponents}
        submitButtonText="Submit"
        cancelButtonText="Cancel"
        errorMessage="Error Message"
        validationMessage="Validation Message"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check if form components are rendered
    const usernameInput = screen.getByPlaceholderText('Username');
    expect(usernameInput).toBeInTheDocument();

    // Check if buttons are rendered
    const submitButton = screen.getByText('Submit');
    const cancelButton = screen.getByText('Cancel');
    expect(submitButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    // Simulate form submission
    fireEvent.click(submitButton);
    // Check if the onSubmit callback is called
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);

    // Simulate cancel action
    fireEvent.click(cancelButton);
    // Check if the onCancel callback is called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);

    // Check if alerts are rendered
    const errorAlert = screen.getByText('Error Message');
    const validationAlert = screen.getByText('Validation Message');
    expect(errorAlert).toBeInTheDocument();
    expect(validationAlert).toBeInTheDocument();
  });

});
