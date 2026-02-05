import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import FormPageTemplate from "./FormPageTemplate";

describe("FormPageTemplate", () => {
  it("renders children content", () => {
    renderWithProviders(
      <FormPageTemplate translationPrefix="settings">
        <form data-testid="child-form">
          <input type="text" />
        </form>
      </FormPageTemplate>
    );

    expect(screen.getByTestId("child-form")).toBeInTheDocument();
  });

  it("renders PageHeader with translation prefix", () => {
    const { container } = renderWithProviders(
      <FormPageTemplate translationPrefix="settings">
        <div>Content</div>
      </FormPageTemplate>
    );

    const h5 = container.querySelector(".MuiTypography-h5");
    expect(h5).toBeInTheDocument();
  });

  it("does not wrap children in Paper component (only header has Paper)", () => {
    const { container } = renderWithProviders(
      <FormPageTemplate translationPrefix="settings">
        <div data-testid="child-content">Content</div>
      </FormPageTemplate>
    );

    const papers = container.querySelectorAll(".MuiPaper-root");
    expect(papers.length).toBe(1);
  });
});
