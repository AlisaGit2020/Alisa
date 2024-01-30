import AlisaDataForm from '../alisa/AlisaDataForm';
import { useState } from 'react';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto'
import { TransactionInputDto } from '@alisa-backend/accounting/transaction/dtos/transaction-input.dto'
import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaSelect from '../alisa/AlisaSelect';
import AlisaLoadingProgress from '../alisa/AlisaLoadingProgress';
import ApiClient from '../../lib/api-client';
import React from 'react';
import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import AlisaTextField from '../alisa/form/AlisaTextField';
import AlisaNumberField from '../alisa/form/AlisaNumberField';
import { expenseContext, apartmentContext, expenseTypeContext } from '../../alisa-contexts/alisa-contexts';
import { Stack } from '@mui/material';
import AlisaDatePicker from '../alisa/form/AlisaDatepicker';

interface ExpenseFormProps extends WithTranslation {
    id?: number
}

function ExpenseForm({ t, id }: ExpenseFormProps) {

    const [data, setData] = useState<ExpenseInputDto>(undefined);

    React.useEffect(() => {
        const fetchData = () => {
            return ApiClient.getDefault<ExpenseInputDto>(expenseContext.apiPath)
        }

        fetchData()
            .then(setData)

    }, [])

    const handleChange = (
        name: keyof ExpenseInputDto,
        value: ExpenseInputDto[keyof ExpenseInputDto]
    ) => {
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    }


    const handleTransactionChange = (
        name: keyof TransactionInputDto,
        value: TransactionInputDto[keyof TransactionInputDto]
    ) => {

        handleTransactionDataChange(name, value)
        setData((prevData) => ({
            ...prevData,
            transaction: {
                ...prevData.transaction,
                [name]: value,
            },
        }));
    }

    const handleTransactionDataChange = (
        name: keyof TransactionInputDto,
        newValue: TransactionInputDto[keyof TransactionInputDto]
    ) => {
        if (name === 'totalAmount') {
            let amount = 0
            if (data.transaction.quantity > 0) {
                amount = Number(newValue) / data.transaction.quantity
            } 
            handleTransactionChange('amount', amount)
            return;
        }        
        if (name === 'quantity') {
            if (Number(newValue) == 0){
                handleTransactionChange('quantity', 1)
                return;
            }
            
            const amount = data.transaction.totalAmount / Number(newValue)
            handleTransactionChange('amount', amount)            
        }

        if (name === 'transactionDate') {
            handleTransactionChange('accountingDate', newValue)
        }
    }

    const formComponents = () => (

        <Stack spacing={2} marginBottom={2}>
            <AlisaSelect<ExpenseInputDto, Property>
                label={t('apartment')}
                apiUrl={apartmentContext.apiPath}
                fetchOptions={{ order: { name: 'ASC' } }}
                fieldName='propertyId'
                value={data.propertyId}
                onHandleChange={handleChange}
            >
            </AlisaSelect>

            <AlisaSelect<ExpenseInputDto, ExpenseType>  
                label={t('expenseType')}
                apiUrl={expenseTypeContext.apiPath}
                fetchOptions={{ order: { name: 'ASC' } }}
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
                onChange={(e) => handleTransactionChange('description', e.target.value)}
            />

            <Stack direction={'row'} spacing={2}>
                <AlisaDatePicker                                        
                    label={t('transactionDate', { ns: 'transaction' })}
                    value={data.transaction.transactionDate}
                    onChange={(newValue) => handleTransactionChange('transactionDate', newValue as unknown as TransactionInputDto[keyof TransactionInputDto])}
                />
                <AlisaDatePicker                    
                    label={t('accountingDate', { ns: 'transaction' })}
                    value={data.transaction.accountingDate}
                    onChange={(newValue) => handleTransactionChange('accountingDate', newValue as unknown as TransactionInputDto[keyof TransactionInputDto])}
                />

            </Stack>

            <Stack direction={'row'} spacing={2}>
                <AlisaNumberField                    
                    disabled={true}
                    label={t('amount', { ns: 'transaction' })}
                    value={data.transaction.amount}                    
                    onChange={(e) => handleTransactionChange('amount', e.target.value)}
                    adornment='€'
                />
                <AlisaNumberField                                        
                    label={t('quantity', { ns: 'transaction' })}
                    value={data.transaction.quantity}                    
                    onChange={(e) => handleTransactionChange('quantity', e.target.value)}
                />
                <AlisaNumberField                                        
                    label={t('totalAmount', { ns: 'transaction' })}
                    value={data.transaction.totalAmount}
                    autoComplete='off'
                    onChange={(e) => handleTransactionChange('totalAmount', e.target.value)}   
                    adornment='€'
                />
            </Stack>
        </Stack>
    )

    if (data == undefined) {
        return (<AlisaLoadingProgress></AlisaLoadingProgress>)
    } else {
        return (
            <AlisaDataForm<ExpenseInputDto>
                t={t}
                alisaContext={expenseContext}
                formComponents={formComponents()}
                onSetData={setData}
                data={data}
                validateObject={new ExpenseInputDto()}
                id={id}
                relations={{ property: false, expenseType: false, transaction: true }}
            >
            </AlisaDataForm>
        );
    }

}

export default withTranslation(expenseContext.name)(ExpenseForm);
