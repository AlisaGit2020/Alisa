import TextField from '@mui/material/TextField';
import { Stack } from '@mui/material';
import AlisaForm from '../AlisaForm';
import { useState } from 'react';
import { getNumber } from '../../functions';
import { PropertyInputDto } from '../../../../backend/src/real-estate/property/dtos/property-input.dto'


const ApartmentForm = () => {
    const [data, setData] = useState({
        name: '',
        size: 0
    });

    const handleChange = (
        name: string,
        value: any
    ) => {
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    }

    const formComponents = (
        <Stack spacing={2} marginBottom={2}>
            <TextField
                label="Apartment Name"
                value={data.name}
                autoComplete='off'
                autoFocus={true}
                onChange={(e) => handleChange('name', e.target.value)}
            />
            <TextField
                type='number'
                label="Apartment size"
                value={data.size}
                autoComplete='off'
                onChange={(e) => handleChange('size', getNumber(e.target.value, 1))}
            />
        </Stack>
    )
    return (

        <AlisaForm
            apiUrl='real-estate/property'
            backUrl='/apartments'
            formComponents={formComponents}
            onSetData={setData}
            data={data}
            validateObject={new PropertyInputDto()}
        >
        </AlisaForm>
    );
};

export default ApartmentForm;
