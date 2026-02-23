import { screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import DataService from "@asset-lib/data-service";
import { renderWithProviders } from "@test-utils/test-wrapper";
import PropertyBadge from "./PropertyBadge";

describe("PropertyBadge", () => {
  let mockSearch: jest.SpyInstance;

  beforeEach(() => {
    mockSearch = jest.spyOn(DataService.prototype, "search");
  });

  afterEach(() => {
    mockSearch.mockRestore();
  });

  it("shows error toast when property loading fails", async () => {
    mockSearch.mockRejectedValue(new Error("Network error"));

    renderWithProviders(<PropertyBadge />);

    // Wait for the toast to appear (test i18n returns just the key without namespace)
    await waitFor(() => {
      expect(screen.getByText("toast.loadFailed")).toBeInTheDocument();
    });
  });

  it("renders property badge with properties", async () => {
    const mockProperties = [
      { id: 1, name: "Test Property" },
      { id: 2, name: "Another Property" },
    ];
    mockSearch.mockResolvedValue(mockProperties);

    renderWithProviders(<PropertyBadge />);

    // Wait for properties to load - badge should show "All properties" by default
    await waitFor(() => {
      expect(screen.getByTestId("property-badge")).toBeInTheDocument();
    });
  });

  it("truncates long property names", async () => {
    const longName = "This Is A Very Long Property Name That Should Be Truncated";
    const mockProperty = { id: 1, name: longName };
    mockSearch.mockResolvedValue([mockProperty]);

    renderWithProviders(<PropertyBadge />);

    await waitFor(() => {
      const chip = screen.getByTestId("property-badge");
      const label = chip.querySelector(".MuiChip-label");
      expect(label).toHaveStyle({
        overflow: "hidden",
        textOverflow: "ellipsis",
      });
    });
  });
});
