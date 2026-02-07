import { Stack } from '@mui/material';
import { useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { IncomeTypeInput } from '@alisa-types';
import AlisaTextField from '../../alisa/form/AlisaTextField';
import AlisaSwitch from '../../alisa/form/AlisaSwitch';
import { incomeTypeContext } from '@alisa-lib/alisa-contexts';
import DataService from '@alisa-lib/data-service';
import AlisaFormHandler from '../../alisa/form/AlisaFormHandler';
import AlisaContent from '../../alisa/AlisaContent';

interface IncomeTypeFormProps extends WithTranslation {
    id?: number;
    onCancel: () => void;
    onAfterSubmit: () => void;
}

function IncomeTypeForm({ t, id, onCancel, onAfterSubmit }: IncomeTypeFormProps) {
    const [data, setData] = useState<IncomeTypeInput>({
        name: '',
        description: '',
        isTaxable: false
    });

    const dataService = new DataService<IncomeTypeInput>({
        context: incomeTypeContext,
    })

    const handleChange = (
        name: keyof IncomeTypeInput,
        value: IncomeTypeInput[keyof IncomeTypeInput]
    ) => {
        setData(dataService.updateNestedData(data, name, value));
    }

    const formComponents = (
        <Stack spacing={2} marginBottom={2}>
            <AlisaTextField
                label={t('name')}
                value={data.name}
                autoComplete='off'
                autoFocus={true}
                onChange={(e) => handleChange('name', e.target.value)}
            />
            <AlisaTextField
                label={t('description')}
                value={data.description}
                autoComplete='off'
                onChange={(e) => handleChange('description', e.target.value)}
            />
            <AlisaSwitch
                value={data.isTaxable}
                onChange={(e) => handleChange('isTaxable', e.target.checked)}
                label={t('isTaxable')}
            />
        </Stack>
    )
    return (
        <AlisaContent headerText={t(id ? 'edit': 'add')}>
            <AlisaFormHandler<IncomeTypeInput>
                id={id}
                dataService={dataService}
                data={data}
                formComponents={formComponents}
                onSetData={setData}
                translation={{
                    cancelButton: t('cancel'),
                    submitButton: t('save'),
                    validationMessageTitle: t('validationErrorTitle'),
                }}
                onCancel={onCancel}
                onAfterSubmit={onAfterSubmit}
            >
            </AlisaFormHandler>
        </AlisaContent>
    );
}

export default withTranslation(incomeTypeContext.name)(IncomeTypeForm);
