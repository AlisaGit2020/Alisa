import { Box, Stack } from '@mui/material';
import { useState } from 'react';
import { getNumber } from '../../lib/functions';
import { PropertyInput } from '@alisa-types'
import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaNumberField from '../alisa/form/AlisaNumberField';
import AlisaTextField from '../alisa/form/AlisaTextField';
import { propertyContext } from '../../lib/alisa-contexts';
import AlisaFormHandler from '../alisa/form/AlisaFormHandler';
import { DTO } from '../../lib/types';
import DataService from '../../lib/data-service';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PropertyPhotoUpload from './PropertyPhotoUpload';
import AlisaContent from '../alisa/AlisaContent';
import { useToast } from '../alisa';
import axios from 'axios';
import ApiClient from '@alisa-lib/api-client';
import { VITE_API_URL } from '../../constants';


function PropertyForm({ t }: WithTranslation) {
    const [data, setData] = useState<DTO<PropertyInput>>({
        id: 0,
        name: '',
        size: 0,
        photo: undefined,
        description: '',
        address: {
            street: '',
            city: '',
            postalCode: '',
        },
        buildYear: undefined,
        apartmentType: '',
        ownerships: [{ userId: 0, share: 100 }]
    });
    const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
    const { idParam } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const handleNavigateBack = () => {
        const returnTo = (location.state as { returnTo?: string })?.returnTo;
        if (returnTo === 'view' && idParam) {
            navigate(`${propertyContext.routePath}/${idParam}`);
        } else {
            navigate(propertyContext.routePath);
        }
    };

    const dataService = new DataService<DTO<PropertyInput>>({
        context: propertyContext,
        relations: { ownerships: true },
    })

    const handleChange = (
        name: keyof PropertyInput,
        value: PropertyInput[keyof PropertyInput]
    ) => {
        setData(dataService.updateNestedData(data, name, value));
    }

    const handleOwnershipChange = (share: number) => {
        const ownerships = data.ownerships ?? [{ userId: 0, share: 100 }];
        const updatedOwnerships = [{ ...ownerships[0], share }];
        setData({ ...data, ownerships: updatedOwnerships });
    }

    const handleAddressChange = (
        field: 'street' | 'city' | 'postalCode',
        value: string
    ) => {
        setData({
            ...data,
            address: {
                ...data.address,
                [field]: value,
            },
        });
    }

    const handleSaveResult = async (result: DTO<PropertyInput>) => {
        // Upload pending photo after property is saved
        // Note: ApiClient.post returns AxiosResponse, so we need to handle both cases
        const savedProperty = 'data' in result && result.data ? (result.data as DTO<PropertyInput>) : result;
        const propertyId = savedProperty.id;

        if (pendingPhoto && propertyId) {
            try {
                const formData = new FormData();
                formData.append('photo', pendingPhoto);

                const options = await ApiClient.getOptions({
                    'Content-Type': 'multipart/form-data',
                });

                await axios.post(
                    `${VITE_API_URL}/real-estate/property/${propertyId}/photo`,
                    formData,
                    options
                );
                // No separate toast - AlisaFormHandler already shows "save success"
            } catch {
                showToast({ message: t('property:photoUploadError'), severity: "error" });
            }
        }
    }

    const formComponents = (
        <Box sx={{ maxWidth: 600 }}>
            <Stack spacing={2} marginBottom={2}>
                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 2 }}>
                        <AlisaTextField
                            label={t('name')}
                            value={data.name}
                            autoFocus={true}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 120 }}>
                        <AlisaTextField
                            label={t('apartmentType')}
                            value={data.apartmentType || ''}
                            onChange={(e) => handleChange('apartmentType', e.target.value)}
                        />
                    </Box>
                </Stack>
                <AlisaTextField
                    label={t('address')}
                    value={data.address?.street || ''}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                />
                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <AlisaTextField
                            label={t('postalCode')}
                            value={data.address?.postalCode || ''}
                            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                        />
                    </Box>
                    <Box sx={{ flex: 2 }}>
                        <AlisaTextField
                            label={t('city')}
                            value={data.address?.city || ''}
                            onChange={(e) => handleAddressChange('city', e.target.value)}
                        />
                    </Box>
                </Stack>
                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <AlisaNumberField
                            label={t('size')}
                            value={data.size}
                            onChange={(e) => handleChange('size', getNumber(e.target.value, 1))}
                            adornment='m2'
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <AlisaNumberField
                            label={t('buildYear')}
                            value={data.buildYear || 0}
                            onChange={(e) => handleChange('buildYear', getNumber(e.target.value, 0) || undefined)}
                        />
                    </Box>
                </Stack>
                <AlisaTextField
                    label={t('description')}
                    value={data.description || ''}
                    multiline
                    rows={4}
                    onChange={(e) => handleChange('description', e.target.value)}
                />
                <Box sx={{ maxWidth: 200 }}>
                    <AlisaNumberField
                        label={t('ownershipShare')}
                        value={data.ownerships?.[0]?.share ?? 100}
                        onChange={(e) => handleOwnershipChange(getNumber(e.target.value, 1))}
                        adornment='%'
                    />
                </Box>
                {data.id === 0 ? (
                    <PropertyPhotoUpload
                        propertyId={0}
                        pendingMode={true}
                        pendingFile={pendingPhoto}
                        onFileSelected={setPendingPhoto}
                    />
                ) : (
                    <PropertyPhotoUpload
                        propertyId={data.id}
                        currentPhoto={data.photo}
                        onPhotoChange={(photoPath) => {
                            setData({ ...data, photo: photoPath || undefined });
                        }}
                    />
                )}
            </Stack>
        </Box>
    )

    return (
        <AlisaContent>
            <AlisaFormHandler<DTO<PropertyInput>>
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
                onCancel={handleNavigateBack}
                onAfterSubmit={handleNavigateBack}
                onSaveResult={handleSaveResult}
            >
            </AlisaFormHandler>
        </AlisaContent>
    );
}

export default withTranslation(propertyContext.name)(PropertyForm);
