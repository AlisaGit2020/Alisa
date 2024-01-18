import axios from 'axios';
import { useState } from 'react';
import getApiUrl from '../../functions';
import { MenuItem, Select } from '@mui/material';
import React from 'react';


interface InputProps<T> {
    //onHandleChange: React.Dispatch<SelectChangeEvent>;
    onHandleChange: (fieldName: keyof T, value: T[keyof T]) => void;
    value: string;
    apiUrl: string

}

function AlisaSelect<T extends object>({
    onHandleChange,
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
            const response = await axios.get(getApiUrl(`${apiUrl}`));

            return response.data;
        } catch (error) {
            handleApiError(error);
        }

        return data
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
                onChange={(e) => onHandleChange('property' as keyof T, e.target.value as T[keyof T])}
            >
                {data.map((item) => (
                    <MenuItem key={item.id as string} value={item.id}>{item.name}</MenuItem>
                ))}

            </Select>
        )
    );
}

export default AlisaSelect;
