import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test-utils/test-wrapper";
import LoanBalanceChart from "./LoanBalanceChart";

describe("LoanBalanceChart", () => {
  const mockData = [
    { label: "Jan", month: 1, balance: 100000 },
    { label: "Feb", month: 2, balance: 99000 },
    { label: "Mar", month: 3, balance: 98000 },
  ];

  it("renders chart title", () => {
    renderWithProviders(
      <LoanBalanceChart data={mockData} originalLoan={100000} loading={false} />
    );

    expect(screen.getByText("Loan Balance")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading", () => {
    renderWithProviders(
      <LoanBalanceChart data={[]} originalLoan={100000} loading={true} />
    );

    expect(screen.queryByText("Loan Balance")).not.toBeInTheDocument();
  });

  it("shows no data message when no loan data", () => {
    renderWithProviders(
      <LoanBalanceChart data={[]} originalLoan={null} loading={false} />
    );

    expect(screen.getByText("No loan data")).toBeInTheDocument();
  });

  it("displays remaining balance chip", () => {
    renderWithProviders(
      <LoanBalanceChart data={mockData} originalLoan={100000} loading={false} />
    );

    // The chip should show the current (last) balance
    expect(screen.getByText(/98.*000/)).toBeInTheDocument();
  });
});
