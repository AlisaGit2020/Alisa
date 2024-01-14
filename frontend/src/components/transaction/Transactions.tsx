import { Grid } from '@mui/material'
import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaDataTable from '../alisa/AlisaDataTable';
import { Transaction } from '../../../../backend/src/accounting/transaction/entities/transaction.entity';
import transactionContext from '../../alisa-contexts/transaction';

function Transactions({ t }: WithTranslation) {

    return (

        <Grid container>

            <Grid item xs={12} lg={12}>
                <AlisaDataTable<Transaction>
                    title={t('transactions')}
                    t={t}
                    alisaContext={transactionContext}
                    fields={[
                        { name: 'transactionDate' },
                        { name: 'description' },
                        { name: 'amount' },
                        { name: 'quantity' },
                        { name: 'totalAmount' },
                    ]}
                    fetchOptions={{order: {transactionDate: 'ASC'}}}
                    />
            </Grid>
        </Grid>

    )
}

export default withTranslation(transactionContext.name)(Transactions)
