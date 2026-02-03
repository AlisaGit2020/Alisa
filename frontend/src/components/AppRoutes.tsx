import AuthOutlet from "@auth-kit/react-router/AuthOutlet";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./dashboard/Dashboard";
import Properties from "./property/Properties";
import PropertyForm from "./property/PropertyForm";
import Settings from "./settings/Settings";
import {
  propertyContext,
  accountingContext,
  transactionContext,
  expenseContext,
  incomeContext,
} from "@alisa-lib/alisa-contexts";
import BankTransactions from "./transaction/BankTransactions";

import SignIn from "./login/Login";
import Breadcrumbs from "./layout/Breadcrumbs.tsx";
import AccountingOverview from "./accounting/AccountingOverview.tsx";
import Expenses from "./accounting/expenses/Expenses.tsx";
import Incomes from "./accounting/incomes/Incomes.tsx";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Breadcrumbs></Breadcrumbs>
      <Routes>
        <Route element={<AuthOutlet fallbackPath="/login" />}>
          <Route path="/" element={<Dashboard></Dashboard>}></Route>

          <Route
            path={`${propertyContext.routePath}/edit/:idParam`}
            element={<PropertyForm></PropertyForm>}
          ></Route>
          <Route
            path={`${propertyContext.routePath}/add`}
            element={<PropertyForm></PropertyForm>}
          ></Route>
          <Route
            path={`${propertyContext.routePath}`}
            element={<Properties></Properties>}
          ></Route>

          {/* Accounting routes */}
          <Route
            path={accountingContext.routePath}
            element={<AccountingOverview></AccountingOverview>}
          ></Route>

          <Route
            path={transactionContext.routePath}
            element={<BankTransactions></BankTransactions>}
          ></Route>

          {/* Redirect old pending URL to main transactions page */}
          <Route
            path={`${transactionContext.routePath}/pending`}
            element={<Navigate to={transactionContext.routePath} replace />}
          ></Route>

          <Route
            path={expenseContext.routePath}
            element={<Expenses></Expenses>}
          ></Route>

          <Route
            path={incomeContext.routePath}
            element={<Incomes></Incomes>}
          ></Route>

          {/* Backward compatibility redirect */}
          <Route
            path="/transactions/*"
            element={<Navigate to="/accounting/transactions" replace />}
          ></Route>

          <Route
            path="/settings/:page?/:action?/:idParam?"
            element={<Settings></Settings>}
          ></Route>
        </Route>
        <Route path="/login" element={<SignIn></SignIn>}></Route>
      </Routes>
    </BrowserRouter>
  );
}
