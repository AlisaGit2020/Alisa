import { Box, Grid } from '@mui/material'
import { withTranslation } from 'react-i18next';
import ExpenseTypes from './expense-type/ExpenseTypes';
import SettingsMenu, { SettingsPage } from './components/SettingsMenu';
import { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function Settings() {
    const { page } = useParams();
    const navigate = useNavigate();
    
    const handleMenuClick = (selectedItem: SettingsPage) => {
        navigate(`/settings/${selectedItem}`)
    }


    const getContent = (menuItem: SettingsPage, content: ReactNode) => {
        if (page === menuItem) {
            return (
                <Box>{content}</Box>
            )
        }
        return ''
    }

    return (

        <Grid container>
            <Grid item lg={3} >
                <SettingsMenu onClick={handleMenuClick} selectedItem={page as SettingsPage} ></SettingsMenu>
            </Grid>
            <Grid item xs={12} lg={9}>
                {getContent(SettingsPage.ExpenseTypes, <ExpenseTypes></ExpenseTypes>)}
            </Grid>
        </Grid>

    )
}

export default withTranslation('settings')(Settings)
