import TextField from '@mui/material/TextField';
import { InputAdornment, Stack } from '@mui/material';
import AlisaForm from '../alisa/AlisaForm';
import { useState } from 'react';
import { ExpenseInputDto } from '../../../../backend/src/accounting/expense/dtos/expense-input.dto'
import { TransactionInputDto } from '../../../../backend/src/accounting/transaction/dtos/transaction-input.dto'
import { WithTranslation, withTranslation } from 'react-i18next';
import expenseContext from '../../alisa-contexts/expense';
import AlisaSelect from '../alisa/AlisaSelect';
import apartmentContext from '../../alisa-contexts/apartment';
import AlisaLoadingProgress from '../alisa/AlisaLoadingProgress';
import ApiClient from '../../lib/api-client';
import React from 'react';
import { Property } from '../../../../backend/src/real-estate/property/entities/property.entity';
import { ExpenseType } from '../../../../backend/src/accounting/expense/entities/expense-type.entity';
import expenseTypeContext from '../../alisa-contexts/expense-type';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

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

            <TextField
                label={t('description', { ns: 'transaction' })}
                value={data.transaction.description}
                autoComplete='off'
                autoFocus={true}
                onChange={(e) => handleTransactionChange('description', e.target.value)}
            />

            <Stack direction={'row'} spacing={2}>
                <DatePicker
                    sx={{ width: '100%' }}
                    label={t('transactionDate', { ns: 'transaction' })}
                    value={dayjs(data.transaction.transactionDate)}
                    onChange={(newValue) => handleTransactionChange('transactionDate', newValue as unknown as TransactionInputDto[keyof TransactionInputDto])}
                />
                <DatePicker
                    sx={{ width: '100%' }}
                    label={t('accountingDate', { ns: 'transaction' })}
                    value={dayjs(data.transaction.accountingDate)}
                    onChange={(newValue) => handleTransactionChange('accountingDate', newValue as unknown as TransactionInputDto[keyof TransactionInputDto])}
                />

            </Stack>

            <Stack direction={'row'} spacing={2}>
                <TextField
                    sx={{ width: '100%' }}
                    disabled={true}
                    type='number'
                    label={t('amount', { ns: 'transaction' })}
                    value={data.transaction.amount}
                    autoComplete='off'
                    onChange={(e) => handleTransactionChange('amount', e.target.value)}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">€</InputAdornment>,
                      }}  
                />
                <TextField
                    sx={{ width: '100%' }}
                    type='number'
                    label={t('quantity', { ns: 'transaction' })}
                    value={data.transaction.quantity}
                    autoComplete='off'
                    onChange={(e) => handleTransactionChange('quantity', e.target.value)}
                />
                <TextField
                    sx={{ width: '100%' }}
                    type='number'
                    label={t('totalAmount', { ns: 'transaction' })}
                    value={data.transaction.totalAmount}
                    autoComplete='off'
                    onChange={(e) => handleTransactionChange('totalAmount', e.target.value)}   
                    InputProps={{
                        endAdornment: <InputAdornment position="end">€</InputAdornment>,
                      }}                         
                />
            </Stack>
        </Stack>
    )

    if (data == undefined) {
        return (<AlisaLoadingProgress></AlisaLoadingProgress>)
    } else {
        return (
            <AlisaForm<ExpenseInputDto>
                t={t}
                alisaContext={expenseContext}
                formComponents={formComponents()}
                onSetData={setData}
                data={data}
                validateObject={new ExpenseInputDto()}
                id={id}
                relations={{ property: false, expenseType: false, transaction: true }}
            >
            </AlisaForm>
        );
    }

}

export default withTranslation(expenseContext.name)(ExpenseForm);
