import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import ApiClient from "@asset-lib/api-client";
import { UserProvider, useUser } from "./user-context";

const wrapper = ({ children }: { children: ReactNode }) => (
  <UserProvider>{children}</UserProvider>
);

describe("UserContext", () => {
  let mockMe: jest.SpyInstance;

  beforeEach(() => {
    mockMe = jest.spyOn(ApiClient, "me");
  });

  afterEach(() => {
    mockMe.mockRestore();
  });

  it("provides user data to consuming components", async () => {
    const mockUser = { id: 1, firstName: "Test", lastName: "User", email: "test@example.com", isAdmin: false };
    mockMe.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useUser(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(mockMe).toHaveBeenCalledTimes(1);
  });

  it("handles API errors gracefully", async () => {
    mockMe.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("throws error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useUser());
    }).toThrow("useUser must be used within a UserProvider");

    consoleSpy.mockRestore();
  });
});
