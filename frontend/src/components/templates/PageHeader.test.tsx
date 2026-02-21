import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  describe("expandable help text", () => {
    it("does not show 'Read more' link when moreDetailsKey is not provided", () => {
      renderWithProviders(<PageHeader translationPrefix="property" />);

      expect(screen.queryByText("Read more")).not.toBeInTheDocument();
    });

    it("shows 'Read more' link when moreDetailsKey is provided", () => {
      renderWithProviders(
        <PageHeader
          translationPrefix="accounting"
          titleKey="expensesPageTitle"
          descriptionKey="expensesPageDescription"
          moreDetailsKey="expensesPageMoreDetails"
        />
      );

      expect(screen.getByText("Read more")).toBeInTheDocument();
    });

    it("expands to show details when 'Read more' is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PageHeader
          translationPrefix="accounting"
          titleKey="expensesPageTitle"
          descriptionKey="expensesPageDescription"
          moreDetailsKey="expensesPageMoreDetails"
        />
      );

      // Details should not be visible initially (collapsed state)
      // accounting namespace is not in test-i18n, so it returns the key
      const collapsedContent = screen.getByText("expensesPageMoreDetails");
      expect(collapsedContent.closest(".MuiCollapse-hidden")).toBeTruthy();

      // Click "Read more"
      await user.click(screen.getByText("Read more"));

      // Details should now be visible (not in collapsed state)
      expect(collapsedContent.closest(".MuiCollapse-hidden")).toBeFalsy();
    });

    it("shows 'Show less' when expanded and collapses on click", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PageHeader
          translationPrefix="accounting"
          titleKey="expensesPageTitle"
          descriptionKey="expensesPageDescription"
          moreDetailsKey="expensesPageMoreDetails"
        />
      );

      // Click to expand
      await user.click(screen.getByText("Read more"));

      // Should show "Show less"
      expect(screen.getByText("Show less")).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByText("Show less"));

      // Should show "Read more" again
      expect(screen.getByText("Read more")).toBeInTheDocument();

      // Details should be hidden again (wait for collapse animation)
      const collapsedContent = screen.getByText("expensesPageMoreDetails");
      await waitFor(() => {
        expect(collapsedContent.closest(".MuiCollapse-hidden")).toBeTruthy();
      });
    });
  });
});
