import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import CardGridPageTemplate from "./CardGridPageTemplate";

describe("CardGridPageTemplate", () => {
  it("renders children content", () => {
    renderWithProviders(
      <CardGridPageTemplate translationPrefix="property">
        <div data-testid="child-content">Test Content</div>
      </CardGridPageTemplate>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders PageHeader with translation prefix", () => {
    const { container } = renderWithProviders(
      <CardGridPageTemplate translationPrefix="property">
        <div>Content</div>
      </CardGridPageTemplate>
    );

    const h5 = container.querySelector(".MuiTypography-h5");
    expect(h5).toBeInTheDocument();
  });

  it("does not wrap children in Paper component (only header has Paper)", () => {
    const { container } = renderWithProviders(
      <CardGridPageTemplate translationPrefix="property">
        <div data-testid="child-content">Content</div>
      </CardGridPageTemplate>
    );

    const papers = container.querySelectorAll(".MuiPaper-root");
    expect(papers.length).toBe(1);
  });
});
