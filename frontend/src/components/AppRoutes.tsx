import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import Apartments from './apartment/Apartments';
import ApartmentForm from './apartment/ApartmentForm';
import Settings from './settings/Settings';
import apartmentContext from '../alisa-contexts/apartment';
import expenseTypeContext from '../alisa-contexts/expense-type';
import ExpenseTypeForm from './settings/expense-type/ExpenseTypeForm';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Dashboard></Dashboard>}></Route>
                <Route path={`${apartmentContext.routePath}/edit/:id`} element={<ApartmentForm></ApartmentForm>}></Route>
                <Route path={`${apartmentContext.routePath}/add`} element={<ApartmentForm></ApartmentForm>}></Route>
                <Route path={`${apartmentContext.routePath}`} element={<Apartments></Apartments>}></Route>
                <Route path={`${expenseTypeContext.routePath}/edit/:id`} element={<ExpenseTypeForm></ExpenseTypeForm>}></Route>
                <Route path={`${expenseTypeContext.routePath}/add`} element={<ExpenseTypeForm></ExpenseTypeForm>}></Route>
                <Route path='/settings' element={<Settings></Settings>}></Route>
            </Routes>
        </BrowserRouter>
    )
}