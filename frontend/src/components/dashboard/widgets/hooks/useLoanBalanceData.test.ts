import { renderHook, waitFor } from "@testing-library/react";
import { useLoanBalanceData } from "./useLoanBalanceData";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("@asset-lib/api-client", () => ({
  __esModule: true,
  default: {
    getOptions: jest.fn().mockResolvedValue({ headers: {} }),
  },
}));

jest.mock("../../context/DashboardContext", () => ({
  useDashboard: () => ({
    selectedPropertyId: null,
    viewMode: "monthly" as const,
    selectedYear: 2024,
    refreshKey: 0,
  }),
}));

describe("useLoanBalanceData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns loading state initially", () => {
    mockedAxios.post.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useLoanBalanceData());

    expect(result.current.loading).toBe(true);
  });

  it("returns loan balance data", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        { propertyId: 1, key: "loan_balance", year: 2024, month: 1, value: "99000.00" },
        { propertyId: 1, key: "loan_balance", year: 2024, month: 2, value: "98000.00" },
      ],
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ id: 1, purchaseLoan: 100000 }],
    });

    const { result } = renderHook(() => useLoanBalanceData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.length).toBeGreaterThan(0);
    expect(result.current.originalLoan).toBe(100000);
  });

  it("handles empty data", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: [] });
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useLoanBalanceData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.originalLoan).toBe(0);
  });
});
