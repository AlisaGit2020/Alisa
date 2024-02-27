import { Stack } from '@mui/material';
import { useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { ExpenseTypeInputDto } from '@alisa-backend/accounting/expense/dtos/expense-type-input.dto';
import AlisaTextField from '../../alisa/form/AlisaTextField';
import AlisaSwitch from '../../alisa/form/AlisaSwitch';
import { expenseTypeContext } from '@alisa-lib/alisa-contexts';
import DataService from '@alisa-lib/data-service';
import AlisaFormHandler from '../../alisa/form/AlisaFormHandler';
import { useNavigate, useParams } from 'react-router-dom';
import AlisaContent from '../../alisa/AlisaContent';

function ExpenseTypeForm({ t }: WithTranslation) {
    const [data, setData] = useState<ExpenseTypeInputDto>({
        name: '',
        description: '',
        isTaxDeductible: false
    });
    const { idParam } = useParams();
    const navigate = useNavigate();

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
        </Stack>
    )
    return (
        <AlisaContent headerText={t(idParam ? 'edit': 'add')}>
            <AlisaFormHandler<ExpenseTypeInputDto>
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

                onCancel={() => navigate(expenseTypeContext.routePath)}
                onAfterSubmit={() => navigate(expenseTypeContext.routePath)}
            >
            </AlisaFormHandler>
        </AlisaContent>
    );
}

export default withTranslation(expenseTypeContext.name)(ExpenseTypeForm);
