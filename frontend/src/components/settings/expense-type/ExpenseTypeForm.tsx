import { Stack, FormHelperText, Box } from '@mui/material';
import { useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { ExpenseTypeInputDto } from '@alisa-backend/accounting/expense/dtos/expense-type-input.dto';
import AlisaTextField from '../../alisa/form/AlisaTextField';
import AlisaSwitch from '../../alisa/form/AlisaSwitch';
import { expenseTypeContext } from '@alisa-lib/alisa-contexts';
import DataService from '@alisa-lib/data-service';
import AlisaFormHandler from '../../alisa/form/AlisaFormHandler';
import AlisaContent from '../../alisa/AlisaContent';

interface ExpenseTypeFormProps extends WithTranslation {
    id?: number;
    onCancel: () => void;
    onAfterSubmit: () => void;
}

function ExpenseTypeForm({ t, id, onCancel, onAfterSubmit }: ExpenseTypeFormProps) {
    const [data, setData] = useState<ExpenseTypeInputDto>({
        name: '',
        description: '',
        isTaxDeductible: false,
        isCapitalImprovement: false
    });

    const dataService = new DataService<ExpenseTypeInputDto>({
        context: expenseTypeContext,
        dataValidateInstance: new ExpenseTypeInputDto()
    })

    const handleChange = (
        name: keyof ExpenseTypeInputDto,
        value: ExpenseTypeInputDto[keyof ExpenseTypeInputDto]
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
                value={data.isTaxDeductible}
                onChange={(e) => handleChange('isTaxDeductible', e.target.checked)}
                label={t('isTaxDeductible')}
            />
            <Box>
                <AlisaSwitch
                    value={data.isCapitalImprovement}
                    onChange={(e) => handleChange('isCapitalImprovement', e.target.checked)}
                    label={t('isCapitalImprovement')}
                />
                <FormHelperText sx={{ ml: 2 }}>
                    {t('isCapitalImprovementHelp')}
                </FormHelperText>
            </Box>
        </Stack>
    )
    return (
        <AlisaContent headerText={t(id ? 'edit': 'add')}>
            <AlisaFormHandler<ExpenseTypeInputDto>
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

export default withTranslation(expenseTypeContext.name)(ExpenseTypeForm);
