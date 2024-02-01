import { Grid } from '@mui/material'
import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaDataTable from '../alisa/AlisaDataTable';
import { transactionContext } from '@alisa-lib/alisa-contexts';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';

function Transactions({ t }: WithTranslation) {

    return (

        <Grid container>

            <Grid item xs={12} lg={12}>
                <AlisaDataTable<Transaction>
                    title={t('transactions')}
                    t={t}
                    alisaContext={transactionContext}
                    fields={[
                        { name: 'transactionDate', format: 'date' },
                        { name: 'description' },
                        { name: 'amount', format: 'currency' },
                        { name: 'quantity', format: 'number' },
                        { name: 'totalAmount', format: 'currency' },
                    ]}
                    fetchOptions={{
                        relations: {
                            expense: true
                        },
                        order: {
                            transactionDate: 'ASC'
                        }
                    }}
                    />
            </Grid>
        </Grid>

    )
}

export default withTranslation(transactionContext.name)(Transactions)
