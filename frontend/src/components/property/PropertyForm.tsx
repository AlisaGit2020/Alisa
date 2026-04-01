import { Box, Divider, Stack, Typography } from '@mui/material';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getNumber, getNumberOrUndefined } from '../../lib/functions';
import { PropertyInput, PropertyStatus, PropertyType, propertyTypeNames, CurrentCharges, ChargeType, PropertyChargeInput } from '@asset-types'
import { calculateCharge, ChargeValues, ChargeFieldName } from './charge-calculation';
import dayjs from 'dayjs';
import { WithTranslation, withTranslation } from 'react-i18next';
import AssetNumberField from '../asset/form/AssetNumberField';
import AssetMoneyField from '../asset/form/AssetMoneyField';
import AssetSelectField from '../asset/form/AssetSelectField';
import AssetTextField from '../asset/form/AssetTextField';
import AssetDatePicker from '../asset/form/AssetDatePicker';
import { AssetSwitch } from '../asset';
import { propertyContext } from '../../lib/asset-contexts';
import AssetFormHandler from '../asset/form/AssetFormHandler';
import { DTO } from '../../lib/types';
import DataService from '../../lib/data-service';
import { getFieldErrorProps } from '@asset-lib/form-utils';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PropertyPhotoUpload from './PropertyPhotoUpload';
import PropertyChargeDialog from './sections/PropertyChargeDialog';
import AssetContent from '../asset/AssetContent';
import { useAssetToast, AssetButton } from '../asset';
import axios from 'axios';
import ApiClient from '@asset-lib/api-client';
import { VITE_API_URL } from '../../constants';
import { PROPERTY_LIST_CHANGE_EVENT } from '../layout/PropertyBadge';
import { setTransactionPropertyId } from '@asset-lib/initial-data';
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from '../transaction/TransactionLeftMenuItems';
import { getPropertyStatusFromPath, getPropertyViewPath, getReturnPathForStatus } from './property-form-utils';

// Property type select items
const propertyTypeItems = Array.from(propertyTypeNames.entries()).map(([id, key]) => ({
    id,
    key,
}));

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
            district: '',
        },
        buildYear: undefined,
        apartmentType: undefined,
        rooms: undefined,
        status: statusFromPath,
        ownerships: [{ userId: 0, share: 100 }],
        isAirbnb: false,
        distanceFromHome: undefined,
    });
    const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
    // Separate charge state - used for both add and edit modes
    const [charges, setCharges] = useState({
        maintenanceFee: 0,
        financialCharge: 0,
        waterCharge: 0,
        totalCharge: 0,
    });
    const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
    const isEditMode = !!idParam && Number(idParam) > 0;
    // Track which charge fields the user has touched (for calculation)
    // Using ref to avoid stale closure issues in useCallback
    const touchedChargeFieldsRef = useRef<Set<ChargeFieldName>>(new Set());

    // Fetch current charges in edit mode
    useEffect(() => {
        if (isEditMode) {
            ApiClient.request<CurrentCharges>({
                method: 'GET',
                url: `/real-estate/property/${idParam}/charges/current`,
            }).then((result) => {
                setCharges({
                    maintenanceFee: result.maintenanceFee ?? 0,
                    financialCharge: result.financialCharge ?? 0,
                    waterCharge: result.waterPrepayment ?? 0,
                    totalCharge: result.totalCharge ?? 0,
                });
            }).catch(() => {
                // Silently fail - charges will remain at 0
            });
        }
    }, [isEditMode, idParam]);

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
        field: 'street' | 'city' | 'postalCode' | 'district',
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

    // Handle charge field changes with auto-calculation (uses separate charges state)
    const handleChargeChange = useCallback((
        field: ChargeFieldName,
        value: number | undefined
    ) => {
        const numValue = value ?? 0;

        setCharges(prev => {
            const updated = { ...prev, [field]: numValue };

            touchedChargeFieldsRef.current.add(field);

            const currentValues: ChargeValues = {
                maintenanceFee: field === 'maintenanceFee' ? numValue : prev.maintenanceFee,
                financialCharge: field === 'financialCharge' ? numValue : prev.financialCharge,
                totalCharge: field === 'totalCharge' ? numValue : prev.totalCharge,
            };

            const calculated = calculateCharge(currentValues, touchedChargeFieldsRef.current);
            if (calculated) {
                updated[calculated.field] = calculated.value;
            }

            return updated;
        });
    }, []);

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

        // Create charges for new properties only via batch API
        if (!idParam && propertyId) {
            const chargeInputs: PropertyChargeInput[] = [];
            const startDate = data.purchaseDate
                ? dayjs(data.purchaseDate).format('YYYY-MM-DD')
                : null;

            if (charges.maintenanceFee > 0) {
                chargeInputs.push({
                    propertyId,
                    chargeType: ChargeType.MAINTENANCE_FEE,
                    amount: charges.maintenanceFee,
                    startDate,
                });
            }
            if (charges.financialCharge > 0) {
                chargeInputs.push({
                    propertyId,
                    chargeType: ChargeType.FINANCIAL_CHARGE,
                    amount: charges.financialCharge,
                    startDate,
                });
            }
            if (charges.waterCharge > 0) {
                chargeInputs.push({
                    propertyId,
                    chargeType: ChargeType.WATER_PREPAYMENT,
                    amount: charges.waterCharge,
                    startDate,
                });
            }

            if (chargeInputs.length > 0) {
                try {
                    await ApiClient.request({
                        method: 'POST',
                        url: `/real-estate/property/${propertyId}/charges/batch`,
                        data: chargeInputs,
                    });
                } catch {
                    showToast({ message: t('property:report.fetchError'), severity: "error" });
                }
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
                    <Box sx={{ flex: 1, minWidth: 150 }}>
                        <AssetSelectField
                            label={t('apartmentType')}
                            value={data.apartmentType ?? ''}
                            items={propertyTypeItems}
                            t={t}
                            translateKeyPrefix="property-type"
                            onChange={(e) => handleChange('apartmentType', e.target.value ? Number(e.target.value) as PropertyType : undefined)}
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
                    <Box sx={{ flex: 1 }}>
                        <AssetTextField
                            label={t('district')}
                            value={data.address?.district || ''}
                            onChange={(e) => handleAddressChange('district', e.target.value)}
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
                        <AssetTextField
                            label={t('rooms')}
                            value={data.rooms || ''}
                            onChange={(e) => handleChange('rooms', e.target.value || undefined)}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <AssetNumberField
                            label={t('buildYear')}
                            value={data.buildYear || 0}
                            onChange={(e) => handleChange('buildYear', getNumberOrUndefined(e.target.value, 0))}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                        {t('monthlyCostsSection')}
                    </Typography>
                    {isEditMode && (
                        <AssetButton
                            label={t('manageCharges')}
                            variant="text"
                            size="small"
                            onClick={() => setChargeDialogOpen(true)}
                        />
                    )}
                </Box>

                {isEditMode ? (
                    // Edit mode: readonly display
                    <>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                                <AssetMoneyField
                                    label={t('maintenanceFee')}
                                    value={charges.maintenanceFee}
                                    disabled
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <AssetMoneyField
                                    label={t('financialCharge')}
                                    value={charges.financialCharge}
                                    disabled
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <AssetMoneyField
                                    label={t('totalCharge')}
                                    value={charges.totalCharge}
                                    disabled
                                />
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Box sx={{ flex: 1, maxWidth: 200 }}>
                                <AssetMoneyField
                                    label={data.status === PropertyStatus.PROSPECT ? t('expectedRent') : t('monthlyRent')}
                                    value={data.monthlyRent ?? 0}
                                    onChange={(value) => handleChange('monthlyRent', value)}
                                />
                            </Box>
                        </Stack>
                    </>
                ) : (
                    // Add mode: editable fields
                    <>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                                <AssetMoneyField
                                    label={t('maintenanceFee')}
                                    value={charges.maintenanceFee}
                                    onChange={(value) => handleChargeChange('maintenanceFee', value)}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <AssetMoneyField
                                    label={t('financialCharge')}
                                    value={charges.financialCharge}
                                    onChange={(value) => handleChargeChange('financialCharge', value)}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <AssetMoneyField
                                    label={t('totalCharge')}
                                    value={charges.totalCharge}
                                    onChange={(value) => handleChargeChange('totalCharge', value)}
                                />
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                                <AssetMoneyField
                                    label={t('waterCharge')}
                                    value={charges.waterCharge}
                                    onChange={(value) => setCharges(prev => ({ ...prev, waterCharge: value ?? 0 }))}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <AssetMoneyField
                                    label={data.status === PropertyStatus.PROSPECT ? t('expectedRent') : t('monthlyRent')}
                                    value={data.monthlyRent ?? 0}
                                    onChange={(value) => handleChange('monthlyRent', value)}
                                />
                            </Box>
                        </Stack>
                    </>
                )}

                {/* Airbnb Settings Section */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1 }}>
                    {t('airbnbSettingsSection')}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                    <AssetSwitch
                        label={t('isAirbnb')}
                        value={data.isAirbnb ?? false}
                        onChange={(_, checked) => handleChange('isAirbnb', checked)}
                    />
                    <Box sx={{ flex: 1, maxWidth: 200 }}>
                        <AssetNumberField
                            label={t('distanceFromHome')}
                            value={data.distanceFromHome ?? ''}
                            onChange={(e) => handleChange('distanceFromHome', e.target.value ? parseFloat(e.target.value) : undefined)}
                            adornment="km"
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
                                <AssetMoneyField
                                    label={data.status === PropertyStatus.PROSPECT ? t('askingPrice') : t('purchasePrice')}
                                    value={data.purchasePrice ?? 0}
                                    onChange={(value) => handleChange('purchasePrice', value)}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <AssetMoneyField
                                    label={t('debtShare')}
                                    value={data.debtShare ?? 0}
                                    onChange={(value) => handleChange('debtShare', value)}
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
                                    <AssetMoneyField
                                        label={t('purchaseLoan')}
                                        value={data.purchaseLoan ?? 0}
                                        onChange={(value) => handleChange('purchaseLoan', value)}
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
                                <AssetMoneyField
                                    label={t('salePrice')}
                                    value={data.salePrice ?? 0}
                                    onChange={(value) => handleChange('salePrice', value)}
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
            {isEditMode && (
                <PropertyChargeDialog
                    open={chargeDialogOpen}
                    propertyId={Number(idParam)}
                    onClose={() => setChargeDialogOpen(false)}
                    onChargesUpdated={() => {
                        // Refetch charges
                        ApiClient.request<CurrentCharges>({
                            method: 'GET',
                            url: `/real-estate/property/${idParam}/charges/current`,
                        }).then((result) => {
                            setCharges({
                                maintenanceFee: result.maintenanceFee ?? 0,
                                financialCharge: result.financialCharge ?? 0,
                                waterCharge: result.waterPrepayment ?? 0,
                                totalCharge: result.totalCharge ?? 0,
                            });
                        });
                    }}
                />
            )}
        </AssetContent>
    );
}

export default withTranslation(propertyContext.name)(PropertyForm);
