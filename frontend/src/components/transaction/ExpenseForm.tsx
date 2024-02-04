import { Stack } from '@mui/material';
import { useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaNumberField from '../alisa/form/AlisaNumberField';
import AlisaTextField from '../alisa/form/AlisaTextField';
import { apartmentContext, expenseContext, expenseTypeContext, transactionContext } from '@alisa-lib/alisa-contexts';
import AlisaFormHandler from '../alisa/form/AlisaFormHandler';
import DataService from '@alisa-lib/data-service';
import { useNavigate } from 'react-router-dom';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import AlisaSelect from '../alisa/AlisaSelect';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import AlisaDatePicker from '../alisa/form/AlisaDatePicker';
import React from 'react';
import AlisaLoadingProgress from '../alisa/AlisaLoadingProgress';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';

interface ExpenseFormProps extends WithTranslation {
    id?: number
}

function ExpenseForm({ t, id }: ExpenseFormProps) {

    const [data, setData] = useState<ExpenseInputDto>(new ExpenseInputDto());
    const navigate = useNavigate();

    const dataService = new DataService<ExpenseInputDto>({
        context: expenseContext,
        relations: { transaction: true },
        dataValidateInstance: new ExpenseInputDto()
    })

    React.useEffect(() => {        
        if (id === undefined) {            
            const fetchData = () => {
                return dataService.getDefaults()
            }

            fetchData()
                .then(setData)
        }

    }, [])

    const handleChange = (
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

        setData(newData);
    }

    const formComponents = () => {
        if (data === undefined) {
            return (<></>);
        }
        return (

            <Stack spacing={2} marginBottom={2}>
                <AlisaSelect<ExpenseInputDto, Property>
                    label={t('apartment')}
                    dataService={new DataService<Property>({
                        context: apartmentContext,
                        fetchOptions: { order: { name: 'ASC' } } 
                    })}                    
                    fieldName='propertyId'
                    value={data.propertyId}
                    onHandleChange={handleChange}
                >
                </AlisaSelect>

                <AlisaSelect<ExpenseInputDto, ExpenseType>
                    label={t('expenseType')}
                    dataService={new DataService<ExpenseType>({
                        context: expenseTypeContext,
                        fetchOptions: { order: { name: 'ASC' } } 
                    })}                                        
                    fieldName='expenseTypeId'
                    value={data.expenseTypeId}
                    onHandleChange={handleChange}
                >
                </AlisaSelect>

                <AlisaTextField
                    label={t('description', { ns: 'transaction' })}
                    value={data.transaction.description}
                    autoComplete='off'
                    autoFocus={true}
                    onChange={(e) => handleChange('transaction.description', e.target.value)}
                />

                <Stack direction={'row'} spacing={2}>
                    <AlisaDatePicker
                        label={t('transactionDate', { ns: 'transaction' })}
                        value={data.transaction.transactionDate}
                        onChange={(newValue) => handleChange('transaction.transactionDate', newValue)}
                    />
                    <AlisaDatePicker
                        label={t('accountingDate', { ns: 'transaction' })}
                        value={data.transaction.accountingDate}
                        onChange={(newValue) => handleChange('transaction.accountingDate', newValue)}
                    />

                </Stack>

                <Stack direction={'row'} spacing={2}>
                    <AlisaNumberField
                        disabled={true}
                        label={t('amount', { ns: 'transaction' })}
                        value={data.transaction.amount}
                        onChange={(e) => handleChange('transaction.amount', e.target.value)}
                        adornment='€'
                    />
                    <AlisaNumberField
                        label={t('quantity', { ns: 'transaction' })}
                        value={data.transaction.quantity}
                        onChange={(e) => handleChange('transaction.quantity', e.target.value)}
                    />
                    <AlisaNumberField
                        label={t('totalAmount', { ns: 'transaction' })}
                        value={data.transaction.totalAmount}
                        autoComplete='off'
                        onChange={(e) => handleChange('transaction.totalAmount', e.target.value)}
                        adornment='€'
                    />
                </Stack>
            </Stack>
        )
    }

    if (data === undefined) {
        return (<AlisaLoadingProgress></AlisaLoadingProgress>)
    } else {

        return (

            <AlisaFormHandler<ExpenseInputDto>
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

                onCancel={() => navigate(transactionContext.routePath)}
                onAfterSubmit={() => navigate(transactionContext.routePath)}
            >
            </AlisaFormHandler>
        );
    }
}

export default withTranslation(transactionContext.name)(ExpenseForm);
