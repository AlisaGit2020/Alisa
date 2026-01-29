import { Stack } from '@mui/material';
import { useState } from 'react';
import { getNumber } from '../../lib/functions';
import { PropertyInputDto } from '@alisa-backend/real-estate/property/dtos/property-input.dto'
import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaNumberField from '../alisa/form/AlisaNumberField';
import AlisaTextField from '../alisa/form/AlisaTextField';
import { propertyContext } from '../../lib/alisa-contexts';
import AlisaFormHandler from '../alisa/form/AlisaFormHandler';
import { DTO } from '../../lib/types';
import DataService from '../../lib/data-service';
import { useNavigate, useParams } from 'react-router-dom';
import PropertyPhotoUpload from './PropertyPhotoUpload';


function PropertyForm({ t }: WithTranslation) {
    const [data, setData] = useState<DTO<PropertyInputDto>>({
        id: 0,
        name: '',
        size: 0,
        photo: undefined
    });
    const { idParam } = useParams();
    const navigate = useNavigate();

    const dataService = new DataService<DTO<PropertyInputDto>>({
        context: propertyContext,
        dataValidateInstance: new PropertyInputDto()
    })

    const handleChange = (
        name: keyof PropertyInputDto,
        value: PropertyInputDto[keyof PropertyInputDto]
    ) => {
        setData(dataService.updateNestedData(data, name, value));
    }

    const formComponents = (
        <Stack spacing={2} marginBottom={2}>
            <AlisaTextField
                label={t('name')}
                value={data.name}
                autoFocus={true}
                onChange={(e) => handleChange('name', e.target.value)}
            />
            <AlisaNumberField
                label={t('size')}
                value={data.size}
                onChange={(e) => handleChange('size', getNumber(e.target.value, 1))}
                adornment='m2'
            />
            {data.id !== 0 && (
                <PropertyPhotoUpload
                    propertyId={data.id}
                    currentPhoto={data.photo}
                    onPhotoChange={(photoPath) => {
                        setData({ ...data, photo: photoPath || undefined });
                    }}
                />
            )}
        </Stack>
    )

    return (

        <AlisaFormHandler<DTO<PropertyInputDto>>
            id={Number(idParam)}
            dataService={dataService}
            data={data}
            formComponents={formComponents}
            onSetData={setData}
            translation={{
                cancelButton: t('cancel'),
                submitButton: t('save'),
                validationMessageTitle: t('validationErrorTitle'),
            }}

            onCancel={() => navigate(propertyContext.routePath)}
            onAfterSubmit={() => navigate(propertyContext.routePath)}
        >
        </AlisaFormHandler>
    );
}

export default withTranslation(propertyContext.name)(PropertyForm);
