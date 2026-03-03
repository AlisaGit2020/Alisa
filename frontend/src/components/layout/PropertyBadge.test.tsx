import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import DataService from "@asset-lib/data-service";
import { renderWithProviders } from "@test-utils/test-wrapper";
import { createMockProperty } from "@test-utils/test-data";
import { PropertyStatus } from "@asset-types";
import PropertyBadge from "./PropertyBadge";

describe("PropertyBadge", () => {
  let mockSearch: jest.SpyInstance;

  beforeEach(() => {
    mockSearch = jest.spyOn(DataService.prototype, "search");
  });

  afterEach(() => {
    mockSearch.mockRestore();
  });

  describe("Closed state", () => {
    it("renders property badge with avatar showing property image", async () => {
      const mockProperties = [
        createMockProperty({
          id: 1,
          name: "My Apartment",
          photo: "uploads/properties/photo.jpg",
        }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        const badge = screen.getByTestId("property-badge");
        expect(badge).toBeInTheDocument();
        // Should have an avatar element
        const avatar = badge.querySelector("img, .MuiAvatar-root");
        expect(avatar).toBeInTheDocument();
      });
    });

    it("shows placeholder avatar when property has no image", async () => {
      const mockProperties = [
        createMockProperty({ id: 1, name: "No Photo Property", photo: undefined }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        const badge = screen.getByTestId("property-badge");
        expect(badge).toBeInTheDocument();
      });
    });

    it("shows property name in badge", async () => {
      const mockProperties = [
        createMockProperty({ id: 1, name: "Riverside Apartment" }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });
    });
  });

  describe("Menu - Open state", () => {
    it("opens menu when badge is clicked", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({ id: 1, name: "Test Property" }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });
    });

    it("shows explanatory header text about selection effects", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({ id: 1, name: "Test Property" }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        // Should have header text explaining what property selection does
        expect(screen.getByText(/propertySelector.description/i)).toBeInTheDocument();
      });
    });

    it("shows property avatar with image in menu items", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({
          id: 1,
          name: "Test Property",
          photo: "uploads/properties/test.jpg",
        }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        const menu = screen.getByRole("menu");
        // Each property item should have an avatar
        const avatars = menu.querySelectorAll(".MuiAvatar-root");
        expect(avatars.length).toBeGreaterThan(0);
      });
    });

    it("shows property name and address in menu items", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({
          id: 1,
          name: "Downtown Apartment",
          address: {
            id: 1,
            street: "Main Street 5",
            city: "Helsinki",
            postalCode: "00100",
          },
        }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        expect(screen.getByText("Downtown Apartment")).toBeInTheDocument();
        expect(screen.getByText(/Main Street 5/)).toBeInTheDocument();
      });
    });
  });

  describe("Grouping by status", () => {
    it("groups properties by status with section headers", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({ id: 1, name: "Owned Property", status: PropertyStatus.OWN }),
        createMockProperty({ id: 2, name: "Prospect Property", status: PropertyStatus.PROSPECT }),
        createMockProperty({ id: 3, name: "Sold Property", status: PropertyStatus.SOLD }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        // Should show status group headers
        expect(screen.getByText(/status.own/i)).toBeInTheDocument();
        expect(screen.getByText(/status.prospect/i)).toBeInTheDocument();
        expect(screen.getByText(/status.sold/i)).toBeInTheDocument();
      });
    });

    it("shows properties under their respective status groups", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({ id: 1, name: "My Home", status: PropertyStatus.OWN }),
        createMockProperty({ id: 2, name: "Looking At This", status: PropertyStatus.PROSPECT }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        expect(screen.getByText("My Home")).toBeInTheDocument();
        expect(screen.getByText("Looking At This")).toBeInTheDocument();
      });
    });

    it("does not show empty status groups", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({ id: 1, name: "Owned Property", status: PropertyStatus.OWN }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        expect(screen.getByText(/status.own/i)).toBeInTheDocument();
        // Should NOT show prospect or sold groups since no properties in those
        expect(screen.queryByText(/status.prospect/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/status.sold/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Selection state", () => {
    it("shows selected property as selected when menu is reopened", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({ id: 1, name: "Property A", status: PropertyStatus.OWN }),
        createMockProperty({ id: 2, name: "Property B", status: PropertyStatus.OWN }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      // Open menu and select a property
      await user.click(screen.getByTestId("property-badge"));
      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Property B"));

      // Reopen menu
      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        const menu = screen.getByRole("menu");
        // Property B should be marked as selected (has check icon or selected class)
        const propertyBItem = within(menu).getByText("Property B").closest("[role='menuitem']");
        expect(propertyBItem).toHaveAttribute("aria-selected", "true");
      });
    });

    it("shows check mark icon for selected property", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({ id: 1, name: "Property A", status: PropertyStatus.OWN }),
        createMockProperty({ id: 2, name: "Property B", status: PropertyStatus.OWN }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      // Open menu and select a property
      await user.click(screen.getByTestId("property-badge"));
      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const menu = screen.getByRole("menu");
      await user.click(within(menu).getByText("Property B"));

      // Reopen menu
      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        const reopenedMenu = screen.getByRole("menu");
        const propertyBItem = within(reopenedMenu).getByText("Property B").closest("[role='menuitem']");
        const checkIcon = propertyBItem?.querySelector("[data-testid='CheckIcon']");
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it("shows 'All Properties' option at the top", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({ id: 1, name: "Test Property", status: PropertyStatus.OWN }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        const menu = screen.getByRole("menu");
        // Find menuitem with "allProperties" text (i18n returns just the key in test)
        const allPropertiesItem = within(menu).getByRole("menuitem", { name: /allProperties/i });
        expect(allPropertiesItem).toBeInTheDocument();
      });
    });
  });

  describe("Mobile responsiveness", () => {
    it("renders badge with truncation for long property names", async () => {
      const mockProperties = [
        createMockProperty({ id: 1, name: "A Very Long Property Name That Should Be Truncated" }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        const badge = screen.getByTestId("property-badge");
        expect(badge).toBeInTheDocument();
        // Badge label should have text overflow ellipsis
        const label = badge.querySelector(".MuiChip-label");
        expect(label).toHaveStyle({
          overflow: "hidden",
          textOverflow: "ellipsis",
        });
      });
    });

    it("menu can display many properties", async () => {
      const user = userEvent.setup();
      const mockProperties = Array.from({ length: 20 }, (_, i) =>
        createMockProperty({ id: i + 1, name: `Property ${i + 1}`, status: PropertyStatus.OWN })
      );
      mockSearch.mockResolvedValue(mockProperties);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("property-badge"));

      await waitFor(() => {
        const menu = screen.getByRole("menu");
        expect(menu).toBeInTheDocument();
        // Should show all 20 properties plus "All Properties" option
        const menuItems = within(menu).getAllByRole("menuitem");
        expect(menuItems.length).toBe(21); // 20 properties + All Properties
      });
    });
  });

  describe("Error handling", () => {
    it("shows error toast when property loading fails", async () => {
      mockSearch.mockRejectedValue(new Error("Network error"));

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByText("toast.loadFailed")).toBeInTheDocument();
      });
    });
  });

  describe("Event handling", () => {
    it("dispatches property change event when property is selected", async () => {
      const user = userEvent.setup();
      const mockProperties = [
        createMockProperty({ id: 42, name: "Selected Property", status: PropertyStatus.OWN }),
      ];
      mockSearch.mockResolvedValue(mockProperties);

      const eventHandler = jest.fn();
      window.addEventListener("transactionPropertyChange", eventHandler);

      renderWithProviders(<PropertyBadge />);

      await waitFor(() => {
        expect(screen.getByTestId("property-badge")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("property-badge"));
      await user.click(screen.getByText("Selected Property"));

      expect(eventHandler).toHaveBeenCalled();

      window.removeEventListener("transactionPropertyChange", eventHandler);
    });
  });
});
