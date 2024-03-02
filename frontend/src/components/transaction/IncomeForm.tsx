import { Stack } from '@mui/material';
import { useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { propertyContext, incomeContext, incomeTypeContext, transactionContext } from '@alisa-lib/alisa-contexts';
import AlisaFormHandler from '../alisa/form/AlisaFormHandler';
import DataService from '@alisa-lib/data-service';
import { IncomeInputDto } from '@alisa-backend/accounting/income/dtos/income-input.dto';
import AlisaSelect from '../alisa/AlisaSelect';
import { IncomeType } from '@alisa-backend/accounting/income/entities/income-type.entity';
import React from 'react';
import AlisaLoadingProgress from '../alisa/AlisaLoadingProgress';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';
import TransactionFormFields from './components/TransactionFormFields';
import AlisaContent from '../alisa/AlisaContent';

interface IncomeFormProps extends WithTranslation {
    id?: number,
    propertyId?: number,
    onAfterSubmit: () => void,
    onCancel: () => void
}

function IncomeForm({ t, id, propertyId, onAfterSubmit, onCancel }: IncomeFormProps) {

    const [data, setData] = useState<IncomeInputDto>(new IncomeInputDto());

    const dataService = new DataService<IncomeInputDto>({
        context: incomeContext,
        relations: { transaction: true },
        dataValidateInstance: new IncomeInputDto()
    })

    React.useEffect(() => {
        if (id === undefined) {
            const fetchData = async () => {
                const defaults = await dataService.getDefaults();
                if (propertyId) {
                    defaults.propertyId = propertyId
                }
                return defaults
            }

            fetchData()
                .then(setData)
        }

    }, [])

    const handleChange = async (
        name: string,
        value: unknown
    ) => {

        let newData = dataService.updateNestedData(data, name, value)

        if (name === 'transaction.totalAmount') {
            let amount = 0
            if (data.transaction.quantity > 0) {
                amount = Number(value) / data.transaction.quantity
            }
            newData = dataService.updateNestedData(newData, 'transaction.amount', amount);
        }
        if (name === 'transaction.quantity') {
            if (Number(value) == 0) {
                newData = dataService.updateNestedData(newData, 'transaction.quantity', 1);
            }

            const amount = data.transaction.totalAmount / Number(value)
            newData = dataService.updateNestedData(newData, 'transaction.amount', amount);
        }

        if (name === 'transaction.transactionDate') {
            newData = dataService.updateNestedData(newData, 'transaction.accountingDate', value);
        }

        if (name === 'incomeTypeId') {
            if (newData.transaction.description == '') {
                const dataServiceIncomeType = new DataService<IncomeType>({ context: incomeTypeContext })
                const incomeType = await dataServiceIncomeType.read(Number(value));
                newData = dataService.updateNestedData(newData, 'transaction.description', incomeType.name);
            }
        }

        setData(newData);
    }

    const formComponents = () => {
        if (data === undefined) {
            return (<></>);
        }
        return (

            <Stack spacing={2} marginBottom={2}>
                <AlisaSelect<IncomeInputDto, Property>
                    label={t('property')}
                    dataService={new DataService<Property>({
                        context: propertyContext,
                        fetchOptions: { order: { name: 'ASC' } }
                    })}
                    fieldName='propertyId'
                    value={data.propertyId}
                    onHandleChange={handleChange}
                >
                </AlisaSelect>

                <AlisaSelect<IncomeInputDto, IncomeType>
                    label={t('incomeType')}
                    dataService={new DataService<IncomeType>({
                        context: incomeTypeContext,
                        fetchOptions: { order: { name: 'ASC' } }
                    })}
                    fieldName='incomeTypeId'
                    value={data.incomeTypeId}
                    onHandleChange={handleChange}
                >
                </AlisaSelect>

                <TransactionFormFields
                    data={data.transaction}
                    onHandleChange={handleChange}
                ></TransactionFormFields>

            </Stack>
        )
    }

    if (data === undefined) {
        return (<AlisaLoadingProgress></AlisaLoadingProgress>)
    } else {

        return (
            <AlisaContent headerText={t('income')}>
                <AlisaFormHandler<IncomeInputDto>
                    id={id}
                    dataService={dataService}
                    data={data}
                    formComponents={formComponents()}
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
}

export default withTranslation(transactionContext.name)(IncomeForm);
