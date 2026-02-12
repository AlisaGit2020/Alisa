import AuthOutlet from "@auth-kit/react-router/AuthOutlet";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./dashboard/Dashboard";
import Properties from "./property/Properties";
import PropertyForm from "./property/PropertyForm";
import PropertyView from "./property/PropertyView";
import ReportPage from "./property/report/ReportPage";
import Settings from "./settings/Settings";
import TaxView from "./tax/TaxView";
import TransactionsOverview from "./transaction/TransactionsOverview";
import TransactionMain from "./transaction/TransactionMain";
import TransactionsPending from "./transaction/pending/TransactionsPending";
import TransactionImportWizard from "./transaction/import-wizard/TransactionImportWizard";

import SignIn from "./login/Login";
import AccountingOverview from "./accounting/AccountingOverview.tsx";
import Expenses from "./accounting/expenses/Expenses.tsx";
import Incomes from "./accounting/incomes/Incomes.tsx";
import LandingPageRouter from "./landing/LandingPageRouter";
import InvestmentCalculatorPublic from "./investment-calculator/InvestmentCalculatorPublic";
import InvestmentCalculatorProtected from "./investment-calculator/InvestmentCalculatorProtected";
import PublicLayout from "./layout/PublicLayout";
import ProtectedLayout from "./layout/ProtectedLayout";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - no app chrome */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPageRouter />} />
          <Route path="/investment-calculator" element={<InvestmentCalculatorPublic />} />
          <Route path="/login" element={<SignIn />} />
        </Route>

        {/* Protected routes - with AppBar, sidebar, breadcrumbs */}
        <Route path="/app" element={<ProtectedLayout />}>
          <Route element={<AuthOutlet fallbackPath="/login" />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="investment-calculations" element={<InvestmentCalculatorProtected />} />

          <Route
            path="properties/edit/:idParam"
            element={<PropertyForm></PropertyForm>}
          ></Route>
          <Route
            path="properties/add"
            element={<PropertyForm></PropertyForm>}
          ></Route>
          <Route
            path="properties/:idParam"
            element={<PropertyView />}
          />
          <Route
            path="properties"
            element={<Properties></Properties>}
          ></Route>

          {/* Accounting routes */}
          <Route
            path="accounting"
            element={<AccountingOverview></AccountingOverview>}
          ></Route>

          {/* Transaction routes */}
          <Route
            path="accounting/transactions"
            element={<TransactionsOverview />}
          ></Route>

          <Route
            path="accounting/transactions/accepted"
            element={<TransactionMain />}
          ></Route>

          <Route
            path="accounting/transactions/pending"
            element={<TransactionsPending />}
          ></Route>

          <Route
            path="accounting/transactions/import"
            element={<TransactionImportWizard />}
          ></Route>

          <Route
            path="accounting/expenses"
            element={<Expenses></Expenses>}
          ></Route>

          <Route
            path="accounting/incomes"
            element={<Incomes></Incomes>}
          ></Route>

          <Route
            path="tax"
            element={<TaxView />}
          ></Route>

          <Route
            path="report"
            element={<ReportPage />}
          ></Route>

          {/* Backward compatibility redirect */}
          <Route
            path="transactions/*"
            element={<Navigate to="/app/accounting/transactions" replace />}
          ></Route>

          <Route
            path="settings/:page?/:action?/:idParam?"
            element={<Settings></Settings>}
          ></Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
