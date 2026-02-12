import '@testing-library/jest-dom';
import {
  WidgetSize,
  WIDGET_SIZES,
  getGridSize,
  WIDGET_REGISTRY,
  getWidgetById,
  DEFAULT_DASHBOARD_CONFIG,
} from './widget-registry';

describe('widget-registry', () => {
  describe('WIDGET_SIZES', () => {
    it('has 4 size options', () => {
      expect(WIDGET_SIZES).toHaveLength(4);
    });

    it('has 1/1 size mapping to 12 grid columns', () => {
      const fullWidth = WIDGET_SIZES.find((s) => s.value === '1/1');
      expect(fullWidth).toBeDefined();
      expect(fullWidth?.gridMd).toBe(12);
    });

    it('has 1/2 size mapping to 6 grid columns', () => {
      const halfWidth = WIDGET_SIZES.find((s) => s.value === '1/2');
      expect(halfWidth).toBeDefined();
      expect(halfWidth?.gridMd).toBe(6);
    });

    it('has 1/3 size mapping to 4 grid columns', () => {
      const thirdWidth = WIDGET_SIZES.find((s) => s.value === '1/3');
      expect(thirdWidth).toBeDefined();
      expect(thirdWidth?.gridMd).toBe(4);
    });

    it('has 1/4 size mapping to 3 grid columns', () => {
      const quarterWidth = WIDGET_SIZES.find((s) => s.value === '1/4');
      expect(quarterWidth).toBeDefined();
      expect(quarterWidth?.gridMd).toBe(3);
    });

    it('all sizes have labels matching their values', () => {
      WIDGET_SIZES.forEach((size) => {
        expect(size.label).toBe(size.value);
      });
    });
  });

  describe('getGridSize', () => {
    it('returns 12 for full width (1/1)', () => {
      expect(getGridSize('1/1')).toBe(12);
    });

    it('returns 6 for half width (1/2)', () => {
      expect(getGridSize('1/2')).toBe(6);
    });

    it('returns 4 for third width (1/3)', () => {
      expect(getGridSize('1/3')).toBe(4);
    });

    it('returns 3 for quarter width (1/4)', () => {
      expect(getGridSize('1/4')).toBe(3);
    });

    it('returns 12 for unknown size', () => {
      // Using type assertion to test edge case
      expect(getGridSize('invalid' as WidgetSize)).toBe(12);
    });
  });

  describe('WIDGET_REGISTRY', () => {
    it('contains all expected widgets', () => {
      const widgetIds = WIDGET_REGISTRY.map((w) => w.id);

      expect(widgetIds).toContain('incomeExpense');
      expect(widgetIds).toContain('income');
      expect(widgetIds).toContain('expense');
      expect(widgetIds).toContain('netResult');
      expect(widgetIds).toContain('deposit');
      expect(widgetIds).toContain('withdraw');
    });

    it('all widgets have required properties', () => {
      WIDGET_REGISTRY.forEach((widget) => {
        expect(widget.id).toBeDefined();
        expect(typeof widget.id).toBe('string');
        expect(widget.component).toBeDefined();
        expect(typeof widget.component).toBe('function');
        expect(widget.translationKey).toBeDefined();
        expect(typeof widget.translationKey).toBe('string');
        expect(widget.defaultSize).toBeDefined();
        expect(widget.height).toBeDefined();
        expect(typeof widget.height).toBe('number');
      });
    });

    it('incomeExpense widget has full width as default', () => {
      const incomeExpense = WIDGET_REGISTRY.find((w) => w.id === 'incomeExpense');
      expect(incomeExpense?.defaultSize).toBe('1/1');
    });

    it('income, expense, netResult widgets have 1/3 width as default', () => {
      const income = WIDGET_REGISTRY.find((w) => w.id === 'income');
      const expense = WIDGET_REGISTRY.find((w) => w.id === 'expense');
      const netResult = WIDGET_REGISTRY.find((w) => w.id === 'netResult');

      expect(income?.defaultSize).toBe('1/3');
      expect(expense?.defaultSize).toBe('1/3');
      expect(netResult?.defaultSize).toBe('1/3');
    });

    it('deposit and withdraw widgets have 1/2 width as default', () => {
      const deposit = WIDGET_REGISTRY.find((w) => w.id === 'deposit');
      const withdraw = WIDGET_REGISTRY.find((w) => w.id === 'withdraw');

      expect(deposit?.defaultSize).toBe('1/2');
      expect(withdraw?.defaultSize).toBe('1/2');
    });

    it('incomeExpense widget has taller height than others', () => {
      const incomeExpense = WIDGET_REGISTRY.find((w) => w.id === 'incomeExpense');
      const income = WIDGET_REGISTRY.find((w) => w.id === 'income');

      expect(incomeExpense?.height).toBe(400);
      expect(income?.height).toBe(300);
    });

    it('all widgets have positive height values', () => {
      WIDGET_REGISTRY.forEach((widget) => {
        expect(widget.height).toBeGreaterThan(0);
      });
    });
  });

  describe('getWidgetById', () => {
    it('returns widget for valid id', () => {
      const widget = getWidgetById('income');

      expect(widget).toBeDefined();
      expect(widget?.id).toBe('income');
      expect(widget?.translationKey).toBe('income');
    });

    it('returns undefined for invalid id', () => {
      const widget = getWidgetById('nonexistent');

      expect(widget).toBeUndefined();
    });

    it('returns correct widget for each registered widget', () => {
      WIDGET_REGISTRY.forEach((registeredWidget) => {
        const found = getWidgetById(registeredWidget.id);
        expect(found).toBe(registeredWidget);
      });
    });
  });

  describe('DEFAULT_DASHBOARD_CONFIG', () => {
    it('has same number of widgets as registry', () => {
      expect(DEFAULT_DASHBOARD_CONFIG.widgets.length).toBe(WIDGET_REGISTRY.length);
    });

    it('all widgets are visible by default', () => {
      DEFAULT_DASHBOARD_CONFIG.widgets.forEach((widget) => {
        expect(widget.visible).toBe(true);
      });
    });

    it('widgets have sequential order values starting from 0', () => {
      DEFAULT_DASHBOARD_CONFIG.widgets.forEach((widget, index) => {
        expect(widget.order).toBe(index);
      });
    });

    it('widgets have size matching registry default size', () => {
      DEFAULT_DASHBOARD_CONFIG.widgets.forEach((config) => {
        const registryWidget = getWidgetById(config.id);
        expect(config.size).toBe(registryWidget?.defaultSize);
      });
    });

    it('widget ids match registry ids in same order', () => {
      DEFAULT_DASHBOARD_CONFIG.widgets.forEach((config, index) => {
        expect(config.id).toBe(WIDGET_REGISTRY[index].id);
      });
    });
  });

  describe('WidgetConfig type', () => {
    it('id is required', () => {
      const config = { id: 'test', visible: true, order: 0 };
      expect(config.id).toBe('test');
    });

    it('visible is required', () => {
      const config = { id: 'test', visible: false, order: 0 };
      expect(config.visible).toBe(false);
    });

    it('order is required', () => {
      const config = { id: 'test', visible: true, order: 5 };
      expect(config.order).toBe(5);
    });

    it('size is optional', () => {
      const configWithSize = { id: 'test', visible: true, order: 0, size: '1/2' as WidgetSize };
      const configWithoutSize: { id: string; visible: boolean; order: number; size?: WidgetSize } = { id: 'test', visible: true, order: 0 };

      expect(configWithSize.size).toBe('1/2');
      expect(configWithoutSize.size).toBeUndefined();
    });
  });

  describe('Grid layout calculations', () => {
    it('three 1/3 widgets fit exactly in one row (4+4+4=12)', () => {
      const threeWidgets = ['1/3', '1/3', '1/3'] as WidgetSize[];
      const totalColumns = threeWidgets.reduce((sum, size) => sum + getGridSize(size), 0);

      expect(totalColumns).toBe(12);
    });

    it('two 1/2 widgets fit exactly in one row (6+6=12)', () => {
      const twoWidgets = ['1/2', '1/2'] as WidgetSize[];
      const totalColumns = twoWidgets.reduce((sum, size) => sum + getGridSize(size), 0);

      expect(totalColumns).toBe(12);
    });

    it('four 1/4 widgets fit exactly in one row (3+3+3+3=12)', () => {
      const fourWidgets = ['1/4', '1/4', '1/4', '1/4'] as WidgetSize[];
      const totalColumns = fourWidgets.reduce((sum, size) => sum + getGridSize(size), 0);

      expect(totalColumns).toBe(12);
    });
  });
});
