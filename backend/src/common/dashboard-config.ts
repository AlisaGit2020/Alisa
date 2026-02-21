export type WidgetSize = '1/1' | '1/2' | '1/3' | '1/4';

export interface WidgetConfig {
  id: string;
  visible: boolean;
  order: number;
  size?: WidgetSize;
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  widgets: [
    { id: 'incomeExpense', visible: true, order: 0, size: '1/1' },
    { id: 'income', visible: true, order: 1, size: '1/3' },
    { id: 'expense', visible: true, order: 2, size: '1/3' },
    { id: 'netResult', visible: true, order: 3, size: '1/3' },
    { id: 'deposit', visible: true, order: 4, size: '1/2' },
    { id: 'withdraw', visible: true, order: 5, size: '1/2' },
    { id: 'airbnbVisits', visible: true, order: 6, size: '1/3' },
  ],
};
