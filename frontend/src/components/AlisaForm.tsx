import axios from 'axios';
import Button from '@mui/material/Button';
import { useState } from 'react';
import getApiUrl, { getValidationErrors } from '../functions';
import { Alert, Box, ButtonGroup, Grid, Link, List, ListItem } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import React from 'react';
import { ValidationError } from 'class-validator';
import { TFunction } from 'i18next';


interface InputProps {
    t: TFunction
    apiUrl: string
    backUrl: string
    formComponents: any
    onSetData: (any)
    data: object,
    validateObject: object
}

const AlisaForm: React.FC<InputProps> = ({
    t,
    apiUrl,
    backUrl,
    formComponents,
    onSetData,
    data,
    validateObject
}) => {

    const { id } = useParams();
    const [errorMessage, setErrorMessage] = useState<String[]>([])
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
    const navigate = useNavigate();

    React.useEffect(() => {
        fetchData(Number(id))
            .then(onSetData)
    }, [])

    const fetchData = async (apartmentId: number) => {
        if (apartmentId) {
            try {
                const response = await axios.get(getApiUrl(`${apiUrl}/${apartmentId}`));

                return response.data
            } catch (error: any) {
                setErrorMessage([error.message]);
            }
        }
        return data
    }

    const handleSubmit = async () => {
        setErrorMessage([])
        setValidationErrors([])

        const validationErrors = await getValidationErrors(validateObject, data);
        if (validationErrors.length > 0) {
            setValidationErrors(validationErrors);
            return;
        }

        try {

            if (id) {
                await axios.put(getApiUrl(`${apiUrl}/${id}`), data);
            } else {
                await axios.post(getApiUrl(apiUrl), data);
            }

            navigate(backUrl)

        } catch (error: any) {
            if (error.response) {
                setErrorMessage([error.response.data.message]);
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
                    <Link href={backUrl} color="primary">
                        {t('back')}
                    </Link>
                </Box>

                {formComponents}

                <ButtonGroup>
                    <Button variant="contained" color="primary"
                        onClick={handleSubmit}>
                        {t('save')}
                    </Button>
                    <Button variant="outlined"
                        onClick={() => navigate(backUrl)}>
                        {t('cancel')}
                    </Button>
                </ButtonGroup>

                {(errorMessage.length > 0 || validationErrors.length > 0) && (

                    <Box marginTop={3} sx={{ padding: 1 }}>
                        {errorMessage.map((message, index) => (
                            <Alert severity="error" key={index}>{message}</Alert>
                        ))}
                        {validationErrors.length > 0 && (
                            <Alert severity="warning">
                                <b>Please correct following data</b>
                                <Box>
                                    {validationErrors.map((error: ValidationError, index) => (
                                        <Box key={index}>
                                            {error.constraints &&
                                                typeof error.constraints === 'object' &&
                                                Object.values(error.constraints).map((constraint, constraintIndex) => (
                                                    <div key={constraintIndex}>{constraint}</div>
                                                ))}
                                        </Box>
                                    ))}
                                </Box>
                            </Alert>
                        )}
                    </Box>
                )}
            </Grid>
        </Grid>
    );
};

export default AlisaForm;
