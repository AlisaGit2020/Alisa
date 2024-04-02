import AuthOutlet from "@auth-kit/react-router/AuthOutlet";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./dashboard/Dashboard";
import Properties from "./property/Properties";
import PropertyForm from "./property/PropertyForm";
import Settings from "./settings/Settings";
import { propertyContext, transactionContext } from "@alisa-lib/alisa-contexts";
import TransactionMain from "./transaction/TransactionMain";

import SignIn from "./login/Login";
import Breadcrumbs from "./layout/Breadcrumbs.tsx";
import TransactionsPending from "./transaction/pending/TransactionsPending.tsx";

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

          <Route
            path={`${transactionContext.routePath}/:propertyName?`}
            element={<TransactionMain></TransactionMain>}
          ></Route>

          <Route
            path={`${transactionContext.routePath}/pending/`}
            element={<TransactionsPending></TransactionsPending>}
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
