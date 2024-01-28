import axios from 'axios';
import { useState } from 'react';
import { getValidationErrors } from '../../lib/functions';
import { Box, Grid, Link, Paper } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import React from 'react';
import { ValidationError } from 'class-validator';
import { TFunction } from 'i18next';
import ApiClient from '../../lib/api-client';
import { TypeOrmRelationOption } from '../../lib/types';
import AlisaForm from './form/AlisaForm';
import AlisaContext from '../../alisa-contexts/alisa-contexts';


interface InputProps<T> {
    t: TFunction
    alisaContext: AlisaContext
    formComponents: JSX.Element
    onSetData: React.Dispatch<React.SetStateAction<T>>;
    data: object
    validateObject: object
    id?: number,
    relations?: TypeOrmRelationOption
}

function AlisaDataForm<T extends { id: number }>({
    t,
    alisaContext,
    formComponents,
    onSetData,
    data,
    validateObject,
    id,
    relations
}: InputProps<T>) {

    const { idParam } = useParams();
    const [errorMessage, setErrorMessage] = useState<string[]>([])    
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const navigate = useNavigate();

    if (!id) {
        id = Number(idParam)
    }

    React.useEffect(() => {
        const fetchData = async (id: number) => {
            const data = await ApiClient.get<T>(alisaContext.apiPath, id, relations);
            console.log(data)
            return data
        }

        if (id) {
            fetchData(Number(id))
                .then(onSetData)
        }
    }, [id])

    const handleSubmit = async () => {
        setErrorMessage([])
        setValidationErrors([])

        const valErrors = await getValidationErrors(validateObject, data);
        if (valErrors.length > 0) {
            valErrors.forEach((error: ValidationError) => {
                if (error.constraints && typeof error.constraints === 'object') {
                    Object.values(error.constraints).forEach((constraint: string) => {
                        validationErrors.push(constraint);
                    });
                }
            });
            console.log(valErrors)
            setValidationErrors(validationErrors);
            return;
        }

        try {

            if (id) {
                await ApiClient.put(alisaContext.apiPath, id, data);
            } else {
                await ApiClient.post(alisaContext.apiPath, data);
            }

            navigate(alisaContext.routePath)

        } catch (error) {
            handleApiError(error)
        }
    };

    const handleApiError = (error: unknown) => {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                setErrorMessage([error.response.data.message]);
            } else if (error.request) {
                setErrorMessage(['Request error']);
            } else {
                setErrorMessage(['An error occurred']);
            }
        } else {
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

                    <AlisaForm
                        formComponents={formComponents} 
                        submitButtonText={t('save')} 
                        cancelButtonText={t('cancel')} 
                        errorMessage={errorMessage} 
                        validationMessage={validationErrors} 
                        onSubmit={handleSubmit} 
                        onCancel={() => navigate(alisaContext.routePath)}                        
                    ></AlisaForm>

                </Grid>
            </Grid>
        </Paper>
    );
}

export default AlisaDataForm;
