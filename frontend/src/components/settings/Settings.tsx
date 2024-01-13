import { Button, Grid } from '@mui/material'
import { WithTranslation, withTranslation } from 'react-i18next';
import ExpenseTypes from './expense-type/ExpenseTypes';

function Settings({ t }: WithTranslation) {

    return (

        <Grid container>
            <Grid item xs={12} lg={8}>
                <ExpenseTypes></ExpenseTypes>
            </Grid>
        </Grid>

    )
}

export default withTranslation('settings')(Settings)
