import { Grid } from '@mui/material'
import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaDataTable from '../alisa/AlisaDataTable';
import { Property } from '../../../../backend/src/real-estate/property/entities/property.entity';
import apartmentContext from '../../alisa-contexts/apartment';

function Apartments({ t }: WithTranslation) {

    return (

        <Grid container>

            <Grid item xs={12} lg={6}>
                <AlisaDataTable<Property>
                    title={t('apartments')}
                    t={t}
                    alisaContext={apartmentContext}
                    fields={[
                        { name: 'name' },
                        { name: 'size', format: 'number' },
                    ]} />
            </Grid>
        </Grid>

    )
}

export default function withTranslation(apartmentContext.name)(Apartments)
