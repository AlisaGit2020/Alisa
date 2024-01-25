import TextField from '@mui/material/TextField';
import { FormControlLabel, Stack, Switch } from '@mui/material';
import { useState } from 'react';

import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaForm from '../../alisa/AlisaForm';
import expenseTypeContext from '../../../alisa-contexts/expense-type';
import { ExpenseTypeInputDto } from '../../../../../backend/src/accounting/expense/dtos/expense-type-input.dto';
import AlisaTextField from '../../alisa/form/AlisaTextField';
import AlisaSwitch from '../../alisa/form/AlisaSwitch';
import { Tune } from '@mui/icons-material';

function ExpenseTypeForm({ t }: WithTranslation) {
    const [data, setData] = useState<ExpenseTypeInputDto>({
        name: '',
        description: '',
        isTaxDeductible: false
    });

    const handleChange = (
        name: keyof ExpenseTypeInputDto,
        value: ExpenseTypeInputDto[keyof ExpenseTypeInputDto]
    ) => {
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
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

        <AlisaForm<ExpenseTypeInputDto>
            t={t}
            alisaContext={expenseTypeContext}
            formComponents={formComponents}
            onSetData={setData}
            data={data}
            validateObject={new ExpenseTypeInputDto()}
        >
        </AlisaForm>
    );
}

export default withTranslation(expenseTypeContext.name)(ExpenseTypeForm);
