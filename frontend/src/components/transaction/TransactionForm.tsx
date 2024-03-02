import { withTranslation } from 'react-i18next';
import ExpenseForm from './ExpenseForm';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import { useState } from 'react';
import React from 'react';
import TransactionChooseType from './components/TransactionChooseType';
import ApiClient from '../../lib/api-client';
import { transactionContext } from '@alisa-lib/alisa-contexts';
import IncomeForm from './IncomeForm';
import { Dialog, DialogContent } from '@mui/material';
import { TransactionType } from './Transactions';
import AlisaLoadingProgress from '../alisa/AlisaLoadingProgress';


function TransactionForm(props: {
    open: boolean,
    id?: number,
    type?: TransactionType,
    propertyId: number,
    onClose: () => void,
    onAfterSubmit: () => void,
    onCancel: () => void
}) {
    //const { id, type, propertyId } = useParams();
    const [expenseId, setExpenseId] = useState<number>();
    const [incomeId, setIncomeId] = useState<number>();
    const [ready, setReady] = useState<boolean>(false);

    React.useEffect(() => {

        const fetchData = async (id: number | undefined) => {

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
            setReady(true)
        }

        fetchData(props.id)

    }, [props.id])

    const getContent = () => {
        if (!ready) {
            return <AlisaLoadingProgress></AlisaLoadingProgress>
        }
        if (props.type === TransactionType.Expense || expenseId) {
            return (
                <ExpenseForm
                    id={expenseId}
                    propertyId={props.propertyId}
                    onAfterSubmit={props.onAfterSubmit}
                    onCancel={props.onCancel}
                />
            );
        } else if (props.type === TransactionType.Income || incomeId) {
            return (
                <IncomeForm
                    id={incomeId}
                    propertyId={props.propertyId}
                    onAfterSubmit={props.onAfterSubmit}
                    onCancel={props.onCancel}
                />
            );
        } else {
            return (
                <TransactionChooseType></TransactionChooseType>
            );
        }
    }

    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            fullWidth={true}
            maxWidth={'lg'}>

            <DialogContent dividers>
                {getContent()}
            </DialogContent>
        </Dialog>
    )
}

export default withTranslation(transactionContext.name)(TransactionForm);
