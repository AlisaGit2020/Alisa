import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  getTransactionPropertyId,
  setTransactionPropertyId,
} from "@alisa-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../../transaction/TransactionLeftMenuItems";

export type ViewMode = "monthly" | "yearly";

interface DashboardFilters {
  viewMode: ViewMode;
  selectedYear: number;
}

interface DashboardContextType {
  selectedPropertyId: number | null;
  viewMode: ViewMode;
  selectedYear: number;
  setSelectedPropertyId: (id: number | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
}

const STORAGE_KEY = "dashboard_filters";

const getStoredFilters = (): Partial<DashboardFilters> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return {};
};

const storeFilters = (filters: DashboardFilters) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    // Ignore storage errors
  }
};

const currentYear = new Date().getFullYear();
const defaultFilters: DashboardFilters = {
  viewMode: "monthly",
  selectedYear: currentYear,
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const storedFilters = getStoredFilters();

  // Get initial property ID from shared storage (0 means "all properties")
  const initialPropertyId = getTransactionPropertyId();

  const [selectedPropertyId, setSelectedPropertyIdState] = useState<number | null>(
    initialPropertyId === 0 ? null : initialPropertyId
  );
  const [viewMode, setViewModeState] = useState<ViewMode>(
    storedFilters.viewMode ?? defaultFilters.viewMode
  );
  const [selectedYear, setSelectedYearState] = useState<number>(
    storedFilters.selectedYear ?? defaultFilters.selectedYear
  );

  // Generate available years (last 5 years)
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Store dashboard-specific filters when they change
  useEffect(() => {
    storeFilters({ viewMode, selectedYear });
  }, [viewMode, selectedYear]);

  // Listen for property changes from other views (e.g., transactions)
  useEffect(() => {
    const handlePropertyChange = (event: CustomEvent<{ propertyId: number }>) => {
      const newPropertyId = event.detail.propertyId;
      setSelectedPropertyIdState(newPropertyId === 0 ? null : newPropertyId);
    };

    window.addEventListener(
      TRANSACTION_PROPERTY_CHANGE_EVENT,
      handlePropertyChange as EventListener
    );

    return () => {
      window.removeEventListener(
        TRANSACTION_PROPERTY_CHANGE_EVENT,
        handlePropertyChange as EventListener
      );
    };
  }, []);

  const setSelectedPropertyId = (id: number | null) => {
    const propertyId = id ?? 0;
    setSelectedPropertyIdState(id);
    // Store in shared storage
    setTransactionPropertyId(propertyId);
    // Dispatch event so other views can sync
    window.dispatchEvent(
      new CustomEvent(TRANSACTION_PROPERTY_CHANGE_EVENT, {
        detail: { propertyId },
      })
    );
  };

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
  };

  const setSelectedYear = (year: number) => {
    setSelectedYearState(year);
  };

  return (
    <DashboardContext.Provider
      value={{
        selectedPropertyId,
        viewMode,
        selectedYear,
        setSelectedPropertyId,
        setViewMode,
        setSelectedYear,
        availableYears,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
