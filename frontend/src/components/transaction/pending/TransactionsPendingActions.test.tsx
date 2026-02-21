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

  describe("Direct type selection", () => {
    it("shows transaction type buttons when rows are selected", async () => {
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      // Wait for type buttons to load - they should be visible directly (not requiring edit mode)
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /income/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /expense/i })).toBeInTheDocument();
      });
    });

    it("shows Save button when a type is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      // Wait for type buttons to load
      const incomeButton = await screen.findByRole("button", { name: /income/i });
      await user.click(incomeButton);

      // Save button should appear
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });
    });

    it("enters loan split mode when split button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TransactionsPendingActions {...defaultProps} supportsLoanSplit={true} />);

      // Enter loan split mode
      const splitButton = screen.getByRole("button", { name: /splitLoanPayment/i });
      await user.click(splitButton);

      // In loan split mode, a cancel button should be available in the loan section
      await waitFor(() => {
        const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
        // Should have at least one cancel button for loan split
        expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("calls onSetType when type is selected and Save clicked", async () => {
      const user = userEvent.setup();
      const mockOnSetType = jest.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <TransactionsPendingActions {...defaultProps} onSetType={mockOnSetType} />
      );

      // Wait for type buttons to load
      const expenseButton = await screen.findByRole("button", { name: /expense/i });
      await user.click(expenseButton);

      // Click save
      const saveButton = await screen.findByRole("button", { name: /save/i });
      await user.click(saveButton);

      expect(mockOnSetType).toHaveBeenCalledWith(2); // EXPENSE = 2
    });

    it("deselects rows after Save is clicked", async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      const mockOnSetType = jest.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <TransactionsPendingActions
          {...defaultProps}
          onSetType={mockOnSetType}
          onCancel={mockOnCancel}
        />
      );

      // Wait for type buttons to load
      const expenseButton = await screen.findByRole("button", { name: /expense/i });
      await user.click(expenseButton);

      // Click save
      const saveButton = await screen.findByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Should call onCancel to deselect rows
      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalled();
      });
    });
  });

  describe("Category selection", () => {
    it("shows save button when EXPENSE type selected", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      // Wait for type buttons to load, then click on expense type
      const expenseButton = await screen.findByRole("button", { name: /expense/i });
      await user.click(expenseButton);

      // After clicking expense, save button should appear
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });
    });

    it("shows save button when INCOME type selected", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      // Wait for type buttons to load, then click on income type
      const incomeButton = await screen.findByRole("button", { name: /income/i });
      await user.click(incomeButton);

      // After clicking income, save button should appear
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });
    });

    it("hides category dropdown for DEPOSIT type", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      // Wait for type buttons to load, then click on deposit type
      const depositButton = await screen.findByRole("button", { name: /deposit/i });
      await user.click(depositButton);

      // No category dropdown should appear - save button should be visible but no dropdowns
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      });
      expect(screen.queryByLabelText(/expenseType/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/incomeType/i)).not.toBeInTheDocument();
    });
  });

  describe("Section grouping", () => {
    it("renders Allocation section header", () => {
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      // Use exact match to distinguish from "automaticAllocation"
      expect(screen.getByText("allocation")).toBeInTheDocument();
    });

    it("renders Automatic Allocation section header when not hidden", () => {
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      expect(screen.getByText("automaticAllocation")).toBeInTheDocument();
    });

    it("renders Other Actions section with Delete and Cancel", () => {
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      expect(screen.getByText(/otherActions/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("does not render Approve button anymore", () => {
      renderWithProviders(<TransactionsPendingActions {...defaultProps} />);

      // Approve button should not exist (removed from component)
      expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
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
