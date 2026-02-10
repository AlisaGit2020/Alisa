import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import TransactionsAcceptedActions from "./TransactionsAcceptedActions";

describe("TransactionsAcceptedActions", () => {
  const defaultProps = {
    open: true,
    selectedIds: [1, 2, 3],
    onCancel: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with row count text when open", () => {
    renderWithProviders(<TransactionsAcceptedActions {...defaultProps} />);

    // In test env, translation keys are returned as-is
    expect(screen.getByText("rowsSelected")).toBeInTheDocument();
  });

  it("renders delete and cancel buttons", () => {
    renderWithProviders(<TransactionsAcceptedActions {...defaultProps} />);

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("is hidden when open is false", () => {
    renderWithProviders(
      <TransactionsAcceptedActions {...defaultProps} open={false} />
    );

    expect(screen.queryByText("rowsSelected")).not.toBeVisible();
  });

  it("shows confirmation dialog when delete button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TransactionsAcceptedActions {...defaultProps} />);

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    // Check that dialog is open by looking for the confirm translation key
    expect(screen.getByText("confirmDeleteTransactions")).toBeInTheDocument();
  });

  it("calls onDelete when confirmation is confirmed", async () => {
    const user = userEvent.setup();
    const mockOnDelete = jest.fn();
    renderWithProviders(
      <TransactionsAcceptedActions {...defaultProps} onDelete={mockOnDelete} />
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    const confirmButtons = screen.getAllByRole("button", { name: /delete/i });
    const dialogConfirmButton = confirmButtons.find(
      (btn) => btn.closest('[role="dialog"]') !== null
    );
    await user.click(dialogConfirmButton!);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("closes dialog without calling onDelete when cancelled", async () => {
    const user = userEvent.setup();
    const mockOnDelete = jest.fn();
    renderWithProviders(
      <TransactionsAcceptedActions {...defaultProps} onDelete={mockOnDelete} />
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
    const dialogCancelButton = cancelButtons.find(
      (btn) => btn.closest('[role="dialog"]') !== null
    );
    await user.click(dialogCancelButton!);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnCancel = jest.fn();
    renderWithProviders(
      <TransactionsAcceptedActions {...defaultProps} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("renders when single row is selected", () => {
    renderWithProviders(
      <TransactionsAcceptedActions {...defaultProps} selectedIds={[1]} />
    );

    expect(screen.getByText("rowsSelected")).toBeInTheDocument();
  });

  it("disables buttons when isDeleting is true", () => {
    renderWithProviders(
      <TransactionsAcceptedActions {...defaultProps} isDeleting={true} />
    );

    expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("shows loading spinner when isDeleting is true", () => {
    renderWithProviders(
      <TransactionsAcceptedActions {...defaultProps} isDeleting={true} />
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
