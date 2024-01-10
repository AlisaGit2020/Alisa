import { Button, Grid } from '@mui/material'
import ApartmentsDataTable from './ApartmentDataTable'
import { useTranslation } from 'react-i18next';

export default function Apartments() {
    const { t: originalT } = useTranslation();

    const t = (key: any) => originalT(`apartment.${key}`);


    return (

        <Grid container>

            <Grid item xs={12} marginBottom={3} >
                <Button variant="contained" href='apartments/add'>{t('add_new_apartment')}</Button>
            </Grid>

            {/* Apartments */}
            <Grid item xs={12} lg={6}>
                <ApartmentsDataTable />
            </Grid>
        </Grid>
    )
}

