import { renderHook, act } from "@testing-library/react";
import { TFunction } from "i18next";
import { useDeletePreValidation, DeletePreValidationItem } from "./useDeletePreValidation";

interface TestItem extends DeletePreValidationItem {
  name: string;
}

describe("useDeletePreValidation", () => {
  const mockShowToast = jest.fn();
  const mockT = jest.fn((key: string) => key) as unknown as TFunction;
  const mockOnDelete = jest.fn();
  const mockOnBulkDelete = jest.fn();
  const mockOnRefresh = jest.fn();
  const mockSetSelectedIds = jest.fn();

  const defaultOptions = {
    data: [] as TestItem[],
    showToast: mockShowToast,
    t: mockT,
    onDelete: mockOnDelete,
    onBulkDelete: mockOnBulkDelete,
    onRefresh: mockOnRefresh,
    selectedIds: [] as number[],
    setSelectedIds: mockSetSelectedIds,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("single delete", () => {
    it("shows warning when item not found in data", () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [],
        })
      );

      act(() => {
        result.current.handleSingleDeleteRequest(999);
      });

      expect(result.current.singleDeleteWarningOpen).toBe(true);
      expect(result.current.singleDeleteConfirmOpen).toBe(false);
    });

    it("shows warning when item has transaction", () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [{ id: 1, transactionId: 100, name: "Test" }],
        })
      );

      act(() => {
        result.current.handleSingleDeleteRequest(1);
      });

      expect(result.current.singleDeleteWarningOpen).toBe(true);
      expect(result.current.singleDeleteConfirmOpen).toBe(false);
    });

    it("shows confirmation when item has no transaction", () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [{ id: 1, transactionId: null, name: "Test" }],
        })
      );

      act(() => {
        result.current.handleSingleDeleteRequest(1);
      });

      expect(result.current.singleDeleteWarningOpen).toBe(false);
      expect(result.current.singleDeleteConfirmOpen).toBe(true);
    });

    it("calls onDelete and onRefresh when confirmed", async () => {
      mockOnDelete.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [{ id: 1, transactionId: null, name: "Test" }],
        })
      );

      act(() => {
        result.current.handleSingleDeleteRequest(1);
      });

      await act(async () => {
        await result.current.handleSingleDeleteConfirm();
      });

      expect(mockOnDelete).toHaveBeenCalledWith(1);
      expect(mockOnRefresh).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith({
        message: "common:toast.deleteSuccess",
        severity: "success",
      });
      expect(result.current.singleDeleteConfirmOpen).toBe(false);
    });

    it("shows error toast on delete failure", async () => {
      mockOnDelete.mockRejectedValue(new Error("Delete failed"));

      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [{ id: 1, transactionId: null, name: "Test" }],
        })
      );

      act(() => {
        result.current.handleSingleDeleteRequest(1);
      });

      await act(async () => {
        await result.current.handleSingleDeleteConfirm();
      });

      expect(mockShowToast).toHaveBeenCalledWith({
        message: "common:toast.deleteError",
        severity: "error",
      });
    });

    it("closes warning dialog", () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [{ id: 1, transactionId: 100, name: "Test" }],
        })
      );

      act(() => {
        result.current.handleSingleDeleteRequest(1);
      });
      expect(result.current.singleDeleteWarningOpen).toBe(true);

      act(() => {
        result.current.handleSingleDeleteWarningClose();
      });
      expect(result.current.singleDeleteWarningOpen).toBe(false);
    });

    it("closes confirm dialog", () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [{ id: 1, transactionId: null, name: "Test" }],
        })
      );

      act(() => {
        result.current.handleSingleDeleteRequest(1);
      });
      expect(result.current.singleDeleteConfirmOpen).toBe(true);

      act(() => {
        result.current.handleSingleDeleteConfirmClose();
      });
      expect(result.current.singleDeleteConfirmOpen).toBe(false);
    });
  });

  describe("bulk delete", () => {
    it("does nothing when no items selected", async () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          selectedIds: [],
        })
      );

      await act(async () => {
        await result.current.handleBulkDelete();
      });

      expect(result.current.transactionWarningOpen).toBe(false);
      expect(result.current.bulkDeleteConfirmOpen).toBe(false);
    });

    it("shows confirmation when all items are deletable", async () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [
            { id: 1, transactionId: null, name: "Test1" },
            { id: 2, transactionId: null, name: "Test2" },
          ],
          selectedIds: [1, 2],
        })
      );

      await act(async () => {
        await result.current.handleBulkDelete();
      });

      expect(result.current.bulkDeleteConfirmOpen).toBe(true);
      expect(result.current.transactionWarningOpen).toBe(false);
    });

    it("shows warning when some items have transactions", async () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [
            { id: 1, transactionId: null, name: "Deletable" },
            { id: 2, transactionId: 100, name: "Has Transaction" },
          ],
          selectedIds: [1, 2],
        })
      );

      await act(async () => {
        await result.current.handleBulkDelete();
      });

      expect(result.current.transactionWarningOpen).toBe(true);
      expect(result.current.itemsWithTransaction).toHaveLength(1);
      expect(result.current.deletableIds).toEqual([1]);
      expect(mockSetSelectedIds).toHaveBeenCalledWith([1]);
    });

    it("shows warning when all items have transactions", async () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [
            { id: 1, transactionId: 100, name: "Has Transaction 1" },
            { id: 2, transactionId: 200, name: "Has Transaction 2" },
          ],
          selectedIds: [1, 2],
        })
      );

      await act(async () => {
        await result.current.handleBulkDelete();
      });

      expect(result.current.transactionWarningOpen).toBe(true);
      expect(result.current.itemsWithTransaction).toHaveLength(2);
      expect(result.current.deletableIds).toEqual([]);
    });

    it("calls onBulkDelete when warning confirmed with deletable items", async () => {
      mockOnBulkDelete.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [
            { id: 1, transactionId: null, name: "Deletable" },
            { id: 2, transactionId: 100, name: "Has Transaction" },
          ],
          selectedIds: [1, 2],
        })
      );

      await act(async () => {
        await result.current.handleBulkDelete();
      });

      await act(async () => {
        await result.current.handleTransactionWarningConfirm();
      });

      expect(mockOnBulkDelete).toHaveBeenCalledWith([1]);
      expect(result.current.transactionWarningOpen).toBe(false);
    });

    it("shows info toast when warning confirmed but no deletable items", async () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [
            { id: 1, transactionId: 100, name: "Has Transaction" },
          ],
          selectedIds: [1],
        })
      );

      await act(async () => {
        await result.current.handleBulkDelete();
      });

      await act(async () => {
        await result.current.handleTransactionWarningConfirm();
      });

      expect(mockOnBulkDelete).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith({
        message: "accounting:noItemsToDelete",
        severity: "info",
      });
    });

    it("closes transaction warning dialog", async () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [{ id: 1, transactionId: 100, name: "Has Transaction" }],
          selectedIds: [1],
        })
      );

      await act(async () => {
        await result.current.handleBulkDelete();
      });
      expect(result.current.transactionWarningOpen).toBe(true);

      act(() => {
        result.current.handleTransactionWarningClose();
      });

      expect(result.current.transactionWarningOpen).toBe(false);
      expect(result.current.itemsWithTransaction).toEqual([]);
      expect(result.current.deletableIds).toEqual([]);
    });

    it("calls onBulkDelete when bulk confirm confirmed", async () => {
      mockOnBulkDelete.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [{ id: 1, transactionId: null, name: "Deletable" }],
          selectedIds: [1],
        })
      );

      await act(async () => {
        await result.current.handleBulkDelete();
      });

      await act(async () => {
        await result.current.handleBulkDeleteConfirm();
      });

      expect(mockOnBulkDelete).toHaveBeenCalledWith([1]);
      expect(result.current.bulkDeleteConfirmOpen).toBe(false);
    });

    it("closes bulk delete confirm dialog", async () => {
      const { result } = renderHook(() =>
        useDeletePreValidation<TestItem>({
          ...defaultOptions,
          data: [{ id: 1, transactionId: null, name: "Deletable" }],
          selectedIds: [1],
        })
      );

      await act(async () => {
        await result.current.handleBulkDelete();
      });
      expect(result.current.bulkDeleteConfirmOpen).toBe(true);

      act(() => {
        result.current.handleBulkDeleteConfirmClose();
      });

      expect(result.current.bulkDeleteConfirmOpen).toBe(false);
    });
  });
});
