import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import CompactActionBar from "./CompactActionBar";
import i18n from "../../../../test/utils/test-i18n";

// Mock DataService to prevent actual API calls
jest.mock("@asset-lib/data-service.ts", () => {
  const mockExpenseTypes = [
    { id: 1, key: "MAINTENANCE" },
    { id: 2, key: "UTILITIES" },
  ];
  const mockIncomeTypes = [
    { id: 10, key: "RENT" },
    { id: 11, key: "PARKING" },
  ];

  return jest.fn().mockImplementation((config: { context?: { apiPath?: string } }) => {
    const apiPath = config?.context?.apiPath || "";
    return {
      search: jest.fn().mockImplementation(() => {
        if (apiPath === "accounting/expense/type") {
          return Promise.resolve(mockExpenseTypes);
        }
        if (apiPath === "accounting/income/type") {
          return Promise.resolve(mockIncomeTypes);
        }
        return Promise.resolve([]);
      }),
    };
  });
});

describe("CompactActionBar", () => {
  const defaultProps = {
    t: i18n.t,
    open: true,
    selectedIds: [1, 2, 3],
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
    it("renders with selection count when open", () => {
      renderWithProviders(<CompactActionBar {...defaultProps} />);

      expect(screen.getByTestId("compact-action-bar")).toBeInTheDocument();
      expect(screen.getByTestId("selection-count")).toHaveTextContent("3");
    });

    it("is hidden when open is false", () => {
      renderWithProviders(<CompactActionBar {...defaultProps} open={false} />);

      expect(screen.getByTestId("compact-action-bar")).not.toBeVisible();
    });

    it("renders action icon buttons", () => {
      renderWithProviders(<CompactActionBar {...defaultProps} />);

      expect(screen.getByTestId("save-button")).toBeInTheDocument();
      expect(screen.getByTestId("delete-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
      expect(screen.getByTestId("expand-button")).toBeInTheDocument();
    });

    it("renders auto-allocate button when provided", () => {
      const mockOnAutoAllocate = jest.fn();
      renderWithProviders(
        <CompactActionBar {...defaultProps} onAutoAllocate={mockOnAutoAllocate} />
      );

      expect(screen.getByTestId("auto-allocate-button")).toBeInTheDocument();
    });

    it("renders rules button when provided", () => {
      const mockOnOpenAllocationRules = jest.fn();
      renderWithProviders(
        <CompactActionBar {...defaultProps} onOpenAllocationRules={mockOnOpenAllocationRules} />
      );

      expect(screen.getByTestId("rules-button")).toBeInTheDocument();
    });

    it("renders reset allocation button in main bar when provided", () => {
      renderWithProviders(
        <CompactActionBar {...defaultProps} onResetAllocation={jest.fn()} />
      );

      expect(screen.getByTestId("reset-allocation-button")).toBeInTheDocument();
    });
  });

  describe("Expand/collapse toggle", () => {
    it("expands when expand button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CompactActionBar {...defaultProps} supportsLoanSplit={true} />
      );

      // Click expand button
      const expandButton = screen.getByTestId("expand-button");
      await user.click(expandButton);

      // Expanded section should show split loan payment button
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /splitLoanPayment/i })).toBeInTheDocument();
      });
    });

    it("collapses when clicked again", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CompactActionBar {...defaultProps} supportsLoanSplit={true} />
      );

      const expandButton = screen.getByTestId("expand-button");

      // Expand
      await user.click(expandButton);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /splitLoanPayment/i })).toBeVisible();
      });

      // Collapse - the Collapse component hides content, check for the collapsed state
      await user.click(expandButton);

      // After collapsing, the expand button icon should change back
      // We verify the toggle worked by checking expand icon is shown again
      await waitFor(() => {
        expect(screen.getByTestId("ExpandMoreIcon")).toBeInTheDocument();
      });
    });

    it("shows split loan payment button in expanded section", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CompactActionBar {...defaultProps} supportsLoanSplit={true} />
      );

      const expandButton = screen.getByTestId("expand-button");
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /splitLoanPayment/i })).toBeInTheDocument();
      });
    });

    it("shows accept button in expanded section when not hidden", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompactActionBar {...defaultProps} hideApprove={false} />);

      const expandButton = screen.getByTestId("expand-button");
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
      });
    });

    it("hides accept button when hideApprove is true", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompactActionBar {...defaultProps} hideApprove={true} />);

      const expandButton = screen.getByTestId("expand-button");
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument();
      });
    });
  });

  describe("Action callbacks", () => {
    it("calls onDelete when delete button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnDelete = jest.fn();
      renderWithProviders(<CompactActionBar {...defaultProps} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByTestId("delete-button");
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      renderWithProviders(<CompactActionBar {...defaultProps} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onAutoAllocate when auto-allocate button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnAutoAllocate = jest.fn();
      renderWithProviders(
        <CompactActionBar {...defaultProps} onAutoAllocate={mockOnAutoAllocate} />
      );

      const autoAllocateButton = screen.getByTestId("auto-allocate-button");
      await user.click(autoAllocateButton);

      expect(mockOnAutoAllocate).toHaveBeenCalledTimes(1);
    });

    it("calls onOpenAllocationRules when rules button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnOpenAllocationRules = jest.fn();
      renderWithProviders(
        <CompactActionBar {...defaultProps} onOpenAllocationRules={mockOnOpenAllocationRules} />
      );

      const rulesButton = screen.getByTestId("rules-button");
      await user.click(rulesButton);

      expect(mockOnOpenAllocationRules).toHaveBeenCalledTimes(1);
    });
  });

  describe("Type selection", () => {
    it("shows transaction type buttons", () => {
      renderWithProviders(<CompactActionBar {...defaultProps} />);

      expect(screen.getByTestId("income-button")).toBeInTheDocument();
      expect(screen.getByTestId("expense-button")).toBeInTheDocument();
      expect(screen.getByTestId("deposit-button")).toBeInTheDocument();
      expect(screen.getByTestId("withdraw-button")).toBeInTheDocument();
    });

    it("opens income menu when income button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompactActionBar {...defaultProps} />);

      const incomeButton = screen.getByTestId("income-button");
      await user.click(incomeButton);

      // Menu should open
      await waitFor(() => {
        expect(screen.getByTestId("income-menu")).toBeVisible();
      });
    });

    it("opens expense menu when expense button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompactActionBar {...defaultProps} />);

      const expenseButton = screen.getByTestId("expense-button");
      await user.click(expenseButton);

      // Menu should open
      await waitFor(() => {
        expect(screen.getByTestId("expense-menu")).toBeVisible();
      });
    });

    it("save button is disabled when no type selected", () => {
      renderWithProviders(<CompactActionBar {...defaultProps} />);

      const saveButton = screen.getByTestId("save-button");
      expect(saveButton).toBeDisabled();
    });

    it("save button is enabled when deposit is selected", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompactActionBar {...defaultProps} />);

      const depositButton = screen.getByTestId("deposit-button");
      await user.click(depositButton);

      const saveButton = screen.getByTestId("save-button");
      expect(saveButton).not.toBeDisabled();
    });

    it("calls onSetType when save is clicked after selecting deposit", async () => {
      const user = userEvent.setup();
      const mockOnSetType = jest.fn().mockResolvedValue(undefined);
      renderWithProviders(<CompactActionBar {...defaultProps} onSetType={mockOnSetType} />);

      const depositButton = screen.getByTestId("deposit-button");
      await user.click(depositButton);

      const saveButton = screen.getByTestId("save-button");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSetType).toHaveBeenCalledWith(3); // DEPOSIT = 3
      });
    });

    it("calls onSetType when save is clicked after selecting withdraw", async () => {
      const user = userEvent.setup();
      const mockOnSetType = jest.fn().mockResolvedValue(undefined);
      renderWithProviders(<CompactActionBar {...defaultProps} onSetType={mockOnSetType} />);

      const withdrawButton = screen.getByTestId("withdraw-button");
      await user.click(withdrawButton);

      const saveButton = screen.getByTestId("save-button");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSetType).toHaveBeenCalledWith(4); // WITHDRAW = 4
      });
    });

    it("calls onCancel after save to deselect rows", async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      const mockOnSetType = jest.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <CompactActionBar {...defaultProps} onSetType={mockOnSetType} onCancel={mockOnCancel} />
      );

      const depositButton = screen.getByTestId("deposit-button");
      await user.click(depositButton);

      const saveButton = screen.getByTestId("save-button");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalled();
      });
    });
  });

  describe("Category selection flow", () => {
    // Note: Full menu item selection tests would require more complex async mock setup.
    // The category selection UI is tested through:
    // - "opens expense menu when expense button is clicked" (verifies menu opens)
    // - "opens income menu when income button is clicked" (verifies menu opens)
    // - "save button is disabled when expense selected but no category chosen" (verifies validation)
    // The onSetCategoryType callback integration is verified through the parent component integration tests.

    it("save button is disabled when expense selected but no category chosen", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CompactActionBar {...defaultProps} />);

      // Click expense button to open menu
      const expenseButton = screen.getByTestId("expense-button");
      await user.click(expenseButton);

      // Close menu without selecting - click elsewhere
      await user.keyboard("{Escape}");

      // Save button should still be disabled (expense type without category)
      const saveButton = screen.getByTestId("save-button");
      expect(saveButton).toBeDisabled();
    });
  });

  describe("State reset behavior", () => {
    it("resets selection state when selectedIds changes", async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithProviders(
        <CompactActionBar {...defaultProps} selectedIds={[1, 2, 3]} />
      );

      // Select deposit type
      const depositButton = screen.getByTestId("deposit-button");
      await user.click(depositButton);

      // Save button should be enabled
      expect(screen.getByTestId("save-button")).not.toBeDisabled();

      // Rerender with different selectedIds (simulating new row selection)
      rerender(<CompactActionBar {...defaultProps} selectedIds={[4, 5]} />);

      // Save button should be disabled again (selection was reset)
      await waitFor(() => {
        expect(screen.getByTestId("save-button")).toBeDisabled();
      });
    });
  });

  describe("Disabled states", () => {
    it("disables auto-allocate when autoAllocateDisabled is true", () => {
      renderWithProviders(
        <CompactActionBar
          {...defaultProps}
          onAutoAllocate={jest.fn()}
          autoAllocateDisabled={true}
        />
      );

      const autoAllocateButton = screen.getByTestId("auto-allocate-button");
      expect(autoAllocateButton).toBeDisabled();
    });

    it("disables auto-allocate when isAllocating is true", () => {
      renderWithProviders(
        <CompactActionBar
          {...defaultProps}
          onAutoAllocate={jest.fn()}
          isAllocating={true}
        />
      );

      const autoAllocateButton = screen.getByTestId("auto-allocate-button");
      expect(autoAllocateButton).toBeDisabled();
    });

    it("disables reset allocation when hasAllocatedSelected is false", () => {
      renderWithProviders(
        <CompactActionBar
          {...defaultProps}
          onResetAllocation={jest.fn()}
          hasAllocatedSelected={false}
        />
      );

      // Reset button is now in main bar
      const resetButton = screen.getByTestId("reset-allocation-button");
      expect(resetButton).toBeDisabled();
    });

    it("disables accept when hasUnallocatedSelected is true", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CompactActionBar {...defaultProps} hasUnallocatedSelected={true} />
      );

      // Expand to see accept button
      const expandButton = screen.getByTestId("expand-button");
      await user.click(expandButton);

      await waitFor(() => {
        const acceptButton = screen.getByRole("button", { name: /accept/i });
        expect(acceptButton).toBeDisabled();
      });
    });
  });

  describe("Sticky positioning", () => {
    it("has sticky position styling", () => {
      renderWithProviders(<CompactActionBar {...defaultProps} />);

      const actionBar = screen.getByTestId("compact-action-bar");
      expect(actionBar).toHaveStyle({ position: "sticky" });
    });
  });
});
