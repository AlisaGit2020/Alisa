import { screen } from "@testing-library/react";
import PropertySummaryCards from "./PropertySummaryCards";
import { renderWithProviders } from "@test-utils/test-wrapper";

describe("PropertySummaryCards", () => {
  const defaultProps = {
    currentYearIncome: 12000,
    currentYearExpenses: 8500,
    allTimeBalance: 45000,
    allTimeNetIncome: 3500,
  };

  it("renders all four summary cards", () => {
    renderWithProviders(<PropertySummaryCards {...defaultProps} />);

    expect(screen.getByText("Current Year Income")).toBeInTheDocument();
    expect(screen.getByText("Current Year Expenses")).toBeInTheDocument();
    expect(screen.getByText("All-Time Balance")).toBeInTheDocument();
    expect(screen.getByText("All-Time Net Income")).toBeInTheDocument();
  });

  it("displays formatted currency values", () => {
    renderWithProviders(<PropertySummaryCards {...defaultProps} />);

    // Check that values are formatted as EUR currency (Finnish locale uses space as thousand separator)
    expect(screen.getByText(/12.*000.*€/)).toBeInTheDocument();
    expect(screen.getByText(/8.*500.*€/)).toBeInTheDocument();
    expect(screen.getByText(/45.*000.*€/)).toBeInTheDocument();
    expect(screen.getByText(/3.*500.*€/)).toBeInTheDocument();
  });

  it("shows skeleton loaders when loading", () => {
    renderWithProviders(<PropertySummaryCards {...defaultProps} loading={true} />);

    // Labels should still be visible
    expect(screen.getByText("Current Year Income")).toBeInTheDocument();

    // Values should be replaced with skeletons (currency values not shown)
    expect(screen.queryByText(/12.*000.*€/)).not.toBeInTheDocument();
  });

  it("handles zero values correctly", () => {
    renderWithProviders(
      <PropertySummaryCards
        currentYearIncome={0}
        currentYearExpenses={0}
        allTimeBalance={0}
        allTimeNetIncome={0}
      />
    );

    // Should show 0,00 € for all values (Finnish locale format)
    const zeroValues = screen.getAllByText(/0,00.*€/);
    expect(zeroValues.length).toBe(4);
  });

  it("handles negative values correctly", () => {
    renderWithProviders(
      <PropertySummaryCards
        currentYearIncome={5000}
        currentYearExpenses={8000}
        allTimeBalance={-3000}
        allTimeNetIncome={-2500}
      />
    );

    // Should show negative values with minus sign (Finnish locale uses − not -)
    expect(screen.getByText(/−3.*000.*€/)).toBeInTheDocument();
    expect(screen.getByText(/−2.*500.*€/)).toBeInTheDocument();
  });
});
