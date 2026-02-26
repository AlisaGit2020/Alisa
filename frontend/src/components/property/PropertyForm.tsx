import { Box, Divider, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { getNumber } from '../../lib/functions';
import { PropertyInput, PropertyStatus } from '@asset-types'
import { WithTranslation, withTranslation } from 'react-i18next';
import AssetNumberField from '../asset/form/AssetNumberField';
import AssetTextField from '../asset/form/AssetTextField';
import AssetDatePicker from '../asset/form/AssetDatePicker';
import { propertyContext } from '../../lib/asset-contexts';
import AssetFormHandler from '../asset/form/AssetFormHandler';
import { DTO } from '../../lib/types';
import DataService from '../../lib/data-service';
import { getFieldErrorProps } from '@asset-lib/form-utils';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PropertyPhotoUpload from './PropertyPhotoUpload';
import AssetContent from '../asset/AssetContent';
import { useAssetToast } from '../asset';
import axios from 'axios';
import ApiClient from '@asset-lib/api-client';
import { VITE_API_URL } from '../../constants';
import { PROPERTY_LIST_CHANGE_EVENT } from '../layout/PropertyBadge';
import { setTransactionPropertyId } from '@asset-lib/initial-data';
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from '../transaction/TransactionLeftMenuItems';
import { getPropertyStatusFromPath, getPropertyViewPath, getReturnPathForStatus } from './property-form-utils';


function PropertyForm({ t }: WithTranslation) {
    const { idParam } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useAssetToast();

    // Determine property status from URL path (e.g., /own/add vs /prospects/add)
    const statusFromPath = getPropertyStatusFromPath(location.pathname);

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
        status: statusFromPath,
        ownerships: [{ userId: 0, share: 100 }]
    });
    const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

    const handleNavigateBack = () => {
        const returnTo = (location.state as { returnTo?: string })?.returnTo;
        if (returnTo === 'view' && idParam) {
            // Navigate back to property view with correct status prefix
            navigate(getPropertyViewPath(data.status ?? PropertyStatus.OWN, idParam));
        } else {
            // Navigate back to the appropriate tab based on property status
            navigate(getReturnPathForStatus(data.status ?? PropertyStatus.OWN));
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

        // Auto-select the newly created property in PropertyBadge
        if (!idParam && propertyId) {
            setTransactionPropertyId(propertyId);
            window.dispatchEvent(
                new CustomEvent(TRANSACTION_PROPERTY_CHANGE_EVENT, {
                    detail: { propertyId },
                })
            );
            window.dispatchEvent(new CustomEvent(PROPERTY_LIST_CHANGE_EVENT));
        }

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
                // No separate toast - AssetFormHandler already shows "save success"
            } catch {
                showToast({ message: t('property:photoUploadError'), severity: "error" });
            }
        }
    }

    const renderFormContent = (fieldErrors: Partial<Record<keyof PropertyInput, string>>) => (
        <Box sx={{ maxWidth: 600 }}>
            <Stack spacing={2} marginBottom={2}>
                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 2 }}>
                        <AssetTextField
                            label={t('name')}
                            value={data.name}
                            autoFocus={true}
                            onChange={(e) => handleChange('name', e.target.value)}
                            {...getFieldErrorProps<PropertyInput>(fieldErrors, 'name')}
                        />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 120 }}>
                        <AssetTextField
                            label={t('apartmentType')}
                            value={data.apartmentType || ''}
                            onChange={(e) => handleChange('apartmentType', e.target.value)}
                        />
                    </Box>
                </Stack>
                <AssetTextField
                    label={t('address')}
                    value={data.address?.street || ''}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                />
                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <AssetTextField
                            label={t('postalCode')}
                            value={data.address?.postalCode || ''}
                            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                        />
                    </Box>
                    <Box sx={{ flex: 2 }}>
                        <AssetTextField
                            label={t('city')}
                            value={data.address?.city || ''}
                            onChange={(e) => handleAddressChange('city', e.target.value)}
                        />
                    </Box>
                </Stack>
                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <AssetNumberField
                            label={t('size')}
                            value={data.size}
                            onChange={(e) => handleChange('size', getNumber(e.target.value, 1))}
                            adornment='m2'
                            {...getFieldErrorProps<PropertyInput>(fieldErrors, 'size')}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <AssetNumberField
                            label={t('buildYear')}
                            value={data.buildYear || 0}
                            onChange={(e) => handleChange('buildYear', getNumber(e.target.value, 0) || undefined)}
                            {...getFieldErrorProps<PropertyInput>(fieldErrors, 'buildYear')}
                        />
                    </Box>
                </Stack>
                <AssetTextField
                    label={t('description')}
                    value={data.description || ''}
                    multiline
                    rows={4}
                    onChange={(e) => handleChange('description', e.target.value)}
                />

                {/* Monthly Costs Section */}
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                    {t('monthlyCostsSection')}
                </Typography>
                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <AssetNumberField
                            label={t('maintenanceFee')}
                            value={data.maintenanceFee ?? 0}
                            onChange={(e) => handleChange('maintenanceFee', getNumber(e.target.value, 0) || undefined)}
                            adornment='€'
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <AssetNumberField
                            label={t('waterCharge')}
                            value={data.waterCharge ?? 0}
                            onChange={(e) => handleChange('waterCharge', getNumber(e.target.value, 0) || undefined)}
                            adornment='€'
                        />
                    </Box>
                </Stack>
                <Stack direction="row" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <AssetNumberField
                            label={t('financialCharge')}
                            value={data.financialCharge ?? 0}
                            onChange={(e) => handleChange('financialCharge', getNumber(e.target.value, 0) || undefined)}
                            adornment='€'
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <AssetNumberField
                            label={data.status === PropertyStatus.PROSPECT ? t('expectedRent') : t('monthlyRent')}
                            value={data.monthlyRent ?? 0}
                            onChange={(e) => handleChange('monthlyRent', getNumber(e.target.value, 0) || undefined)}
                            adornment='€'
                        />
                    </Box>
                </Stack>

                {/* Purchase Info Section - for OWN and PROSPECT */}
                {(data.status === PropertyStatus.OWN || data.status === PropertyStatus.PROSPECT) && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                            {t('purchaseInfoSection')}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                                <AssetNumberField
                                    label={data.status === PropertyStatus.PROSPECT ? t('askingPrice') : t('purchasePrice')}
                                    value={data.purchasePrice ?? 0}
                                    onChange={(e) => handleChange('purchasePrice', getNumber(e.target.value, 0) || undefined)}
                                    adornment='€'
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <AssetNumberField
                                    label={t('debtShare')}
                                    value={data.debtShare ?? 0}
                                    onChange={(e) => handleChange('debtShare', getNumber(e.target.value, 0) || undefined)}
                                    adornment='€'
                                />
                            </Box>
                        </Stack>
                        {data.status === PropertyStatus.OWN && (
                            <Stack direction="row" spacing={2}>
                                <Box sx={{ flex: 1 }}>
                                    <AssetDatePicker
                                        label={t('purchaseDate')}
                                        value={data.purchaseDate ? new Date(data.purchaseDate) : null}
                                        onChange={(date) => handleChange('purchaseDate', date?.toDate() ?? undefined)}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <AssetNumberField
                                        label={t('purchaseLoan')}
                                        value={data.purchaseLoan ?? 0}
                                        onChange={(e) => handleChange('purchaseLoan', getNumber(e.target.value, 0) || undefined)}
                                        adornment='€'
                                    />
                                </Box>
                            </Stack>
                        )}
                    </>
                )}

                {/* Sale Info Section - for SOLD */}
                {data.status === PropertyStatus.SOLD && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                            {t('saleInfoSection')}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                                <AssetNumberField
                                    label={t('salePrice')}
                                    value={data.salePrice ?? 0}
                                    onChange={(e) => handleChange('salePrice', getNumber(e.target.value, 0) || undefined)}
                                    adornment='€'
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <AssetDatePicker
                                    label={t('saleDate')}
                                    value={data.saleDate ? new Date(data.saleDate) : null}
                                    onChange={(date) => handleChange('saleDate', date?.toDate() ?? undefined)}
                                />
                            </Box>
                        </Stack>
                    </>
                )}

                <Divider sx={{ my: 1 }} />
                <Box sx={{ maxWidth: 200 }}>
                    <AssetNumberField
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
        <AssetContent>
            <AssetFormHandler<DTO<PropertyInput>>
                id={Number(idParam)}
                dataService={dataService}
                data={data}
                renderForm={renderFormContent}
                onSetData={setData}
                validationRules={{
                    name: { required: true },
                    size: { required: true, min: 1, max: 1000 },
                    buildYear: { min: 1800, max: 2100 },
                }}
                translation={{
                    cancelButton: t('cancel'),
                    submitButton: t('save'),
                    validationMessageTitle: t('validationErrorTitle'),
                }}
                onCancel={handleNavigateBack}
                onAfterSubmit={handleNavigateBack}
                onSaveResult={handleSaveResult}
            />
        </AssetContent>
    );
}

export default withTranslation(propertyContext.name)(PropertyForm);
