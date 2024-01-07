import axios, { AxiosError } from 'axios';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { PropertyInputDto } from '../../../../backend/src/real-estate/property/dtos/property-input.dto'
import { useState } from 'react';
import getApiUrl, { getNumber } from '../../functions';
import { Box, Grid, Stack } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import React from 'react';

const newProperty = {
    name: '',
    size: 0
}
const ApartmentForm = () => {
    const [apartment, setApartment] = useState<PropertyInputDto>(newProperty);
    const { id } = useParams();
    const [errorMessage, setErrorMessage] = useState<String[]>([])
    const navigate = useNavigate();

    React.useEffect(() => {
        getApartment(Number(id))
            .then(setApartment)
    }, [])

    const getApartment = async (apartmentId: number) => {
        if (apartmentId) {
            try {
                const response = await axios.get(getApiUrl(`real-estate/property/${apartmentId}`));
                return response.data
            } catch (error) {
                return newProperty;
            }
        }
        return newProperty;
    }

    const handleChange = (fieldName: string, value: any) => {
        setApartment((prevApartment) => ({
            ...prevApartment,
            [fieldName]: value,
        }));
    };

    const handleSubmit = async () => {
        setErrorMessage([])
        try {
            console.log(apartment)
            if (id) {
                await axios.put(getApiUrl(`real-estate/property/${id}`), apartment);
            } else {
                await axios.post(getApiUrl('real-estate/property'), apartment);
            }

            setApartment(newProperty);

            navigate('/apartments')

        } catch (error: any) {
            if (error.response) {
                setErrorMessage(error.response.data.message);
            } else if (error.request) {
                setErrorMessage(['Request error']);
            } else {
                setErrorMessage(['An error occurred']);
            }
        }
    };

    return (
        <Grid container>
            <Grid item lg={6} xs={12}>
                <Box marginBottom={3}>
                    <Button variant="contained" color="secondary"
                        startIcon={<ArrowBackIosIcon></ArrowBackIosIcon>}
                        onClick={() => navigate('/apartments')}>
                        Back
                    </Button>
                </Box>

                <Stack spacing={2} marginBottom={2}>
                    <TextField
                        label="Apartment Name"
                        value={apartment.name}
                        autoComplete='off'
                        autoFocus={true}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />
                    <TextField
                        type='number'
                        label="Apartment size"
                        value={apartment.size}
                        autoComplete='off'
                        onChange={(e) => handleChange('size', getNumber(e.target.value, 1))}
                    />
                </Stack>

                <Button variant="contained" color="primary"
                    onClick={handleSubmit}>
                    Save
                </Button>

                {errorMessage.length > 0 && (
                    <Box marginTop={3} sx={{ color: 'error.main', border: 1, borderColor: 'error.main', padding: 2, borderRadius: 4 }}>
                        {errorMessage.map((message, index) => (
                            <div key={index}>{message}</div>
                        ))}
                    </Box>
                )}
            </Grid>
        </Grid>
    );
};

export default ApartmentForm;
