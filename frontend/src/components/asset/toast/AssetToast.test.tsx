import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithProviders } from "@test-utils/test-wrapper";
import AssetToast from "./AssetToast";

describe("AssetToast", () => {
  it("renders with message when open", () => {
    renderWithProviders(
      <AssetToast open={true} message="Test message" onClose={jest.fn()} />
    );

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithProviders(
      <AssetToast open={false} message="Test message" onClose={jest.fn()} />
    );

    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });

  it("renders with info severity by default", () => {
    renderWithProviders(
      <AssetToast open={true} message="Info message" onClose={jest.fn()} />
    );

    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-colorInfo");
  });

  it("renders with success severity", () => {
    renderWithProviders(
      <AssetToast
        open={true}
        message="Success message"
        severity="success"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-colorSuccess");
  });

  it("renders with error severity", () => {
    renderWithProviders(
      <AssetToast
        open={true}
        message="Error message"
        severity="error"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-colorError");
  });

  it("renders with warning severity", () => {
    renderWithProviders(
      <AssetToast
        open={true}
        message="Warning message"
        severity="warning"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveClass("MuiAlert-colorWarning");
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    renderWithProviders(
      <AssetToast open={true} message="Test message" onClose={mockOnClose} />
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("auto-hides after default duration (5000ms)", async () => {
    jest.useFakeTimers();
    const mockOnClose = jest.fn();

    renderWithProviders(
      <AssetToast open={true} message="Test message" onClose={mockOnClose} />
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("auto-hides after custom duration", async () => {
    jest.useFakeTimers();
    const mockOnClose = jest.fn();

    renderWithProviders(
      <AssetToast
        open={true}
        message="Test message"
        duration={2000}
        onClose={mockOnClose}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(1999);
    });
    expect(mockOnClose).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("stays visible when duration is null", async () => {
    jest.useFakeTimers();
    const mockOnClose = jest.fn();

    renderWithProviders(
      <AssetToast
        open={true}
        message="Permanent toast"
        duration={null}
        onClose={mockOnClose}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(screen.getByText("Permanent toast")).toBeInTheDocument();

    jest.useRealTimers();
  });

  it("renders with custom action", () => {
    renderWithProviders(
      <AssetToast
        open={true}
        message="Test message"
        onClose={jest.fn()}
        action={<button data-testid="custom-action">Undo</button>}
      />
    );

    expect(screen.getByTestId("custom-action")).toBeInTheDocument();
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });
});
