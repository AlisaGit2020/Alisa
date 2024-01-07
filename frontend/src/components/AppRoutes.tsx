import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import Apartments from './apartment/Apartments';
import ApartmentForm from './apartment/ApartmentForm';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Dashboard></Dashboard>}></Route>
                <Route path='/apartments/edit/:id' element={<ApartmentForm></ApartmentForm>}></Route>
                <Route path='/apartments/add' element={<ApartmentForm></ApartmentForm>}></Route>
                <Route path='/apartments' element={<Apartments></Apartments>}></Route>
            </Routes>
        </BrowserRouter>
    )
}