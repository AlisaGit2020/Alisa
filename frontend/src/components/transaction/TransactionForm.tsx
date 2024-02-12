import { withTranslation } from 'react-i18next';
import ExpenseForm from './ExpenseForm';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { useState } from 'react';
import React from 'react';
import { useParams } from 'react-router-dom';
import TransactionChooseType from './components/TransactionChooseType';
import ApiClient from '../../lib/api-client';
import { transactionContext } from '@alisa-lib/alisa-contexts';
import IncomeForm from './IncomeForm';


function TransactionForm() {
    const { id, type, propertyId } = useParams();
    const [expenseId, setExpenseId] = useState<number>();
    const [incomeId, setIncomeId] = useState<number>();

    React.useEffect(() => {

        const fetchData = async (id: number) => {

            if (id) {
                try {
                    const transaction = await ApiClient.get<Transaction>(
                        transactionContext.apiPath,
                        id,
                        { expense: true, income: true }
                    )

                    if (transaction.expense) {
                        setExpenseId(transaction.expense.id)
                    }

                    if (transaction.income) {
                        setIncomeId(transaction.income.id)
                    }

                } catch (error) {
                    //handleApiError(error);
                }
            }
        }

        fetchData(Number(id))

    }, [id])

    if (type === 'expense' || expenseId) {
        return (
            <ExpenseForm id={expenseId} propertyId={Number(propertyId)} />
        );
    } else if (type === 'income' || incomeId) {
        return (
            <IncomeForm id={incomeId} propertyId={Number(propertyId)} />
        );
    } else {
        return (
            <TransactionChooseType></TransactionChooseType>
        );
    }

}

export default withTranslation(transactionContext.name)(TransactionForm);
