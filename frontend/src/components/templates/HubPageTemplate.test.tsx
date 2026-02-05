import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import HubPageTemplate from "./HubPageTemplate";

describe("HubPageTemplate", () => {
  it("renders children content", () => {
    renderWithProviders(
      <HubPageTemplate translationPrefix="accounting">
        <div data-testid="child-content">Navigation Cards</div>
      </HubPageTemplate>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Navigation Cards")).toBeInTheDocument();
  });

  it("renders PageHeader with translation prefix", () => {
    const { container } = renderWithProviders(
      <HubPageTemplate translationPrefix="accounting">
        <div>Content</div>
      </HubPageTemplate>
    );

    const h5 = container.querySelector(".MuiTypography-h5");
    expect(h5).toBeInTheDocument();
  });

  it("does not wrap children in Paper component (only header has Paper)", () => {
    const { container } = renderWithProviders(
      <HubPageTemplate translationPrefix="accounting">
        <div data-testid="child-content">Content</div>
      </HubPageTemplate>
    );

    const papers = container.querySelectorAll(".MuiPaper-root");
    expect(papers.length).toBe(1);
  });
});
