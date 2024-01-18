import { WithTranslation, withTranslation } from 'react-i18next';
import ExpenseForm from './ExpenseForm';
import transactionContext from '../../alisa-contexts/transaction';
import { Transaction } from '../../../../backend/src/accounting/transaction/entities/transaction.entity';
import { useState } from 'react';
import React from 'react';
import getApiUrl from '../../functions';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { TypeOrmFetchOptions } from '../../types/types';
import { Box, Button, Stack } from '@mui/material';
import AlisaContent from '../alisa/AlisaContent';
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';


function TransactionForm({ t }: WithTranslation) {
    const { id, type } = useParams();
    const [data, setData] = useState<Transaction[]>([]);

    React.useEffect(() => {

        const fetchData = async (id: number) => {
            if (id) {
                try {
                    const response = await axios.post(getApiUrl(`${transactionContext.apiPath}/search`), {
                        where: {
                            id: id
                        },
                        relations: {
                            expense: true
                        }
                    } as TypeOrmFetchOptions<Transaction>);

                    return response.data;
                } catch (error) {
                    //handleApiError(error);
                }
            }
            return data
        }

        fetchData(Number(id))
            .then(setData)

    }, [])

    return (
        (data.length > 0 && data[0].expense) ? (
            <ExpenseForm id={data[0].expense.id} />
        ) : (
            (type == 'expense') ? (
                <ExpenseForm />
            ) : (
                <AlisaContent
                    headerText={t('add')}
                    content={(
                        <Stack spacing={2}>
                            <Box>{t('chooseTransactionType')}</Box>
                            <Stack direction={'row'} spacing={2}>
                                <Button variant="outlined" size="large" startIcon={<PaymentIcon />}
                                    href={`${transactionContext.routePath}/add/expense`}
                                >{t('expense')}</Button>
                                <Button variant="outlined" size="large" startIcon={<MonetizationOnIcon />}
                                    href={`${transactionContext.routePath}/add/income`}
                                >{t('income')}</Button>
                            </Stack>
                        </Stack>

                    )}
                ></AlisaContent>
            )
        )
    )

}

export default withTranslation(transactionContext.name)(TransactionForm);
