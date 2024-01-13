import { Button, Grid } from '@mui/material'
import ApartmentsDataTable from './ApartmentDataTable'
import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaDataTable from '../alisa/AlisaDataTable';
import { Property } from '../../../../backend/src/real-estate/property/entities/property.entity';

function Apartments({ t }: WithTranslation) {

    return (

        <Grid container>

            <Grid item xs={12} marginBottom={3} >
                <Button variant="contained" href='apartments/add'>{t('add')}</Button>
            </Grid>

            <Grid item xs={12} lg={6}>
                <AlisaDataTable<Property>
                    title={t('apartments')}
                    t={t}
                    apiUrl={'real-estate/property'}
                    fields={[
                        { name: 'name' },
                        { name: 'size', format: 'number' },
                    ]} />
            </Grid>
        </Grid>

    )
}

export default withTranslation('apartment')(Apartments)
