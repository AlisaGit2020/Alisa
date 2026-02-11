import { renderWithProviders, screen, waitFor } from "@test-utils/test-wrapper";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import BetaSignupForm from "./BetaSignupForm";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const API_BASE = "http://localhost:3000";

const localServer = setupServer();

beforeAll(() => localServer.listen({ onUnhandledRequest: "warn" }));
afterEach(() => localServer.resetHandlers());
afterAll(() => localServer.close());

describe("BetaSignupForm", () => {
  describe("Rendering", () => {
    it("renders with title and subtitle", () => {
      renderWithProviders(<BetaSignupForm />);

      expect(screen.getByText("Join the Beta")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Be among the first to try Alisa. Sign up for early access."
        )
      ).toBeInTheDocument();
    });

    it("renders email input field", () => {
      renderWithProviders(<BetaSignupForm />);

      expect(screen.getByLabelText(/Enter your email/)).toBeInTheDocument();
    });

    it("renders submit button", () => {
      renderWithProviders(<BetaSignupForm />);

      expect(
        screen.getByRole("button", { name: "Sign Up for Beta" })
      ).toBeInTheDocument();
    });

    it("renders privacy note", () => {
      renderWithProviders(<BetaSignupForm />);

      expect(
        screen.getByText(/We respect your privacy/)
      ).toBeInTheDocument();
    });
  });

  describe("Form submission", () => {
    it("submits email and shows success message", async () => {
      const user = userEvent.setup();

      localServer.use(
        http.post(`${API_BASE}/beta/signup`, () => {
          return HttpResponse.json({
            success: true,
            message: "Successfully signed up for beta.",
          });
        })
      );

      renderWithProviders(<BetaSignupForm />);

      const emailInput = screen.getByLabelText(/Enter your email/);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", {
        name: "Sign Up for Beta",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Thanks for signing up/)
        ).toBeInTheDocument();
      });
    });

    it("shows error toast for duplicate email (409)", async () => {
      const user = userEvent.setup();

      localServer.use(
        http.post(`${API_BASE}/beta/signup`, () => {
          return HttpResponse.json(
            { message: "This email is already registered." },
            { status: 409 }
          );
        })
      );

      renderWithProviders(<BetaSignupForm />);

      const emailInput = screen.getByLabelText(/Enter your email/);
      await user.type(emailInput, "duplicate@example.com");

      const submitButton = screen.getByRole("button", {
        name: "Sign Up for Beta",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("This email is already registered.")
        ).toBeInTheDocument();
      });
    });

    it("shows generic error toast for server error (500)", async () => {
      const user = userEvent.setup();

      localServer.use(
        http.post(`${API_BASE}/beta/signup`, () => {
          return HttpResponse.json(
            { message: "Internal server error" },
            { status: 500 }
          );
        })
      );

      renderWithProviders(<BetaSignupForm />);

      const emailInput = screen.getByLabelText(/Enter your email/);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", {
        name: "Sign Up for Beta",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Something went wrong. Please try again.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Loading state", () => {
    it("disables button during submission", async () => {
      const user = userEvent.setup();

      localServer.use(
        http.post(`${API_BASE}/beta/signup`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({
            success: true,
            message: "Successfully signed up for beta.",
          });
        })
      );

      renderWithProviders(<BetaSignupForm />);

      const emailInput = screen.getByLabelText(/Enter your email/);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", {
        name: "Sign Up for Beta",
      });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText(/Thanks for signing up/)).toBeInTheDocument();
      });
    });

    it("disables email input during submission", async () => {
      const user = userEvent.setup();

      localServer.use(
        http.post(`${API_BASE}/beta/signup`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({
            success: true,
            message: "Successfully signed up for beta.",
          });
        })
      );

      renderWithProviders(<BetaSignupForm />);

      const emailInput = screen.getByLabelText(/Enter your email/);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", {
        name: "Sign Up for Beta",
      });
      await user.click(submitButton);

      expect(emailInput).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText(/Thanks for signing up/)).toBeInTheDocument();
      });
    });
  });

  describe("Success state", () => {
    it("replaces form with success message after submission", async () => {
      const user = userEvent.setup();

      localServer.use(
        http.post(`${API_BASE}/beta/signup`, () => {
          return HttpResponse.json({
            success: true,
            message: "Successfully signed up for beta.",
          });
        })
      );

      renderWithProviders(<BetaSignupForm />);

      const emailInput = screen.getByLabelText(/Enter your email/);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", {
        name: "Sign Up for Beta",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Thanks for signing up/)).toBeInTheDocument();
      });

      // Form should be replaced with success message
      expect(screen.queryByLabelText(/Enter your email/)).not.toBeInTheDocument();
    });

    it("shows success alert after submission", async () => {
      const user = userEvent.setup();

      localServer.use(
        http.post(`${API_BASE}/beta/signup`, () => {
          return HttpResponse.json({
            success: true,
            message: "Successfully signed up for beta.",
          });
        })
      );

      renderWithProviders(<BetaSignupForm />);

      const emailInput = screen.getByLabelText(/Enter your email/);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", {
        name: "Sign Up for Beta",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });
  });

  describe("Input validation", () => {
    it("requires email input (HTML5 validation)", () => {
      renderWithProviders(<BetaSignupForm />);

      const emailInput = screen.getByLabelText(/Enter your email/);
      expect(emailInput).toHaveAttribute("required");
    });

    it("has email type for HTML5 validation", () => {
      renderWithProviders(<BetaSignupForm />);

      const emailInput = screen.getByLabelText(/Enter your email/);
      expect(emailInput).toHaveAttribute("type", "email");
    });
  });

  describe("Error recovery", () => {
    it("keeps form visible after error to allow retry", async () => {
      const user = userEvent.setup();

      localServer.use(
        http.post(`${API_BASE}/beta/signup`, () => {
          return HttpResponse.json(
            { message: "This email is already registered." },
            { status: 409 }
          );
        })
      );

      renderWithProviders(<BetaSignupForm />);

      const emailInput = screen.getByLabelText(/Enter your email/);
      await user.type(emailInput, "duplicate@example.com");

      const submitButton = screen.getByRole("button", {
        name: "Sign Up for Beta",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("This email is already registered.")
        ).toBeInTheDocument();
      });

      // Form should still be visible for retry
      expect(screen.getByLabelText(/Enter your email/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sign Up for Beta" })
      ).toBeInTheDocument();
    });
  });
});
