import { Grid } from '@mui/material'
import { WithTranslation, withTranslation } from 'react-i18next';
import { Property } from '../../../../backend/src/real-estate/property/entities/property.entity';
import AlisaCardList from '../alisa/AlisaCardList';
import { apartmentContext } from '../../alisa-contexts/alisa-contexts';

function Apartments({ t }: WithTranslation) {

    return (

        <Grid container>

            <Grid item xs={12} lg={6}>
                <AlisaCardList<Property>
                    title={t('apartments')}
                    t={t}
                    alisaContext={apartmentContext}
                    fields={[
                        { name: 'name' },
                        { name: 'size', format: 'number' },
                    ]}
                    fetchOptions={{order: {name: 'ASC'}}}
                    />
            </Grid>
        </Grid>

    )
}

export default withTranslation(apartmentContext.name)(Apartments)
