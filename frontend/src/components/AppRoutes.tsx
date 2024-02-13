import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import Properties from './property/Properties';
import PropertyForm from './property/PropertyForm';
import Settings from './settings/Settings';
import{ propertyContext, expenseTypeContext, transactionContext } from '@alisa-lib/alisa-contexts';
import ExpenseTypeForm from './settings/expense-type/ExpenseTypeForm';
import TransactionForm from './transaction/TransactionForm';
import TransactionMain from './transaction/TransactionMain';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Dashboard></Dashboard>}></Route>
                
                <Route path={`${propertyContext.routePath}/edit/:idParam`} element={<PropertyForm></PropertyForm>}></Route>
                <Route path={`${propertyContext.routePath}/add`} element={<PropertyForm></PropertyForm>}></Route>
                <Route path={`${propertyContext.routePath}`} element={<Properties></Properties>}></Route>
                
                <Route path={`${transactionContext.routePath}/edit/:id`} element={<TransactionForm></TransactionForm>}></Route>                
                <Route path={`${transactionContext.routePath}/add/:type?/:propertyId?`} element={<TransactionForm></TransactionForm>}></Route>                
                <Route path={`${transactionContext.routePath}/:propertyId?`} element={<TransactionMain></TransactionMain>}></Route>

                <Route path={`${expenseTypeContext.routePath}/edit/:idParam`} element={<ExpenseTypeForm></ExpenseTypeForm>}></Route>
                <Route path={`${expenseTypeContext.routePath}/add`} element={<ExpenseTypeForm></ExpenseTypeForm>}></Route>
                <Route path='/settings' element={<Settings></Settings>}></Route>
            </Routes>
        </BrowserRouter>
    )
}