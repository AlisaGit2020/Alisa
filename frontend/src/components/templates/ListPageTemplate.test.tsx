import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import ListPageTemplate from "./ListPageTemplate";

describe("ListPageTemplate", () => {
  it("renders children content", () => {
    renderWithProviders(
      <ListPageTemplate translationPrefix="property">
        <div data-testid="child-content">Test Content</div>
      </ListPageTemplate>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders PageHeader with translation prefix", () => {
    const { container } = renderWithProviders(
      <ListPageTemplate translationPrefix="property">
        <div>Content</div>
      </ListPageTemplate>
    );

    const h5 = container.querySelector(".MuiTypography-h5");
    expect(h5).toBeInTheDocument();
  });

  it("does not wrap children in Paper component (only header has Paper)", () => {
    const { container } = renderWithProviders(
      <ListPageTemplate translationPrefix="property">
        <div data-testid="child-content">Content</div>
      </ListPageTemplate>
    );

    const papers = container.querySelectorAll(".MuiPaper-root");
    expect(papers.length).toBe(1);
  });
});
