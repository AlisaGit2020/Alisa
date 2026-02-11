import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  getTransactionPropertyId,
  setTransactionPropertyId,
} from "@alisa-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "../../transaction/TransactionLeftMenuItems";
import {
  DashboardConfig,
  WidgetConfig,
  WidgetSize,
  DEFAULT_DASHBOARD_CONFIG,
} from "../config/widget-registry";
import ApiClient from "@alisa-lib/api-client";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";

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
  dashboardConfig: DashboardConfig;
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
  updateWidgetVisibility: (widgetId: string, visible: boolean) => void;
  updateWidgetSize: (widgetId: string, size: WidgetSize) => void;
  reorderWidgets: (activeId: string, overId: string) => void;
  saveDashboardConfig: () => Promise<void>;
  getVisibleWidgets: () => WidgetConfig[];
  getAllWidgets: () => WidgetConfig[];
  refreshData: () => void;
  refreshKey: number;
}

const STORAGE_KEY = "dashboard_filters";

const getStoredFilters = (): Partial<DashboardFilters> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parsing errors
  }
  return {};
};

const storeFilters = (filters: DashboardFilters) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
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
  const isAuthenticated = useIsAuthenticated();

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
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(
    DEFAULT_DASHBOARD_CONFIG
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [availableYears, setAvailableYears] = useState<number[]>(
    // Default to last 5 years until API loads
    Array.from({ length: 5 }, (_, i) => currentYear - i)
  );

  // Load dashboard config from user settings when authenticated
  useEffect(() => {
    const loadDashboardConfig = async () => {
      if (!isAuthenticated) {
        setConfigLoaded(true);
        return;
      }

      try {
        const user = await ApiClient.me();
        if (user.dashboardConfig) {
          setDashboardConfig(user.dashboardConfig);
        }
        setConfigLoaded(true);
      } catch {
        setConfigLoaded(true);
      }
    };
    loadDashboardConfig();
  }, [isAuthenticated]);

  // Load available years from statistics when authenticated
  useEffect(() => {
    console.log('[DashboardContext] loadAvailableYears effect running, isAuthenticated:', isAuthenticated);
    const loadAvailableYears = async () => {
      if (!isAuthenticated) {
        console.log('[DashboardContext] Not authenticated, skipping years load');
        return;
      }

      console.log('[DashboardContext] Fetching available years...');
      try {
        const years = await ApiClient.fetch<number[]>("real-estate/property/statistics/years");
        console.log('[DashboardContext] Received years:', years);
        if (years.length > 0) {
          // Ensure current year is included
          const yearsSet = new Set<number>(years);
          yearsSet.add(currentYear);
          const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
          setAvailableYears(sortedYears);
        }
      } catch {
        // Keep default years on error
      }
    };
    loadAvailableYears();
    // Re-fetch available years when authenticated or when statistics are refreshed
  }, [isAuthenticated, refreshKey]);

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
      handlePropertyChange as (event: Event) => void
    );

    return () => {
      window.removeEventListener(
        TRANSACTION_PROPERTY_CHANGE_EVENT,
        handlePropertyChange as (event: Event) => void
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

  const updateWidgetVisibility = useCallback((widgetId: string, visible: boolean) => {
    setDashboardConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, visible } : widget
      ),
    }));
  }, []);

  const updateWidgetSize = useCallback((widgetId: string, size: WidgetSize) => {
    setDashboardConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, size } : widget
      ),
    }));
  }, []);

  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    setDashboardConfig((prev) => {
      const widgets = [...prev.widgets];
      const activeIndex = widgets.findIndex((w) => w.id === activeId);
      const overIndex = widgets.findIndex((w) => w.id === overId);

      if (activeIndex === -1 || overIndex === -1) return prev;

      // Remove the active widget and insert at the new position
      const [removed] = widgets.splice(activeIndex, 1);
      widgets.splice(overIndex, 0, removed);

      // Update order values
      const reorderedWidgets = widgets.map((widget, index) => ({
        ...widget,
        order: index,
      }));

      return { ...prev, widgets: reorderedWidgets };
    });
  }, []);

  const saveDashboardConfig = useCallback(async () => {
    try {
      await ApiClient.updateUserSettings({ dashboardConfig });
    } catch (e) {
      console.error("Failed to save dashboard config:", e);
    }
  }, [dashboardConfig]);

  const getVisibleWidgets = useCallback((): WidgetConfig[] => {
    return dashboardConfig.widgets
      .filter((widget) => widget.visible)
      .sort((a, b) => a.order - b.order);
  }, [dashboardConfig]);

  const getAllWidgets = useCallback((): WidgetConfig[] => {
    return [...dashboardConfig.widgets].sort((a, b) => a.order - b.order);
  }, [dashboardConfig]);

  const refreshData = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Don't render children until config is loaded
  if (!configLoaded) {
    return null;
  }

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
        dashboardConfig,
        isEditMode,
        setIsEditMode,
        updateWidgetVisibility,
        updateWidgetSize,
        reorderWidgets,
        saveDashboardConfig,
        getVisibleWidgets,
        getAllWidgets,
        refreshData,
        refreshKey,
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
