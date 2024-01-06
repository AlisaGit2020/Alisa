import { Button, Grid, Paper } from '@mui/material'
import ApartmentsDataTable from './datatables/ApartmentsDataTable'

export default function Apartments() {
    return (

        <Grid container>

            <Grid item xs={12} marginBottom={3} >
                <Button variant="contained" href='apartments/add'>Add new apartment</Button>
            </Grid>

            {/* Apartments */}
            <Grid item xs={6}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <ApartmentsDataTable />
                </Paper>
            </Grid>
        </Grid>
    )
}

