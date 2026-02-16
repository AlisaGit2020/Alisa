import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import HubPage from "./HubPage";

describe("HubPage", () => {
  it("renders sub-pages from menu config", () => {
    renderWithProviders(
      <HubPage menuId="portfolio" translationNamespace="portfolio" />
    );

    // Portfolio has 2 sub-pages: Properties and Investment Calculator
    const cards = screen.getAllByRole("link");
    expect(cards.length).toBe(2);
  });

  it("renders cards with correct links", () => {
    renderWithProviders(
      <HubPage menuId="finance" translationNamespace="finance" />
    );

    // Finance has sub-pages with specific routes
    expect(
      screen.getByRole("link", { name: /bankTransactions/i })
    ).toHaveAttribute("href", "/app/finance/transactions");
    expect(screen.getByRole("link", { name: /incomes/i })).toHaveAttribute(
      "href",
      "/app/finance/incomes"
    );
    expect(screen.getByRole("link", { name: /expenses/i })).toHaveAttribute(
      "href",
      "/app/finance/expenses"
    );
  });

  it("returns null and logs warning for invalid menuId", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { container } = renderWithProviders(
      <HubPage menuId="invalid-menu-id" translationNamespace="test" />
    );

    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      'HubPage: No menu item or subPages found for menuId "invalid-menu-id"'
    );

    warnSpy.mockRestore();
  });

  it("returns null for menu item without subPages", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    // "overview" menu item has no subPages
    const { container } = renderWithProviders(
      <HubPage menuId="overview" translationNamespace="menu" />
    );

    expect(container.firstChild).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      'HubPage: No menu item or subPages found for menuId "overview"'
    );

    warnSpy.mockRestore();
  });
});
