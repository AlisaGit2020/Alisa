import axios from 'axios';
import Button from '@mui/material/Button';
import { useState } from 'react';
import getApiUrl, { getValidationErrors } from '../../functions';
import { Alert, Box, ButtonGroup, Grid, Link, Paper } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import React from 'react';
import { ValidationError } from 'class-validator';
import { TFunction } from 'i18next';


interface InputProps<T> {
    t: TFunction
    alisaContext: AlisaContext
    formComponents: JSX.Element
    onSetData: React.Dispatch<React.SetStateAction<T>>;
    data: object
    validateObject: object
}

function AlisaForm<T extends object>({
    t,
    alisaContext,
    formComponents,
    onSetData,
    data,
    validateObject
}:InputProps<T>) {

    const { id } = useParams();
    const [errorMessage, setErrorMessage] = useState<string[]>([])
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
    const navigate = useNavigate();

    React.useEffect(() => {
        fetchData(Number(id))
            .then(onSetData)
    }, [])

    const fetchData = async (apartmentId: number) => {
        if (apartmentId) {
            try {
                const response = await axios.get(getApiUrl(`${alisaContext.apiPath}/${apartmentId}`));

                return response.data;
            } catch (error) {
                handleApiError(error);
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
                await axios.put(getApiUrl(`${alisaContext.apiPath}/${id}`), data);
            } else {
                await axios.post(getApiUrl(alisaContext.apiPath), data);
            }

            navigate(alisaContext.routePath)

        } catch (error) {
            handleApiError(error)
        }
    };

    const handleApiError = (error:unknown) => {
        if (axios.isAxiosError(error)){
            if (error.response) {
                setErrorMessage([error.response.data.message]);
            } else if (error.request) {
                setErrorMessage(['Request error']);
            } else {
                setErrorMessage(['An error occurred']);
            }
        }else{
            setErrorMessage([JSON.stringify(error)])
        }
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Grid container>
                <Grid item lg={6} xs={12}>
                    <Box marginBottom={3}>
                        <Link href={alisaContext.routePath} color="primary">
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
                            onClick={() => navigate(alisaContext.routePath)}>
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
        </Paper>
    );
}

export default AlisaForm;
