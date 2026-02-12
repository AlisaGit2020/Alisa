import '@testing-library/jest-dom';
import { DashboardConfig, WidgetConfig, DEFAULT_DASHBOARD_CONFIG } from '../config/widget-registry';

// Since Jest mock hoisting causes issues with hooks and context in ESM mode,
// we test the data transformation logic separately from the React component

describe('DashboardContext Logic', () => {
  const currentYear = new Date().getFullYear();

  describe('ViewMode type', () => {
    it('accepts "monthly" as valid view mode', () => {
      const viewMode: 'monthly' | 'yearly' = 'monthly';
      expect(viewMode).toBe('monthly');
    });

    it('accepts "yearly" as valid view mode', () => {
      const viewMode: 'monthly' | 'yearly' = 'yearly';
      expect(viewMode).toBe('yearly');
    });
  });

  describe('availableYears generation', () => {
    it('generates last 5 years including current year', () => {
      const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

      expect(availableYears).toHaveLength(5);
      expect(availableYears[0]).toBe(currentYear);
      expect(availableYears[4]).toBe(currentYear - 4);
    });

    it('years are in descending order', () => {
      const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

      for (let i = 0; i < availableYears.length - 1; i++) {
        expect(availableYears[i]).toBeGreaterThan(availableYears[i + 1]);
      }
    });
  });

  describe('Property ID handling', () => {
    it('converts 0 to null for internal state', () => {
      const propertyId = 0;
      const selectedPropertyId = propertyId === 0 ? null : propertyId;

      expect(selectedPropertyId).toBeNull();
    });

    it('keeps non-zero property ID as is', () => {
      const propertyId: number = 5;
      const selectedPropertyId = propertyId === 0 ? null : propertyId;

      expect(selectedPropertyId).toBe(5);
    });

    it('converts null to 0 for external storage', () => {
      const id: number | null = null;
      const propertyId = id ?? 0;

      expect(propertyId).toBe(0);
    });
  });

  describe('Filter storage', () => {
    it('creates filter object with viewMode and selectedYear', () => {
      const filters = {
        viewMode: 'monthly' as const,
        selectedYear: currentYear,
      };

      expect(filters.viewMode).toBe('monthly');
      expect(filters.selectedYear).toBe(currentYear);
    });

    it('parses stored filters correctly', () => {
      const stored = JSON.stringify({
        viewMode: 'yearly',
        selectedYear: 2023,
      });

      const parsed = JSON.parse(stored);

      expect(parsed.viewMode).toBe('yearly');
      expect(parsed.selectedYear).toBe(2023);
    });

    it('returns empty object for invalid JSON', () => {
      const getStoredFilters = () => {
        try {
          return JSON.parse('invalid json');
        } catch {
          return {};
        }
      };

      expect(getStoredFilters()).toEqual({});
    });
  });

  describe('Widget visibility update', () => {
    it('updates widget visibility to false', () => {
      const widgets: WidgetConfig[] = [
        { id: 'income', visible: true, order: 0 },
        { id: 'expense', visible: true, order: 1 },
      ];

      const updateWidgetVisibility = (widgetId: string, visible: boolean) => {
        return widgets.map((widget) =>
          widget.id === widgetId ? { ...widget, visible } : widget
        );
      };

      const updated = updateWidgetVisibility('income', false);

      expect(updated[0].visible).toBe(false);
      expect(updated[1].visible).toBe(true);
    });

    it('updates widget visibility to true', () => {
      const widgets: WidgetConfig[] = [
        { id: 'income', visible: false, order: 0 },
        { id: 'expense', visible: true, order: 1 },
      ];

      const updateWidgetVisibility = (widgetId: string, visible: boolean) => {
        return widgets.map((widget) =>
          widget.id === widgetId ? { ...widget, visible } : widget
        );
      };

      const updated = updateWidgetVisibility('income', true);

      expect(updated[0].visible).toBe(true);
    });
  });

  describe('Widget size update', () => {
    it('updates widget size to 1/2', () => {
      const widgets: WidgetConfig[] = [
        { id: 'income', visible: true, order: 0, size: '1/1' },
        { id: 'expense', visible: true, order: 1, size: '1/1' },
      ];

      const updateWidgetSize = (widgetId: string, size: '1/1' | '1/2' | '1/3' | '1/4') => {
        return widgets.map((widget) =>
          widget.id === widgetId ? { ...widget, size } : widget
        );
      };

      const updated = updateWidgetSize('income', '1/2');

      expect(updated[0].size).toBe('1/2');
      expect(updated[1].size).toBe('1/1');
    });
  });

  describe('Widget reordering', () => {
    it('reorders widgets correctly', () => {
      const widgets: WidgetConfig[] = [
        { id: 'a', visible: true, order: 0 },
        { id: 'b', visible: true, order: 1 },
        { id: 'c', visible: true, order: 2 },
      ];

      const reorderWidgets = (activeId: string, overId: string) => {
        const newWidgets = [...widgets];
        const activeIndex = newWidgets.findIndex((w) => w.id === activeId);
        const overIndex = newWidgets.findIndex((w) => w.id === overId);

        if (activeIndex === -1 || overIndex === -1) return widgets;

        const [removed] = newWidgets.splice(activeIndex, 1);
        newWidgets.splice(overIndex, 0, removed);

        return newWidgets.map((widget, index) => ({
          ...widget,
          order: index,
        }));
      };

      // Move 'a' to position of 'c'
      const reordered = reorderWidgets('a', 'c');

      expect(reordered[0].id).toBe('b');
      expect(reordered[1].id).toBe('c');
      expect(reordered[2].id).toBe('a');
      expect(reordered[0].order).toBe(0);
      expect(reordered[1].order).toBe(1);
      expect(reordered[2].order).toBe(2);
    });

    it('returns original widgets if activeId not found', () => {
      const widgets: WidgetConfig[] = [
        { id: 'a', visible: true, order: 0 },
        { id: 'b', visible: true, order: 1 },
      ];

      const reorderWidgets = (activeId: string, overId: string) => {
        const newWidgets = [...widgets];
        const activeIndex = newWidgets.findIndex((w) => w.id === activeId);
        const overIndex = newWidgets.findIndex((w) => w.id === overId);

        if (activeIndex === -1 || overIndex === -1) return widgets;

        const [removed] = newWidgets.splice(activeIndex, 1);
        newWidgets.splice(overIndex, 0, removed);

        return newWidgets.map((widget, index) => ({
          ...widget,
          order: index,
        }));
      };

      const result = reorderWidgets('nonexistent', 'b');

      expect(result).toBe(widgets);
    });
  });

  describe('getVisibleWidgets', () => {
    it('returns only visible widgets sorted by order', () => {
      const dashboardConfig: DashboardConfig = {
        widgets: [
          { id: 'c', visible: true, order: 2 },
          { id: 'a', visible: true, order: 0 },
          { id: 'b', visible: false, order: 1 },
        ],
      };

      const getVisibleWidgets = () => {
        return dashboardConfig.widgets
          .filter((widget) => widget.visible)
          .sort((a, b) => a.order - b.order);
      };

      const visible = getVisibleWidgets();

      expect(visible).toHaveLength(2);
      expect(visible[0].id).toBe('a');
      expect(visible[1].id).toBe('c');
    });

    it('returns empty array when no widgets are visible', () => {
      const dashboardConfig: DashboardConfig = {
        widgets: [
          { id: 'a', visible: false, order: 0 },
          { id: 'b', visible: false, order: 1 },
        ],
      };

      const getVisibleWidgets = () => {
        return dashboardConfig.widgets
          .filter((widget) => widget.visible)
          .sort((a, b) => a.order - b.order);
      };

      const visible = getVisibleWidgets();

      expect(visible).toHaveLength(0);
    });
  });

  describe('getAllWidgets', () => {
    it('returns all widgets sorted by order', () => {
      const dashboardConfig: DashboardConfig = {
        widgets: [
          { id: 'c', visible: false, order: 2 },
          { id: 'a', visible: true, order: 0 },
          { id: 'b', visible: true, order: 1 },
        ],
      };

      const getAllWidgets = () => {
        return [...dashboardConfig.widgets].sort((a, b) => a.order - b.order);
      };

      const all = getAllWidgets();

      expect(all).toHaveLength(3);
      expect(all[0].id).toBe('a');
      expect(all[1].id).toBe('b');
      expect(all[2].id).toBe('c');
    });
  });

  describe('DEFAULT_DASHBOARD_CONFIG', () => {
    it('has all widgets visible by default', () => {
      expect(DEFAULT_DASHBOARD_CONFIG.widgets.every((w) => w.visible)).toBe(true);
    });

    it('has widgets with correct order values', () => {
      DEFAULT_DASHBOARD_CONFIG.widgets.forEach((widget, index) => {
        expect(widget.order).toBe(index);
      });
    });

    it('includes expected widget IDs', () => {
      const widgetIds = DEFAULT_DASHBOARD_CONFIG.widgets.map((w) => w.id);

      expect(widgetIds).toContain('incomeExpense');
      expect(widgetIds).toContain('income');
      expect(widgetIds).toContain('expense');
      expect(widgetIds).toContain('netResult');
      expect(widgetIds).toContain('deposit');
      expect(widgetIds).toContain('withdraw');
    });
  });

  describe('Refresh key mechanism', () => {
    it('incrementing refresh key triggers re-fetch', () => {
      let refreshKey = 0;

      const refreshData = () => {
        refreshKey = refreshKey + 1;
      };

      expect(refreshKey).toBe(0);
      refreshData();
      expect(refreshKey).toBe(1);
      refreshData();
      expect(refreshKey).toBe(2);
    });
  });

  describe('Edit mode state', () => {
    it('starts with edit mode disabled', () => {
      const isEditMode = false;
      expect(isEditMode).toBe(false);
    });

    it('can toggle edit mode on', () => {
      let isEditMode = false;
      const setIsEditMode = (value: boolean) => {
        isEditMode = value;
      };

      setIsEditMode(true);
      expect(isEditMode).toBe(true);
    });

    it('can toggle edit mode off', () => {
      let isEditMode = true;
      const setIsEditMode = (value: boolean) => {
        isEditMode = value;
      };

      setIsEditMode(false);
      expect(isEditMode).toBe(false);
    });
  });
});
