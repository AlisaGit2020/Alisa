import axios from 'axios';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useState } from 'react';
import getApiUrl from '../../functions';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ApartmentForm = () => {
    const [apartmentName, setApartmentName] = useState('');

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setApartmentName(event.target.value);
    };

    const navigate = useNavigate();

    const handleSubmit = async () => {
        try {

            await axios.post(getApiUrl('real-estate/property'), {
                name: apartmentName,
            });

            setApartmentName('');

            navigate('/apartments')

        } catch (error) {
            console.error('Error while saving', error);
        }
    };

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <TextField
                label="Apartment Name"
                value={apartmentName}
                onChange={handleNameChange}
                autoComplete='off'
            />
            <br></br>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
                Tallenna
            </Button>

        </Container>
    );
};

export default ApartmentForm;
