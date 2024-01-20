import axios from 'axios';
import { useState } from 'react';
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React from 'react';
import ApiClient from '../../lib/api-client';


interface InputProps<T extends {id: number}> {    
    onHandleChange: (fieldName: keyof T, value: T[keyof T]) => void;
    fieldName: keyof T
    value: T[keyof T];
    apiUrl: string

}

function AlisaSelect<T extends {id: number}>({
    onHandleChange,
    fieldName,
    value,
    apiUrl,

}: InputProps<T>) {

    const [data, setData] = useState<T[]>([])    

    React.useEffect(() => {
        fetchData()
            .then(setData)
    }, [])


    const fetchData = async () => {

        try {
            const result = await ApiClient.search<T>(apiUrl);            
                       
            return result;
        } catch (error) {
            handleApiError(error);
        }

        return data
    }

    const handleChange = (e: SelectChangeEvent<NonNullable<T[keyof T]>>) => {
        const selectedValue = e.target.value as T[keyof T]        
        onHandleChange(fieldName, selectedValue)
    }

    const handleApiError = (error: unknown) => {
        if (axios.isAxiosError(error)) { /* empty */ }
    }

    return (

        (data.length > 0 && value) && (
            <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={value}
                label="Age"
                onChange={(e) => handleChange(e)}
            >
                {data.map((item) => (
                    <MenuItem key={item.id as string} value={item.id}>{item.name}</MenuItem>
                ))}

            </Select>
        )
    );
}

export default AlisaSelect;
