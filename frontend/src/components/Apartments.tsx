import { Button, ButtonGroup, Container, Grid, Link, Paper } from '@mui/material'
import { Copyright } from '@mui/icons-material'
import ApartmentsDataTable from './datatables/ApartmentsDataTable'

export default function Apartments() {
    return (
        <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
            <Container maxWidth={false} sx={{ mt: 0, mb: 4 }}>
                <Button variant="contained" href='apartments/add'>Add new apartment</Button>
            </Container>
            <Grid container spacing={3}>
                {/* Apartments */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <ApartmentsDataTable />
                    </Paper>
                </Grid>
            </Grid>
            <Copyright sx={{ pt: 4 }} />
        </Container>
    )
}

