import axios from 'axios';
import { useState } from 'react';
import { MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
import React from 'react';
import ApiClient from '../../lib/api-client';
import { TypeOrmFetchOptions } from '../../lib/types';
import AlisaSelectField from './form/AlisaSelectField';


interface InputProps<T1, T2 extends{id: number, name: string}> {    
    onHandleChange: (fieldName: keyof T1, value: T1[keyof T1]) => void
    label: string
    fieldName: keyof T1
    value: T1[keyof T1]
    apiUrl: string
    fetchOptions?: TypeOrmFetchOptions<T2>
}

function AlisaSelect<T1, T2 extends{id: number, name: string}>({
    onHandleChange,
    label,
    fieldName,
    value,
    apiUrl,
    fetchOptions

}: InputProps<T1, T2>) {

    const [data, setData] = useState<T2[]>([])    

    React.useEffect(() => {
        fetchData()
            .then(setData)
    }, [])


    const fetchData = async () => {

        try {
            const result = await ApiClient.search<T2>(apiUrl, fetchOptions);            
                       
            return result;
        } catch (error) {
            handleApiError(error);
        }

        return data
    }

    const handleChange = (e: SelectChangeEvent<NonNullable<T1[keyof T1]>>) => {
        const selectedValue = e.target.value as T1[keyof T1]        
        onHandleChange(fieldName, selectedValue)
    }

    const handleApiError = (error: unknown) => {
        if (axios.isAxiosError(error)) { /* empty */ }
    }

    return (

        (data.length > 0 && value) && (
            <AlisaSelectField                
                select
                value={value as number}
                label={label}
                items={data}
                onChange={handleChange}                
            >

            </AlisaSelectField>
        )
    );
}

export default AlisaSelect;
