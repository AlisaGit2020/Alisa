import axios from 'axios';
import { ChangeEventHandler, useState } from 'react';
import React from 'react';
import AlisaSelectField from './form/AlisaSelectField';
import DataService from '@alisa-lib/data-service';


interface InputProps<T1, T2 extends{id: number, name: string}> {    
    onHandleChange: (fieldName: keyof T1, value: T1[keyof T1]) => void
    label: string
    fieldName: keyof T1
    value: T1[keyof T1]
    dataService: DataService<T2>
}

function AlisaSelect<T1, T2 extends{id: number, name: string}>({
    onHandleChange,
    label,
    fieldName,
    value,
    dataService

}: InputProps<T1, T2>) {

    const [data, setData] = useState<T2[]>([])    

    React.useEffect(() => {
        const fetchData = async () => {

            try {
                const result = await dataService.search();            
                           
                return result;
            } catch (error) {
                handleApiError(error);
            }
    
            return data
        }

        fetchData()
            .then(setData)
    }, [])


    const handleChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined = (e) => {
        const selectedValue = e.target.value as T1[keyof T1]        
        onHandleChange(fieldName, selectedValue)
    }

    const handleApiError = (error: unknown) => {
        if (axios.isAxiosError(error)) { /* empty */ }
    }

    return (

        (data.length > 0 && value) && (
            <AlisaSelectField                                
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
