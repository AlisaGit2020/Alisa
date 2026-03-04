import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, server } from "@test-utils/index";
import { http, HttpResponse } from "msw";
import Cookies from "js-cookie";
import ListingImportInput from "./ListingImportInput";

const API_BASE = "http://localhost:3000";

// Mock property data returned by fetch endpoints
const mockPropertyData = {
  url: "https://www.etuovi.com/kohde/12345",
  deptFreePrice: 150000,
  deptShare: 20000,
  apartmentSize: 45,
  maintenanceFee: 180,
  waterCharge: 25,
  chargeForFinancialCosts: 50,
  address: "Testikatu 1, Helsinki",
};

const mockOikotiePropertyData = {
  url: "https://asunnot.oikotie.fi/myytavat-asunnot/12345",
  deptFreePrice: 200000,
  deptShare: 30000,
  apartmentSize: 60,
  maintenanceFee: 250,
  waterCharge: 30,
  chargeForFinancialCosts: 75,
  address: "Oikotiekatu 2, Espoo",
};

describe("ListingImportInput", () => {
  const mockOnSuccess = jest.fn();
  const mockOnDataFetched = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up mock auth cookie for ApiClient.getToken()
    Cookies.set("_auth", "mock-test-token");
  });

  afterEach(() => {
    Cookies.remove("_auth");
  });

  describe("Rendering", () => {
    it("renders with default source selection (Etuovi)", () => {
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      // Should have a source selector with Etuovi selected by default
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      // Etuovi placeholder should be visible
      expect(screen.getByPlaceholderText(/etuovi/i)).toBeInTheDocument();
    });

    it("renders URL input field", () => {
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      expect(urlInput).toBeInTheDocument();
    });

    it("renders import button in prospect mode", () => {
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
    });

    it("renders fetch button in fetch mode", () => {
      renderWithProviders(
        <ListingImportInput mode="fetch" onDataFetched={mockOnDataFetched} />
      );

      expect(screen.getByRole("button", { name: /fetch|search/i })).toBeInTheDocument();
    });

    it("shows rent input when showRentInput is true", () => {
      renderWithProviders(
        <ListingImportInput
          mode="prospect"
          onSuccess={mockOnSuccess}
          showRentInput={true}
        />
      );

      expect(screen.getByLabelText(/rent/i)).toBeInTheDocument();
    });
  });

  describe("Source Selector", () => {
    it("source selector changes URL placeholder text to Oikotie", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      // Initially should show Etuovi placeholder
      expect(screen.getByPlaceholderText(/etuovi/i)).toBeInTheDocument();

      // Open source selector and select Oikotie
      const sourceSelect = screen.getByRole("combobox");
      await user.click(sourceSelect);

      const oikotieOption = screen.getByRole("option", { name: /oikotie/i });
      await user.click(oikotieOption);

      // Now should show Oikotie placeholder
      expect(screen.getByPlaceholderText(/oikotie/i)).toBeInTheDocument();
    });

    it("source selector shows both Etuovi and Oikotie options", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      // Open source selector
      const sourceSelect = screen.getByRole("combobox");
      await user.click(sourceSelect);

      // Should show both options
      expect(screen.getByRole("option", { name: /etuovi/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /oikotie/i })).toBeInTheDocument();
    });
  });

  describe("URL Validation", () => {
    it("validates Etuovi URLs correctly - accepts valid URL", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/create-prospect`, () => {
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      // Should not show validation error
      expect(screen.queryByText(/valid.*url/i)).not.toBeInTheDocument();

      // Should call API and success callback
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("validates Etuovi URLs correctly - rejects invalid URL", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://not-etuovi.com/something");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      // Should show validation error
      expect(screen.getByText(/valid.*etuovi/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("validates Oikotie URLs correctly - accepts valid URL", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/create-prospect`, () => {
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      // Switch to Oikotie
      const sourceSelect = screen.getByRole("combobox");
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole("option", { name: /oikotie/i });
      await user.click(oikotieOption);

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://asunnot.oikotie.fi/myytavat-asunnot/12345");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      // Should not show validation error
      expect(screen.queryByText(/valid.*url/i)).not.toBeInTheDocument();

      // Should call API and success callback
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("validates Oikotie URLs correctly - rejects invalid URL", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      // Switch to Oikotie
      const sourceSelect = screen.getByRole("combobox");
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole("option", { name: /oikotie/i });
      await user.click(oikotieOption);

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://not-oikotie.com/something");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      // Should show validation error
      expect(screen.getByText(/valid.*oikotie/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("shows error for invalid URL after submit attempt", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "not-a-valid-url");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      // Should show validation error
      expect(screen.getByText(/valid/i)).toBeInTheDocument();
    });

    it("clears validation error when URL changes", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "not-a-valid-url");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      // Should show validation error
      expect(screen.getByText(/valid/i)).toBeInTheDocument();

      // Clear and type new URL
      await user.clear(urlInput);
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      // Error should be cleared
      expect(screen.queryByText(/valid.*etuovi/i)).not.toBeInTheDocument();
    });
  });

  describe("Button States", () => {
    it("import button disabled when URL is empty", () => {
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const importButton = screen.getByRole("button", { name: /import/i });
      expect(importButton).toBeDisabled();
    });

    it("import button enabled when URL has value", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      const importButton = screen.getByRole("button", { name: /import/i });
      expect(importButton).toBeEnabled();
    });
  });

  describe("Loading State", () => {
    it("loading state disables all inputs", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/create-prospect`, async () => {
          // Delay response to test loading state
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      // During loading, inputs should be disabled
      expect(urlInput).toBeDisabled();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("loading prop from parent disables all inputs", () => {
      renderWithProviders(
        <ListingImportInput
          mode="prospect"
          onSuccess={mockOnSuccess}
          loading={true}
        />
      );

      const urlInput = screen.getByRole("textbox");
      expect(urlInput).toBeDisabled();
    });

    it("disabled prop disables all inputs", () => {
      renderWithProviders(
        <ListingImportInput
          mode="prospect"
          onSuccess={mockOnSuccess}
          disabled={true}
        />
      );

      const urlInput = screen.getByRole("textbox");
      expect(urlInput).toBeDisabled();
    });
  });

  describe("Prospect Mode (create-prospect)", () => {
    it("calls onSuccess after successful import", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/create-prospect`, () => {
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("calls correct Etuovi API endpoint for prospect mode", async () => {
      let apiCalled = false;
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/create-prospect`, () => {
          apiCalled = true;
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(apiCalled).toBe(true);
      });
    });

    it("calls correct Oikotie API endpoint for prospect mode", async () => {
      let apiCalled = false;
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/create-prospect`, () => {
          apiCalled = true;
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      // Switch to Oikotie
      const sourceSelect = screen.getByRole("combobox");
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole("option", { name: /oikotie/i });
      await user.click(oikotieOption);

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://asunnot.oikotie.fi/myytavat-asunnot/12345");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(apiCalled).toBe(true);
      });
    });

    it("sends monthly rent with import request when provided", async () => {
      let capturedBody: { url: string; monthlyRent?: number } | null = null;
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/create-prospect`, async ({ request }) => {
          capturedBody = await request.json() as { url: string; monthlyRent?: number };
          return HttpResponse.json({ id: 1, name: "Test Property" });
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput
          mode="prospect"
          onSuccess={mockOnSuccess}
          showRentInput={true}
        />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      const rentInput = screen.getByLabelText(/rent/i);
      await user.type(rentInput, "850");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      expect(capturedBody).toEqual({
        url: "https://www.etuovi.com/kohde/12345",
        monthlyRent: 850,
      });
    });
  });

  describe("Fetch Mode (data fetching)", () => {
    it("calls onDataFetched with correct data structure for Etuovi", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/fetch`, () => {
          return HttpResponse.json(mockPropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="fetch" onDataFetched={mockOnDataFetched} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      const fetchButton = screen.getByRole("button", { name: /fetch|search/i });
      await user.click(fetchButton);

      await waitFor(() => {
        expect(mockOnDataFetched).toHaveBeenCalledWith(mockPropertyData);
      });
    });

    it("calls onDataFetched with correct data structure for Oikotie", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/fetch`, () => {
          return HttpResponse.json(mockOikotiePropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="fetch" onDataFetched={mockOnDataFetched} />
      );

      // Switch to Oikotie
      const sourceSelect = screen.getByRole("combobox");
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole("option", { name: /oikotie/i });
      await user.click(oikotieOption);

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://asunnot.oikotie.fi/myytavat-asunnot/12345");

      const fetchButton = screen.getByRole("button", { name: /fetch|search/i });
      await user.click(fetchButton);

      await waitFor(() => {
        expect(mockOnDataFetched).toHaveBeenCalledWith(mockOikotiePropertyData);
      });
    });

    it("calls correct Etuovi API endpoint for fetch mode", async () => {
      let apiCalled = false;
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/fetch`, () => {
          apiCalled = true;
          return HttpResponse.json(mockPropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="fetch" onDataFetched={mockOnDataFetched} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      const fetchButton = screen.getByRole("button", { name: /fetch|search/i });
      await user.click(fetchButton);

      await waitFor(() => {
        expect(apiCalled).toBe(true);
      });
    });

    it("calls correct Oikotie API endpoint for fetch mode", async () => {
      let apiCalled = false;
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/fetch`, () => {
          apiCalled = true;
          return HttpResponse.json(mockOikotiePropertyData);
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="fetch" onDataFetched={mockOnDataFetched} />
      );

      // Switch to Oikotie
      const sourceSelect = screen.getByRole("combobox");
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole("option", { name: /oikotie/i });
      await user.click(oikotieOption);

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://asunnot.oikotie.fi/myytavat-asunnot/12345");

      const fetchButton = screen.getByRole("button", { name: /fetch|search/i });
      await user.click(fetchButton);

      await waitFor(() => {
        expect(apiCalled).toBe(true);
      });
    });
  });

  describe("Error Handling", () => {
    it("shows error toast on API failure (404)", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/create-prospect`, () => {
          return HttpResponse.json(
            { message: "Property listing not found" },
            { status: 404 }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/99999");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("shows error toast on API failure (500)", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/create-prospect`, () => {
          return HttpResponse.json(
            { message: "Internal server error" },
            { status: 500 }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/12345");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("shows error toast on Oikotie API failure", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/oikotie/create-prospect`, () => {
          return HttpResponse.json(
            { message: "Property listing not found" },
            { status: 404 }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="prospect" onSuccess={mockOnSuccess} />
      );

      // Switch to Oikotie
      const sourceSelect = screen.getByRole("combobox");
      await user.click(sourceSelect);
      const oikotieOption = screen.getByRole("option", { name: /oikotie/i });
      await user.click(oikotieOption);

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://asunnot.oikotie.fi/myytavat-asunnot/99999");

      const importButton = screen.getByRole("button", { name: /import/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("shows error toast on fetch mode API failure", async () => {
      server.use(
        http.post(`${API_BASE}/api/import/etuovi/fetch`, () => {
          return HttpResponse.json(
            { message: "Property listing not found" },
            { status: 404 }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(
        <ListingImportInput mode="fetch" onDataFetched={mockOnDataFetched} />
      );

      const urlInput = screen.getByRole("textbox");
      await user.type(urlInput, "https://www.etuovi.com/kohde/99999");

      const fetchButton = screen.getByRole("button", { name: /fetch|search/i });
      await user.click(fetchButton);

      await waitFor(() => {
        expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
      });

      expect(mockOnDataFetched).not.toHaveBeenCalled();
    });
  });
});
