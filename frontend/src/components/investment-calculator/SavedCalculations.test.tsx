import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import ApiClient from "@alisa-lib/api-client";

// Mock translations for investment-calculator namespace
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  withTranslation: () => (Component: React.ComponentType) => {
    const WrappedComponent = (props: object) => {
      const translations: Record<string, string> = {
        "investment-calculator:savedCalculations": "Saved Calculations",
        "investment-calculator:newCalculation": "New Calculation",
        "investment-calculator:name": "Name",
        "investment-calculator:deptFreePrice": "Debt-free price",
        "investment-calculator:rentPerMonth": "Rent/month",
        "investment-calculator:cashFlowPerMonth": "Cash flow/month",
        "investment-calculator:rentalYieldPercent": "Rental yield %",
        "investment-calculator:noCalculations": "No saved calculations",
        "investment-calculator:deleteConfirm": "Are you sure?",
        "investment-calculator:rowsSelected": "{{count}} selected",
        "investment-calculator:confirmDeleteSelected":
          "Delete {{count}} calculations?",
        "investment-calculator:deleteAriaLabel": "Delete selected",
        "common:delete": "Delete",
        "common:cancel": "Cancel",
        "common:confirm": "Confirm",
        "common:toast.deleteSuccess": "Deleted successfully",
        "common:toast.error": "An error occurred",
        noRowsFound: "No rows found",
        confirm: "Confirm",
        confirmDelete: "Are you sure?",
        delete: "Delete",
        cancel: "Cancel",
        "format.currency.euro": "€{{val}}",
        "format.number": "{{val}}",
      };
      const t = (key: string, options?: Record<string, unknown>) => {
        if (
          key === "format.currency.euro" &&
          options?.val !== undefined
        ) {
          return `€${options.val}`;
        }
        if (key === "format.number" && options?.val !== undefined) {
          return String(options.val);
        }
        if (options?.count !== undefined) {
          return (translations[key] || key).replace(
            "{{count}}",
            String(options.count)
          );
        }
        return translations[key] || key;
      };
      return <Component {...props} t={t} />;
    };
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Import after mocking
import SavedCalculations from "./SavedCalculations";

describe("SavedCalculations", () => {
  const mockCalculations = [
    {
      id: 1,
      name: "Investment A",
      userId: 1,
      deptFreePrice: 100000,
      rentPerMonth: 800,
      cashFlowPerMonth: 200,
      rentalYieldPercent: 7.5,
    },
    {
      id: 2,
      name: "Investment B",
      userId: 1,
      deptFreePrice: 150000,
      rentPerMonth: 1000,
      cashFlowPerMonth: 300,
      rentalYieldPercent: 6.8,
    },
    {
      id: 3,
      name: "Investment C",
      userId: 1,
      deptFreePrice: 200000,
      rentPerMonth: 1200,
      cashFlowPerMonth: -50,
      rentalYieldPercent: 5.2,
    },
  ];

  let mockSearch: jest.SpyInstance;
  let mockDelete: jest.SpyInstance;
  let mockPostSaveTask: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch = jest.spyOn(ApiClient, "search");
    mockDelete = jest.spyOn(ApiClient, "delete");
    mockPostSaveTask = jest.spyOn(ApiClient, "postSaveTask");
  });

  afterEach(() => {
    mockSearch.mockRestore();
    mockDelete.mockRestore();
    mockPostSaveTask.mockRestore();
  });

  describe("Display", () => {
    it("renders saved calculations list", async () => {
      mockSearch.mockResolvedValue(mockCalculations);

      renderWithProviders(<SavedCalculations />);

      await waitFor(() => {
        expect(screen.getByText("Investment A")).toBeInTheDocument();
      });

      expect(screen.getByText("Investment B")).toBeInTheDocument();
      expect(screen.getByText("Investment C")).toBeInTheDocument();
    });

    it("renders add button in data table", async () => {
      mockSearch.mockResolvedValue(mockCalculations);

      renderWithProviders(<SavedCalculations />);

      await waitFor(() => {
        expect(screen.getByText("Investment A")).toBeInTheDocument();
      });

      // The add button is rendered in the data table header
      expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    });

    it("shows empty state when no calculations", async () => {
      mockSearch.mockResolvedValue([]);

      renderWithProviders(<SavedCalculations />);

      await waitFor(() => {
        expect(screen.getByText("noRowsFound")).toBeInTheDocument();
      });
    });
  });

  describe("Selection", () => {
    it("renders checkboxes for row selection", async () => {
      mockSearch.mockResolvedValue(mockCalculations);

      renderWithProviders(<SavedCalculations />);

      await waitFor(() => {
        expect(screen.getByText("Investment A")).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole("checkbox");
      // +1 for header checkbox
      expect(checkboxes.length).toBe(mockCalculations.length + 1);
    });

    it("shows bulk actions when items are selected", async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue(mockCalculations);

      renderWithProviders(<SavedCalculations />);

      await waitFor(() => {
        expect(screen.getByText("Investment A")).toBeInTheDocument();
      });

      // Click first row checkbox
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]); // First row checkbox (index 0 is header)

      // Bulk actions should be visible - check for selection count text
      await waitFor(() => {
        expect(screen.getByText(/1 calculation selected/)).toBeInTheDocument();
      });
    });

    it("hides bulk actions when selection is cancelled", async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue(mockCalculations);

      renderWithProviders(<SavedCalculations />);

      await waitFor(() => {
        expect(screen.getByText("Investment A")).toBeInTheDocument();
      });

      // Select a row
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);

      // Wait for selection count to appear
      await waitFor(() => {
        expect(screen.getByText(/1 calculation selected/)).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
      await user.click(cancelButtons[0]);

      // Selection should be cleared, text showing 0 should not show "1 calculation"
      await waitFor(() => {
        expect(screen.queryByText(/1 calculation selected/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Bulk Delete", () => {
    it("opens confirmation dialog when delete button is clicked", async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue(mockCalculations);

      renderWithProviders(<SavedCalculations />);

      await waitFor(() => {
        expect(screen.getByText("Investment A")).toBeInTheDocument();
      });

      // Select two rows
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      // Wait for selection count
      await waitFor(() => {
        expect(screen.getByText(/2 calculations selected/)).toBeInTheDocument();
      });

      // Click delete button - find the one with error color (bulk delete)
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      const bulkDeleteButton = deleteButtons.find((btn) =>
        btn.className.includes("Error")
      );
      if (bulkDeleteButton) {
        await user.click(bulkDeleteButton);
      }

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("calls bulk delete API when confirmed", async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue(mockCalculations);
      mockPostSaveTask.mockResolvedValue({
        allSuccess: true,
        rows: { total: 2, success: 2, failed: 0 },
        results: [],
      });

      renderWithProviders(<SavedCalculations />);

      await waitFor(() => {
        expect(screen.getByText("Investment A")).toBeInTheDocument();
      });

      // Select two rows
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      // Wait for selection count
      await waitFor(() => {
        expect(screen.getByText(/2 calculations selected/)).toBeInTheDocument();
      });

      // Click delete button - find the one with error color (bulk delete)
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      const bulkDeleteButton = deleteButtons.find((btn) =>
        btn.className.includes("Error")
      );
      if (bulkDeleteButton) {
        await user.click(bulkDeleteButton);
      }

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Find and click confirm button in dialog - it's the delete button inside the dialog
      const dialogButtons = screen.getByRole("dialog").querySelectorAll("button");
      const confirmButton = Array.from(dialogButtons).find(
        (btn) => btn.textContent?.toLowerCase().includes("delete")
      );
      if (confirmButton) {
        await user.click(confirmButton);
      }

      // API should be called
      await waitFor(() => {
        expect(mockPostSaveTask).toHaveBeenCalledWith(
          "real-estate/investment/delete",
          { ids: [1, 2] }
        );
      });
    });

    it("clears selection after successful bulk delete", async () => {
      const user = userEvent.setup();
      mockSearch.mockResolvedValue(mockCalculations);
      mockPostSaveTask.mockResolvedValue({
        allSuccess: true,
        rows: { total: 1, success: 1, failed: 0 },
        results: [],
      });

      renderWithProviders(<SavedCalculations />);

      await waitFor(() => {
        expect(screen.getByText("Investment A")).toBeInTheDocument();
      });

      // Select a row
      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[1]);

      // Wait for selection count
      await waitFor(() => {
        expect(screen.getByText(/1 calculation selected/)).toBeInTheDocument();
      });

      // Click delete button - find the one with error color (bulk delete)
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      const bulkDeleteButton = deleteButtons.find((btn) =>
        btn.className.includes("Error")
      );
      if (bulkDeleteButton) {
        await user.click(bulkDeleteButton);
      }

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Find and click confirm button in dialog
      const dialogButtons = screen.getByRole("dialog").querySelectorAll("button");
      const confirmButton = Array.from(dialogButtons).find(
        (btn) => btn.textContent?.toLowerCase().includes("delete")
      );
      if (confirmButton) {
        await user.click(confirmButton);
      }

      // Selection should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/1 calculation selected/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("calls onNewCalculation callback when add button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnNewCalculation = jest.fn();
      mockSearch.mockResolvedValue(mockCalculations);

      renderWithProviders(
        <SavedCalculations onNewCalculation={mockOnNewCalculation} />
      );

      await waitFor(() => {
        expect(screen.getByText("Investment A")).toBeInTheDocument();
      });

      // Find the add button in the data table
      const addButton = screen.getByRole("button", { name: /add/i });
      await user.click(addButton);

      expect(mockOnNewCalculation).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
