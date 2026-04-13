import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test-utils/test-wrapper";
import LoanBalanceChart from "./LoanBalanceChart";

jest.mock("./hooks/useLoanBalanceData", () => ({
  useLoanBalanceData: () => ({
    data: [
      { label: "Jan", month: 1, balance: 99000 },
      { label: "Feb", month: 2, balance: 98000 },
    ],
    originalLoan: 100000,
    currentBalance: 98000,
    loading: false,
    error: null,
  }),
}));

describe("LoanBalanceChart (Dashboard)", () => {
  it("renders chart title", () => {
    renderWithProviders(<LoanBalanceChart />);

    expect(screen.getByText("Loan Balance")).toBeInTheDocument();
  });

  it("displays current balance chip", () => {
    renderWithProviders(<LoanBalanceChart />);

    expect(screen.getByText(/98.*000/)).toBeInTheDocument();
  });
});
