import TextField from '@mui/material/TextField';
import { Stack } from '@mui/material';
import AlisaForm from '../alisa/AlisaForm';
import { useState } from 'react';
import { getNumber } from '../../functions';
import { PropertyInputDto } from '../../../../backend/src/real-estate/property/dtos/property-input.dto'
import { WithTranslation, withTranslation } from 'react-i18next';
import apartmentContext from '../../alisa-contexts/apartment';


function ApartmentForm({ t }: WithTranslation) {
    const [data, setData] = useState<PropertyInputDto>({
        name: '',
        size: 0
    });

    const handleChange = (
        name: keyof PropertyInputDto,
        value: PropertyInputDto[keyof PropertyInputDto]
    ) => {
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    }

    const formComponents = (
        <Stack spacing={2} marginBottom={2}>
            <TextField
                label={t('name')}
                value={data.name}
                autoComplete='off'
                autoFocus={true}
                onChange={(e) => handleChange('name', e.target.value)}
            />
            <TextField
                type='number'
                label={t('size')}
                value={data.size}
                autoComplete='off'
                onChange={(e) => handleChange('size', getNumber(e.target.value, 1))}
            />
        </Stack>
    )
    return (

        <AlisaForm<PropertyInputDto>
            t={t}
            alisaContext={apartmentContext}
            formComponents={formComponents}
            onSetData={setData}
            data={data}
            validateObject={new PropertyInputDto()}
        >
        </AlisaForm>
    );
}

export default withTranslation(apartmentContext.name)(ApartmentForm);
