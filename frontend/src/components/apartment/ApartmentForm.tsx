import axios from 'axios';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { PropertyInputDto } from '../../../../backend/src/real-estate/property/dtos/property-input.dto'
import { useState } from 'react';
import getApiUrl from '../../functions';
import { Box, Grid, Stack } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import React from 'react';

const newProperty = {
    name: '',
    size: undefined
}
const ApartmentForm = () => {
    const [apartment, setApartment] = useState<PropertyInputDto>(newProperty);
    const { id } = useParams();

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
                console.error('Error while fetching apartment', error);
                throw error;
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
        try {
            if (id) {
                await axios.put(getApiUrl(`real-estate/property/${id}`), apartment);
            } else {
                await axios.post(getApiUrl('real-estate/property'), apartment);
            }

            setApartment(newProperty);

            navigate('/apartments')

        } catch (error) {
            console.error('Error while saving', error);
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
                        label="Apartment size"
                        value={apartment.size}
                        autoComplete='off'
                        onChange={(e) => handleChange('size', e.target.value)}
                    />
                </Stack>

                <Button variant="contained" color="primary"
                    onClick={handleSubmit}>
                    Save
                </Button>
            </Grid>
        </Grid>
    );
};

export default ApartmentForm;
