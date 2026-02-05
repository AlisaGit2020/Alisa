import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import DashboardPageTemplate from "./DashboardPageTemplate";

describe("DashboardPageTemplate", () => {
  it("renders children content", () => {
    renderWithProviders(
      <DashboardPageTemplate translationPrefix="dashboard">
        <div data-testid="child-content">Dashboard Widgets</div>
      </DashboardPageTemplate>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Widgets")).toBeInTheDocument();
  });

  it("renders PageHeader with translation prefix", () => {
    const { container } = renderWithProviders(
      <DashboardPageTemplate translationPrefix="dashboard">
        <div>Content</div>
      </DashboardPageTemplate>
    );

    const h5 = container.querySelector(".MuiTypography-h5");
    expect(h5).toBeInTheDocument();
  });

  it("does not wrap children in Paper component (only header has Paper)", () => {
    const { container } = renderWithProviders(
      <DashboardPageTemplate translationPrefix="dashboard">
        <div data-testid="child-content">Content</div>
      </DashboardPageTemplate>
    );

    const papers = container.querySelectorAll(".MuiPaper-root");
    expect(papers.length).toBe(1);
  });
});
