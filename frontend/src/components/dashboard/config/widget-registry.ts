import { ComponentType } from "react";
import IncomeExpenseChart from "../widgets/IncomeExpenseChart";
import IncomeChart from "../widgets/IncomeChart";
import ExpenseChart from "../widgets/ExpenseChart";
import NetResultChart from "../widgets/NetResultChart";
import DepositChart from "../widgets/DepositChart";
import WithdrawChart from "../widgets/WithdrawChart";
import AirbnbVisitsChart from "../widgets/AirbnbVisitsChart";

export type WidgetSize = "1/1" | "1/2" | "1/3" | "1/4";

export const WIDGET_SIZES: { value: WidgetSize; label: string; gridMd: number }[] = [
  { value: "1/1", label: "1/1", gridMd: 12 },
  { value: "1/2", label: "1/2", gridMd: 6 },
  { value: "1/3", label: "1/3", gridMd: 4 },
  { value: "1/4", label: "1/4", gridMd: 3 },
];

export const getGridSize = (size: WidgetSize): number => {
  const sizeConfig = WIDGET_SIZES.find((s) => s.value === size);
  return sizeConfig?.gridMd ?? 12;
};

export interface WidgetDefinition {
  id: string;
  component: ComponentType;
  translationKey: string;
  defaultSize: WidgetSize;
  height: number;
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: "incomeExpense",
    component: IncomeExpenseChart,
    translationKey: "incomeAndExpenses",
    defaultSize: "1/1",
    height: 400,
  },
  {
    id: "income",
    component: IncomeChart,
    translationKey: "income",
    defaultSize: "1/3",
    height: 300,
  },
  {
    id: "expense",
    component: ExpenseChart,
    translationKey: "expenses",
    defaultSize: "1/3",
    height: 300,
  },
  {
    id: "netResult",
    component: NetResultChart,
    translationKey: "netResult",
    defaultSize: "1/3",
    height: 300,
  },
  {
    id: "deposit",
    component: DepositChart,
    translationKey: "deposits",
    defaultSize: "1/2",
    height: 300,
  },
  {
    id: "withdraw",
    component: WithdrawChart,
    translationKey: "withdrawals",
    defaultSize: "1/2",
    height: 300,
  },
  {
    id: "airbnbVisits",
    component: AirbnbVisitsChart,
    translationKey: "airbnbVisits",
    defaultSize: "1/3",
    height: 300,
  },
];

export const getWidgetById = (id: string): WidgetDefinition | undefined => {
  return WIDGET_REGISTRY.find((widget) => widget.id === id);
};

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
  widgets: WIDGET_REGISTRY.map((widget, index) => ({
    id: widget.id,
    visible: true,
    order: index,
    size: widget.defaultSize,
  })),
};
