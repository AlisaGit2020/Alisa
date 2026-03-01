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
import Expenses from "./accounting/expenses/Expenses.tsx";
import Incomes from "./accounting/incomes/Incomes.tsx";
import LandingPageRouter from "./landing/LandingPageRouter";
import InvestmentCalculatorPublic from "./investment-calculator/InvestmentCalculatorPublic";
import ProspectCompareView from "./investment-calculator/ProspectCompareView";
import PublicLayout from "./layout/PublicLayout";
import ProtectedLayout from "./layout/ProtectedLayout";
import { FinanceHub, ReportsHub } from "./hub";

// Export AppRoutesContent for testing (use with MemoryRouter in tests)
export function AppRoutesContent() {
  return (
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

            {/* Portfolio routes - nested under /app/portfolio */}
            <Route path="portfolio" element={<Navigate to="/app/portfolio/own" replace />} />
            <Route path="portfolio/own" element={<Properties />} />
            <Route path="portfolio/own/add" element={<PropertyForm />} />
            <Route path="portfolio/own/edit/:idParam" element={<PropertyForm />} />
            <Route path="portfolio/own/:idParam" element={<PropertyView />} />
            <Route path="portfolio/prospects" element={<Properties />} />
            <Route path="portfolio/prospects/compare" element={<ProspectCompareView standalone />} />
            <Route path="portfolio/prospects/add" element={<PropertyForm />} />
            <Route path="portfolio/prospects/edit/:idParam" element={<PropertyForm />} />
            <Route path="portfolio/prospects/:idParam" element={<PropertyView />} />
            <Route path="portfolio/sold" element={<Properties />} />
            <Route path="portfolio/sold/edit/:idParam" element={<PropertyForm />} />
            <Route path="portfolio/sold/:idParam" element={<PropertyView />} />
            {/* Backward compatibility: old routes */}
            <Route path="portfolio/investment-calculator" element={<Navigate to="/app/portfolio/prospects" replace />} />
            <Route path="portfolio/investment-calculations" element={<Navigate to="/app/portfolio/prospects" replace />} />
            <Route path="portfolio/properties/*" element={<Navigate to="/app/portfolio/own" replace />} />

            {/* Finance routes - nested under /app/finance */}
            <Route path="finance" element={<FinanceHub />} />
            <Route path="finance/transactions" element={<TransactionsOverview />} />
            <Route path="finance/transactions/accepted" element={<TransactionMain />} />
            <Route path="finance/transactions/pending" element={<TransactionsPending />} />
            <Route path="finance/transactions/import" element={<TransactionImportWizard />} />
            <Route path="finance/expenses" element={<Expenses />} />
            <Route path="finance/incomes" element={<Incomes />} />

            {/* Reports routes - nested under /app/reports */}
            <Route path="reports" element={<ReportsHub />} />
            <Route path="reports/property" element={<ReportPage />} />
            <Route path="reports/tax" element={<TaxView />} />

            {/* Backward compatibility redirects */}
            <Route path="accounting" element={<Navigate to="/app/finance" replace />} />
            <Route path="accounting/*" element={<Navigate to="/app/finance" replace />} />
            <Route path="transactions/*" element={<Navigate to="/app/finance/transactions" replace />} />
            <Route path="properties" element={<Navigate to="/app/portfolio/own" replace />} />
            <Route path="properties/*" element={<Navigate to="/app/portfolio/own" replace />} />
            <Route path="investment-calculations" element={<Navigate to="/app/portfolio/prospects" replace />} />
            <Route path="report" element={<Navigate to="/app/reports/property" replace />} />
            <Route path="tax" element={<Navigate to="/app/reports/tax" replace />} />

            <Route path="settings/:page?/:action?/:idParam?" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AppRoutesContent />
    </BrowserRouter>
  );
}
