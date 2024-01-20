import TextField from '@mui/material/TextField';
import { Stack } from '@mui/material';
import AlisaForm from '../alisa/AlisaForm';
import { useState } from 'react';
import { ExpenseInputDto } from '../../../../backend/src/accounting/expense/dtos/expense-input.dto'
import { TransactionInputDto } from '../../../../backend/src/accounting/transaction/dtos/transaction-input.dto'
import { WithTranslation, withTranslation } from 'react-i18next';
import expenseContext from '../../alisa-contexts/expense';
import { ExpenseTypeInputDto } from '../../../../backend/src/accounting/expense/dtos/expense-type-input.dto';
import AlisaSelect from '../alisa/AlisaSelect';
import apartmentContext from '../../alisa-contexts/apartment';

interface ExpenseFormProps extends WithTranslation {
    id?: number
}

function ExpenseForm({ t, id }: ExpenseFormProps) {
    const transaction = new TransactionInputDto()


    transaction.accountingDate = '2024-01-01'
    transaction.transactionDate = '2024-01-01'
    transaction.description = '',
        transaction.amount = 0,
        transaction.quantity = 0,
        transaction.totalAmount = 0


    const [data, setData] = useState<ExpenseInputDto>({
        expenseType: new ExpenseTypeInputDto(),
        property: {id: 0},
        transaction: transaction
    });

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
        setData((prevData) => ({
            ...prevData,
            transaction: {
                ...prevData.transaction,
                [name]: value,
            },
        }));
    }

    const formComponents = (

        <Stack spacing={2} marginBottom={2}>
            <AlisaSelect<ExpenseInputDto>
                apiUrl={apartmentContext.apiPath}
                fieldName='property'                
                value={data.property.id}
                onHandleChange={handleChange}
            >
            </AlisaSelect>

            <TextField
                label={t('expenseType')}
                value={data.expenseType.id}
                autoComplete='off'
                autoFocus={true}
                onChange={(e) => handleChange('expenseType', e.target.value)}
            />
            <TextField
                type='number'
                label={t('amount', { ns: 'transaction' })}
                value={data.transaction.amount}
                autoComplete='off'
                onChange={(e) => handleTransactionChange('amount', e.target.value)}
            />
            <TextField
                type='number'
                label={t('quantity', { ns: 'transaction' })}
                value={data.transaction.quantity}
                autoComplete='off'
                onChange={(e) => handleTransactionChange('quantity', e.target.value)}
            />
            <TextField
                type='number'
                label={t('totalAmount', { ns: 'transaction' })}
                value={data.transaction.totalAmount}
                autoComplete='off'
                onChange={(e) => handleTransactionChange('totalAmount', e.target.value)}
            />
        </Stack>
    )
    return (

        <AlisaForm<ExpenseInputDto>
            t={t}
            alisaContext={expenseContext}
            formComponents={formComponents}
            onSetData={setData}
            data={data}
            validateObject={new ExpenseInputDto()}
            id={id}
            relations={{ property: true, expenseType: true, transaction: true }}
        >
        </AlisaForm>
    );
}

export default withTranslation(expenseContext.name)(ExpenseForm);
