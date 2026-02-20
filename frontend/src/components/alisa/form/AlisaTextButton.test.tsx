import { renderWithProviders } from "@test-utils/test-wrapper";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlisaTextButton from "./AlisaTextButton";

describe("AlisaTextButton", () => {
  it("renders with label and button", () => {
    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText("URL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fetch" })).toBeInTheDocument();
  });

  it("button is disabled when value is empty", () => {
    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: "Fetch" })).toBeDisabled();
  });

  it("button is enabled when value has content", () => {
    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value="https://example.com"
        onChange={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: "Fetch" })).toBeEnabled();
  });

  it("calls onButtonClick when button is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value="https://example.com"
        onChange={() => {}}
        onButtonClick={handleClick}
      />
    );

    await user.click(screen.getByRole("button", { name: "Fetch" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("calls onChange when text is entered", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value=""
        onChange={handleChange}
      />
    );

    await user.type(screen.getByLabelText("URL"), "test");
    expect(handleChange).toHaveBeenCalled();
  });

  it("shows loading spinner when loading", () => {
    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value="https://example.com"
        onChange={() => {}}
        loading={true}
      />
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fetch/i })).toBeDisabled();
  });

  it("button is disabled when disabled prop is true", () => {
    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value="https://example.com"
        onChange={() => {}}
        disabled={true}
      />
    );

    expect(screen.getByRole("button", { name: "Fetch" })).toBeDisabled();
  });

  it("shows placeholder text", () => {
    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value=""
        placeholder="Enter URL here"
        onChange={() => {}}
      />
    );

    expect(screen.getByPlaceholderText("Enter URL here")).toBeInTheDocument();
  });

  it("shows error state with helper text", () => {
    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value=""
        error={true}
        helperText="Invalid URL"
        onChange={() => {}}
      />
    );

    expect(screen.getByText("Invalid URL")).toBeInTheDocument();
  });

  it("shows clear button when value is not empty", () => {
    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value="https://example.com"
        onChange={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: "clear" })).toBeInTheDocument();
  });

  it("does not show clear button when value is empty", () => {
    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.queryByRole("button", { name: "clear" })).not.toBeInTheDocument();
  });

  it("clears value when clear button is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value="https://example.com"
        onChange={handleChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "clear" }));
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { value: "" } })
    );
  });

  it("calls onClear when clear button is clicked and onClear is provided", async () => {
    const user = userEvent.setup();
    const handleClear = jest.fn();

    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value="https://example.com"
        onChange={() => {}}
        onClear={handleClear}
      />
    );

    await user.click(screen.getByRole("button", { name: "clear" }));
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("does not show clear button when clearable is false", () => {
    renderWithProviders(
      <AlisaTextButton
        label="URL"
        buttonLabel="Fetch"
        value="https://example.com"
        clearable={false}
        onChange={() => {}}
      />
    );

    expect(screen.queryByRole("button", { name: "clear" })).not.toBeInTheDocument();
  });
});
