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
import InvestmentCalculatorProtected from "./investment-calculator/InvestmentCalculatorProtected";
import PublicLayout from "./layout/PublicLayout";
import ProtectedLayout from "./layout/ProtectedLayout";
import { PortfolioHub, FinanceHub, ReportsHub } from "./hub";

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

            {/* Portfolio routes - nested under /app/portfolio */}
            <Route path="portfolio" element={<PortfolioHub />} />
            <Route path="portfolio/properties" element={<Properties />} />
            <Route path="portfolio/properties/own" element={<Properties />} />
            <Route path="portfolio/properties/prospects" element={<Properties />} />
            <Route path="portfolio/properties/add" element={<PropertyForm />} />
            <Route path="portfolio/properties/edit/:idParam" element={<PropertyForm />} />
            <Route path="portfolio/properties/:idParam" element={<PropertyView />} />
            <Route path="portfolio/investment-calculations" element={<InvestmentCalculatorProtected />} />

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
            <Route path="properties" element={<Navigate to="/app/portfolio/properties" replace />} />
            <Route path="properties/*" element={<Navigate to="/app/portfolio/properties" replace />} />
            <Route path="investment-calculations" element={<Navigate to="/app/portfolio/investment-calculations" replace />} />
            <Route path="report" element={<Navigate to="/app/reports/property" replace />} />
            <Route path="tax" element={<Navigate to="/app/reports/tax" replace />} />

            <Route path="settings/:page?/:action?/:idParam?" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
