import { screen, act, waitFor, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import { AssetToastProvider, useToast } from "./AssetToastProvider";

function TestComponent() {
  const { showToast } = useToast();

  return (
    <div>
      <button
        onClick={() =>
          showToast({ message: "Success message", severity: "success" })
        }
      >
        Show Success
      </button>
      <button
        onClick={() =>
          showToast({ message: "Error message", severity: "error" })
        }
      >
        Show Error
      </button>
      <button
        onClick={() =>
          showToast({
            message: "Permanent message",
            severity: "warning",
            duration: null,
          })
        }
      >
        Show Permanent
      </button>
      <button
        onClick={() =>
          showToast({
            message: "Top message",
            position: { vertical: "top", horizontal: "center" },
          })
        }
      >
        Show Top
      </button>
    </div>
  );
}

function renderTestComponent() {
  return renderWithProviders(
    <AssetToastProvider>
      <TestComponent />
    </AssetToastProvider>
  );
}

describe("AssetToastProvider", () => {
  it("shows toast when showToast is called", async () => {
    const user = userEvent.setup();
    renderTestComponent();

    await user.click(screen.getByText("Show Success"));

    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-colorSuccess");
  });

  it("shows multiple toasts simultaneously", async () => {
    const user = userEvent.setup();
    renderTestComponent();

    await user.click(screen.getByText("Show Success"));
    await user.click(screen.getByText("Show Error"));

    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("removes toast when closed", async () => {
    const user = userEvent.setup();
    renderTestComponent();

    await user.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success message")).toBeInTheDocument();

    const closeButtons = screen.getAllByRole("button", { name: /close/i });
    await user.click(closeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
    });
  });

  it("auto-removes toast after duration", async () => {
    jest.useFakeTimers();
    renderTestComponent();

    await act(async () => {
      screen.getByText("Show Success").click();
    });

    expect(screen.getByText("Success message")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("permanent toast stays visible", async () => {
    jest.useFakeTimers();
    renderTestComponent();

    await act(async () => {
      screen.getByText("Show Permanent").click();
    });

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    expect(screen.getByText("Permanent message")).toBeInTheDocument();

    jest.useRealTimers();
  });

  it("throws error when useToast is used outside provider", () => {
    const originalError = console.error;
    console.error = jest.fn();

    function InvalidComponent() {
      useToast();
      return null;
    }

    // Use raw render instead of renderWithProviders since renderWithProviders includes AssetToastProvider
    expect(() => {
      render(<InvalidComponent />);
    }).toThrow("useToast must be used within AssetToastProvider");

    console.error = originalError;
  });
});
