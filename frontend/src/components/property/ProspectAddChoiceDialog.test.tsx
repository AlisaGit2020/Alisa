import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, server } from "@test-utils";
import { http, HttpResponse } from "msw";
import Cookies from "js-cookie";
import ProspectAddChoiceDialog from "./ProspectAddChoiceDialog";

const API_BASE = "http://localhost:3000";

describe("ProspectAddChoiceDialog", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnManualAdd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up mock auth cookie for ApiClient.getToken()
    Cookies.set("_auth", "mock-test-token");
  });

  afterEach(() => {
    Cookies.remove("_auth");
  });

  const renderDialog = (open = true) => {
    return renderWithProviders(
      <ProspectAddChoiceDialog
        open={open}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onManualAdd={mockOnManualAdd}
      />
    );
  };

  it("renders dialog with title when open", () => {
    renderDialog();
    expect(screen.getByText(/add prospect property/i)).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    renderDialog(false);
    expect(screen.queryByText(/add prospect property/i)).not.toBeInTheDocument();
  });

  it("renders both option cards", () => {
    renderDialog();
    expect(screen.getByText(/import from etuovi/i)).toBeInTheDocument();
    expect(screen.getByText(/fill in form manually/i)).toBeInTheDocument();
  });

  it("shows URL input field in Etuovi section", () => {
    renderDialog();
    expect(screen.getByPlaceholderText(/paste etuovi/i)).toBeInTheDocument();
  });

  it("shows import button", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
  });

  it("calls onManualAdd when manual option is clicked", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByText(/fill in form manually/i));

    expect(mockOnManualAdd).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    renderDialog();

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("disables import button when URL is empty", () => {
    renderDialog();
    const importButton = screen.getByRole("button", { name: /^import$/i });
    expect(importButton).toBeDisabled();
  });

  it("enables import button when valid URL is entered", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "https://www.etuovi.com/kohde/12345");

    const importButton = screen.getByRole("button", { name: /^import$/i });
    expect(importButton).toBeEnabled();
  });

  it("shows loading state during import", async () => {
    server.use(
      http.post(`${API_BASE}/api/import/etuovi/create-prospect`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ id: 1, name: "Test Property" });
      })
    );

    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "https://www.etuovi.com/kohde/12345");

    const importButton = screen.getByRole("button", { name: /^import$/i });
    await user.click(importButton);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("calls onSuccess after successful import", async () => {
    server.use(
      http.post(`${API_BASE}/api/import/etuovi/create-prospect`, () => {
        return HttpResponse.json({ id: 1, name: "Test Property" });
      })
    );

    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "https://www.etuovi.com/kohde/12345");

    const importButton = screen.getByRole("button", { name: /^import$/i });
    await user.click(importButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("shows error toast on failed import", async () => {
    server.use(
      http.post(`${API_BASE}/api/import/etuovi/create-prospect`, () => {
        return HttpResponse.json(
          { message: "Property listing not found" },
          { status: 404 }
        );
      })
    );

    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "https://www.etuovi.com/kohde/99999");

    const importButton = screen.getByRole("button", { name: /^import$/i });
    await user.click(importButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to import/i)).toBeInTheDocument();
    });
  });

  it("validates URL format before submission", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "not-a-valid-url");

    const importButton = screen.getByRole("button", { name: /^import$/i });
    await user.click(importButton);

    expect(screen.getByText(/valid etuovi url/i)).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
