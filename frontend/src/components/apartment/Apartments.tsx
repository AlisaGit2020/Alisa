import { Button, Grid } from '@mui/material'
import ApartmentsDataTable from './ApartmentDataTable'

export default function Apartments() {
    return (

        <Grid container>

            <Grid item xs={12} marginBottom={3} >
                <Button variant="contained" href='apartments/add'>Add new apartment</Button>
            </Grid>

            {/* Apartments */}
            <Grid item xs={12} lg={6}>
                <ApartmentsDataTable />
            </Grid>
        </Grid>
    )
}

