import axios from 'axios';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { PropertyInputDto } from '../../../../backend/src/real-estate/property/dtos/property-input.dto'
import { useState } from 'react';
import getApiUrl, { getNumber } from '../../functions';
import { Box, Grid, Stack } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import React from 'react';
import { ValidationError, validate } from 'class-validator';

const newProperty = {
    name: '',
    size: 0,
} as PropertyInputDto;

const validateProperty: PropertyInputDto = new PropertyInputDto()
validateProperty.name = '';
validateProperty.size = 0;

const ApartmentForm = () => {
    const [apartment, setApartment] = useState<PropertyInputDto>(newProperty);
    const { id } = useParams();
    const [errorMessage, setErrorMessage] = useState<String[]>([])
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
    const navigate = useNavigate();

    React.useEffect(() => {
        getApartment(Number(id))
            .then(setApartment)
    }, [])

    const getApartment = async (apartmentId: number) => {
        if (apartmentId) {
            try {
                const response = await axios.get<PropertyInputDto>(getApiUrl(`real-estate/property/${apartmentId}`));

                return response.data
            } catch (error) {
                return newProperty;
            }
        }
        return newProperty;
    }

    function handleChange<T extends keyof PropertyInputDto, K extends PropertyInputDto[T]>(
        name: T,
        value: K
    ) {
        validateProperty[name] = value;
        setApartment((prevApartment) => ({
            ...prevApartment,
            [name]: value,
        }));
    }

    const handleSubmit = async () => {
        setErrorMessage([])
        setValidationErrors([])
        try {

            console.log(validateProperty);
            const validationErrors = await validate(validateProperty, { skipMissingProperties: true });
            if (validationErrors.length > 0) {
                setValidationErrors(validationErrors);
                return;
            }
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

                {(errorMessage.length > 0 || validationErrors.length > 0) && (
                    <Box marginTop={3} sx={{ color: 'error.main', border: 1, borderColor: 'error.main', padding: 2, borderRadius: 4 }}>
                        {errorMessage.map((message, index) => (
                            <div key={index}>{message}</div>
                        ))}
                        {validationErrors.map((error: ValidationError, index) => (
                            <div key={index}>
                                {error.property}:
                                <ul>
                                    {error.constraints && typeof error.constraints === 'object' && Object.values(error.constraints).map((constraint, constraintIndex) => (
                                        <li key={constraintIndex}>{constraint}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </Box>
                )}
            </Grid>
        </Grid>
    );
};

export default ApartmentForm;
