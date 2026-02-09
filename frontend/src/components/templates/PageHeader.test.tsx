import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import PageHeader from "./PageHeader";

describe("PageHeader", () => {
  it("renders title and description from translation prefix", () => {
    renderWithProviders(<PageHeader translationPrefix="property" />);

    expect(screen.getByRole("heading", { level: 5 })).toBeInTheDocument();
    // The translation resolves to the actual text, not the key
    expect(screen.getByText("Properties")).toBeInTheDocument();
  });

  it("renders within a Paper component", () => {
    const { container } = renderWithProviders(
      <PageHeader translationPrefix="property" />
    );

    const paper = container.querySelector(".MuiPaper-root");
    expect(paper).toBeInTheDocument();
  });

  it("renders with correct typography variants", () => {
    const { container } = renderWithProviders(
      <PageHeader translationPrefix="property" />
    );

    const h5 = container.querySelector(".MuiTypography-h5");
    expect(h5).toBeInTheDocument();

    const body1 = container.querySelector(".MuiTypography-body1");
    expect(body1).toBeInTheDocument();
  });
});
