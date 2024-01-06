import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Apartments from './Apartments';
import ApartmentForm from './forms/ApartmentForm';

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Dashboard></Dashboard>}></Route>
                <Route path='/apartments/add' element={<ApartmentForm></ApartmentForm>}></Route>
                <Route path='/apartments' element={<Apartments></Apartments>}></Route>
            </Routes>
        </BrowserRouter>
    )
}