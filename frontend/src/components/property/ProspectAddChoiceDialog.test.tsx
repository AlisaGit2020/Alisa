import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, server } from "@test-utils/index";
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

  describe("Basic Rendering", () => {
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
      // Should have import from listing option (unified for Etuovi/Oikotie)
      expect(screen.getByText(/import from/i)).toBeInTheDocument();
      expect(screen.getByText(/fill in form manually/i)).toBeInTheDocument();
    });

    it("shows URL input field in import section", () => {
      renderDialog();
      // Should have a URL input with placeholder
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("shows import button", () => {
      renderDialog();
      expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
    });
  });

  describe("Source Selector", () => {
    it("source selector appears in import section", () => {
      renderDialog();
      // Should have a radiogroup for source selection
      expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    });

    it("can switch between Etuovi and Oikotie sources", async () => {
      const user = userEvent.setup();
      renderDialog();

      // Initially should show Oikotie placeholder (default)
      expect(screen.getByPlaceholderText(/oikotie/i)).toBeInTheDocument();

      // Select Etuovi radio
      const etuoviRadio = screen.getByRole("radio", { name: /etuovi/i });
      await user.click(etuoviRadio);

      // Now should show Etuovi placeholder
      expect(screen.getByPlaceholderText(/etuovi/i)).toBeInTheDocument();
    });

    it("source selector changes URL placeholder text", async () => {
      const user = userEvent.setup();
      renderDialog();

      // Initially Oikotie placeholder (default)
      const urlInput = screen.getByRole("textbox");
      expect(urlInput).toHaveAttribute("placeholder", expect.stringMatching(/oikotie/i));

      // Switch to Etuovi
      const etuoviRadio = screen.getByRole("radio", { name: /etuovi/i });
      await user.click(etuoviRadio);

      // Placeholder should change
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "placeholder",
        expect.stringMatching(/etuovi/i)
      );
    });
  });

  describe("Manual Add Option", () => {
    it("calls onManualAdd when manual option is clicked", async () => {
      const user = userEvent.setup();
      renderDialog();

      await user.click(screen.getByText(/fill in form manually/i));

      expect(mockOnManualAdd).toHaveBeenCalled();
    });
  });

  describe("Close Behavior", () => {
    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      renderDialog();

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Button States", () => {
    it("disables import button when URL is empty", () => {
      renderDialog();
      const importButton = screen.getByRole("button", { name: /^import$/i });
      expect(importButton).toBeDisabled();
    });

    it("enables import button when valid URL is entered", async () => {
      const user = userEvent.setup();
      renderDialog();

      const input = screen.getByRole("textbox");
      await user.type(input, "https://asunnot.oikotie.fi/myytavat-asunnot/12345");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      expect(importButton).toBeEnabled();
    });
  });

  describe("Etuovi Import", () => {
    it("shows loading state during Etuovi import", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/create-prospect`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderDialog();

      // Switch to Etuovi (Oikotie is default)
      const etuoviRadio = screen.getByRole("radio", { name: /etuovi/i });
      await user.click(etuoviRadio);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://www.etuovi.com/kohde/12345");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("calls onSuccess after successful Etuovi import", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/create-prospect`, () => {
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderDialog();

      // Switch to Etuovi (Oikotie is default)
      const etuoviRadio = screen.getByRole("radio", { name: /etuovi/i });
      await user.click(etuoviRadio);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://www.etuovi.com/kohde/12345");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("shows error toast on failed Etuovi import", async () => {
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

      // Switch to Etuovi (Oikotie is default)
      const etuoviRadio = screen.getByRole("radio", { name: /etuovi/i });
      await user.click(etuoviRadio);

      const input = screen.getByRole("textbox");
      await user.type(input, "https://www.etuovi.com/kohde/99999");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to import/i)).toBeInTheDocument();
      });
    });

    it("validates Etuovi URL format before submission", async () => {
      const user = userEvent.setup();
      renderDialog();

      // Switch to Etuovi (Oikotie is default)
      const etuoviRadio = screen.getByRole("radio", { name: /etuovi/i });
      await user.click(etuoviRadio);

      const input = screen.getByRole("textbox");
      await user.type(input, "not-a-valid-url");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      expect(screen.getByText(/valid.*etuovi/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Oikotie Import", () => {
    it("shows loading state during Oikotie import", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/create-prospect`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderDialog();

      // Oikotie is default, no need to switch
      const input = screen.getByRole("textbox");
      await user.type(input, "https://asunnot.oikotie.fi/myytavat-asunnot/12345");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("calls onSuccess after successful Oikotie import", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/create-prospect`, () => {
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderDialog();

      // Oikotie is default, no need to switch
      const input = screen.getByRole("textbox");
      await user.type(input, "https://asunnot.oikotie.fi/myytavat-asunnot/12345");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("shows error toast on failed Oikotie import", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/create-prospect`, () => {
          return HttpResponse.json(
            { message: "Property listing not found" },
            { status: 404 }
          );
        })
      );

      const user = userEvent.setup();
      renderDialog();

      // Oikotie is default, no need to switch
      const input = screen.getByRole("textbox");
      await user.type(input, "https://asunnot.oikotie.fi/myytavat-asunnot/99999");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to import/i)).toBeInTheDocument();
      });
    });

    it("validates Oikotie URL format before submission", async () => {
      const user = userEvent.setup();
      renderDialog();

      // Oikotie is default, no need to switch
      const input = screen.getByRole("textbox");
      await user.type(input, "not-a-valid-url");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      expect(screen.getByText(/valid.*oikotie/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Rent Estimation", () => {
    it("shows rent estimation input field", () => {
      renderDialog();
      expect(screen.getByLabelText(/expected rent/i)).toBeInTheDocument();
    });

    it("sends rent estimation with Etuovi import request", async () => {
      let capturedBody: { url: string; monthlyRent?: number } | null = null;
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/create-prospect`, async ({ request }) => {
          capturedBody = await request.json() as { url: string; monthlyRent?: number };
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderDialog();

      // Switch to Etuovi (Oikotie is default)
      const etuoviRadio = screen.getByRole("radio", { name: /etuovi/i });
      await user.click(etuoviRadio);

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      const rentInput = screen.getByLabelText(/expected rent/i);
      await user.type(rentInput, "850");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      expect(capturedBody).toEqual({
        url: "https://www.etuovi.com/kohde/12345",
        monthlyRent: 850,
      });
    });

    it("sends rent estimation with Oikotie import request", async () => {
      let capturedBody: { url: string; monthlyRent?: number } | null = null;
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/create-prospect`, async ({ request }) => {
          capturedBody = await request.json() as { url: string; monthlyRent?: number };
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderDialog();

      // Oikotie is default, no need to switch
      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://asunnot.oikotie.fi/myytavat-asunnot/12345");

      const rentInput = screen.getByLabelText(/expected rent/i);
      await user.type(rentInput, "950");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      expect(capturedBody).toEqual({
        url: "https://asunnot.oikotie.fi/myytavat-asunnot/12345",
        monthlyRent: 950,
      });
    });

    it("sends import request without rent when rent field is empty", async () => {
      let capturedBody: { url: string; monthlyRent?: number } | null = null;
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/create-prospect`, async ({ request }) => {
          capturedBody = await request.json() as { url: string; monthlyRent?: number };
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderDialog();

      // Oikotie is default
      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://asunnot.oikotie.fi/myytavat-asunnot/12345");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      expect(capturedBody).toEqual({
        url: "https://asunnot.oikotie.fi/myytavat-asunnot/12345",
      });
    });
  });
});
