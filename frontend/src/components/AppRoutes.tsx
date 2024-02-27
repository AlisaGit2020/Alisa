import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import Properties from './property/Properties';
import PropertyForm from './property/PropertyForm';
import Settings from './settings/Settings';
import{ propertyContext, expenseTypeContext, transactionContext } from '@alisa-lib/alisa-contexts';
import ExpenseTypeForm from './settings/expense-type/ExpenseTypeForm';
import TransactionForm from './transaction/TransactionForm';
import TransactionMain from './transaction/TransactionMain';
import Breadcrumbs from './layout/Breadcrumbs';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Breadcrumbs></Breadcrumbs>
            <Routes>
                <Route path='/' element={<Dashboard></Dashboard>}></Route>
                
                <Route path={`${propertyContext.routePath}/edit/:idParam`} element={<PropertyForm></PropertyForm>}></Route>
                <Route path={`${propertyContext.routePath}/add`} element={<PropertyForm></PropertyForm>}></Route>
                <Route path={`${propertyContext.routePath}`} element={<Properties></Properties>}></Route>
                
                <Route path={`${transactionContext.routePath}/edit/:id`} element={<TransactionForm></TransactionForm>}></Route>                
                <Route path={`${transactionContext.routePath}/add/:type?/:propertyId?`} element={<TransactionForm></TransactionForm>}></Route>                
                <Route path={`${transactionContext.routePath}/:propertyId?`} element={<TransactionMain></TransactionMain>}></Route>
                
                <Route path='/settings/:page?/:action?/:idParam?' element={<Settings></Settings>}></Route>
            </Routes>
        </BrowserRouter>
    )
}