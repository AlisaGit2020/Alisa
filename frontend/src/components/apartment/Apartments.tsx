import { Button, Grid } from '@mui/material'
import ApartmentsDataTable from './ApartmentDataTable'
import { WithTranslation, withTranslation } from 'react-i18next';

function Apartments({ t }: WithTranslation) {

    return (

        <Grid container>

            <Grid item xs={12} marginBottom={3} >
                <Button variant="contained" href='apartments/add'>{t('addNewApartment')}</Button>
            </Grid>

            {/* Apartments */}
            <Grid item xs={12} lg={6}>
                <ApartmentsDataTable title={t('apartments')} />
            </Grid>
        </Grid>

    )
}

export default withTranslation(['common', 'apartment'])(Apartments)
