import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import TransactionsPendingActions from "./TransactionsPendingActions";

// Mock the ApiClient
jest.mock("@alisa-lib/api-client.ts", () => ({
  default: {
    me: jest.fn().mockResolvedValue({
      loanPrincipalExpenseTypeId: 1,
      loanInterestExpenseTypeId: 2,
      loanHandlingFeeExpenseTypeId: 3,
    }),
  },
}));

// Mock DataService to prevent actual API calls
jest.mock("@alisa-lib/data-service.ts", () => {
  return jest.fn().mockImplementation(() => ({
    search: jest.fn().mockResolvedValue([
      { id: 1, name: "Expense Type 1" },
      { id: 2, name: "Expense Type 2" },
    ]),
  }));
});

describe("TransactionsPendingActions", () => {
  const defaultProps = {
    open: true,
    selectedIds: [1, 2, 3],
    hasExpenseTransactions: true,
    hasIncomeTransactions: false,
    onCancel: jest.fn(),
    onApprove: jest.fn(),
    onSetType: jest.fn().mockResolvedValue(undefined),
    onSetCategoryType: jest.fn().mockResolvedValue(undefined),
    onSplitLoanPayment: jest.fn().mockResolvedValue(undefined),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic rendering", () => {
    it("renders with row count text when open", () => {
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      expect(screen.getByText("rowsSelected")).toBeInTheDocument();
    });

    it("renders action buttons when open", () => {
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /splitLoanPayment/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("is hidden when open is false", () => {
      renderWithProviders(
        <TransactionsPendingActions {...defaultProps} open={false} />
      );

      expect(screen.queryByText("rowsSelected")).not.toBeVisible();
    });

    it("hides approve button when hideApprove is true", () => {
      renderWithProviders(
        <TransactionsPendingActions {...defaultProps} hideApprove={true} />
      );

      expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
    });

    it("hides split loan payment button when hideSplitLoanPayment is true", () => {
      renderWithProviders(
        <TransactionsPendingActions {...defaultProps} hideSplitLoanPayment={true} />
      );

      expect(screen.queryByRole("button", { name: /splitLoanPayment/i })).not.toBeInTheDocument();
    });
  });

  describe("Delete confirmation", () => {
    it("shows confirmation dialog when delete button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText("confirmDeleteTransactions")).toBeInTheDocument();
    });

    it("calls onDelete when confirmation is confirmed", async () => {
      const user = userEvent.setup();
      const mockOnDelete = jest.fn();
      renderWithProviders(
        <TransactionsPendingActions {...defaultProps} onDelete={mockOnDelete} />
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
        <TransactionsPendingActions {...defaultProps} onDelete={mockOnDelete} />
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
  });

  describe("Edit mode", () => {
    it("enters edit mode when edit button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      // In edit mode, save button should appear (there are multiple stacks, one visible in edit mode)
      await waitFor(() => {
        const saveButtons = screen.getAllByRole("button", { name: /save/i });
        expect(saveButtons.length).toBeGreaterThan(0);
      });
    });

    it("exits edit mode and resets state when cancel is clicked in edit mode", async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      renderWithProviders(
        <TransactionsPendingActions {...defaultProps} onCancel={mockOnCancel} />
      );

      // Enter edit mode
      const editButton = screen.getByRole("button", { name: /edit/i });
      await user.click(editButton);

      // Wait for edit mode to activate
      await waitFor(() => {
        const saveButtons = screen.getAllByRole("button", { name: /save/i });
        expect(saveButtons.length).toBeGreaterThan(0);
      });

      // Click cancel in edit mode - find the visible one
      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      await user.click(cancelButtons[0]);

      // Should exit edit mode, not call parent onCancel
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe("Loan split mode", () => {
    it("renders split loan payment button when not hidden", () => {
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      const splitButton = screen.getByRole("button", { name: /splitLoanPayment/i });
      expect(splitButton).toBeInTheDocument();
    });

    it("split loan payment button is clickable", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      const splitButton = screen.getByRole("button", { name: /splitLoanPayment/i });
      // Should not throw when clicked
      await user.click(splitButton);
    });
  });

  describe("Approve action", () => {
    it("calls onApprove when approve button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnApprove = jest.fn();
      renderWithProviders(
        <TransactionsPendingActions {...defaultProps} onApprove={mockOnApprove} />
      );

      const approveButton = screen.getByRole("button", { name: /approve/i });
      await user.click(approveButton);

      expect(mockOnApprove).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cancel action", () => {
    it("calls onCancel when cancel button is clicked in normal mode", async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      renderWithProviders(
        <TransactionsPendingActions {...defaultProps} onCancel={mockOnCancel} />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Single row selection", () => {
    it("renders when single row is selected", () => {
      renderWithProviders(
        <TransactionsPendingActions {...defaultProps} selectedIds={[1]} />
      );

      expect(screen.getByText("rowsSelected")).toBeInTheDocument();
    });
  });
});
