import { Stack } from '@mui/material';
import { useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { IncomeTypeInputDto } from '@alisa-backend/accounting/income/dtos/income-type-input.dto';
import AlisaTextField from '../../alisa/form/AlisaTextField';
import { incomeTypeContext } from '@alisa-lib/alisa-contexts';
import DataService from '@alisa-lib/data-service';
import AlisaFormHandler from '../../alisa/form/AlisaFormHandler';
import { useNavigate, useParams } from 'react-router-dom';
import AlisaContent from '../../alisa/AlisaContent';

function IncomeTypeForm({ t }: WithTranslation) {
    const [data, setData] = useState<IncomeTypeInputDto>({
        name: '',
        description: '',
    });
    const { idParam } = useParams();
    const navigate = useNavigate();

    const dataService = new DataService<IncomeTypeInputDto>({
        context: incomeTypeContext,
        dataValidateInstance: new IncomeTypeInputDto()
    })

    const handleChange = (
        name: keyof IncomeTypeInputDto,
        value: IncomeTypeInputDto[keyof IncomeTypeInputDto]
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
        </Stack>
    )
    return (
        <AlisaContent headerText={t(idParam ? 'edit': 'add')}>
            <AlisaFormHandler<IncomeTypeInputDto>
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

                onCancel={() => navigate(incomeTypeContext.routePath)}
                onAfterSubmit={() => navigate(incomeTypeContext.routePath)}
            >
            </AlisaFormHandler>
        </AlisaContent>
    );
}

export default withTranslation(incomeTypeContext.name)(IncomeTypeForm);
