import { Box, Grid } from '@mui/material'
import { withTranslation } from 'react-i18next';
import SettingsMenu from './components/SettingsMenu';
import { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ThemeSettings from './theme/ThemeSettings';
import { FormPageTemplate } from '../templates';

function Settings() {
    const { page = 'theme', action = '' } = useParams();
    const navigate = useNavigate();

    const handleMenuClick = (selectedItem: SettingsPage) => {
        navigate(`/app/settings/${selectedItem}`)
    }

    const getContent = (iPage: SettingsPage, iAction: Action, content: ReactNode) => {
        if (page === iPage && action === iAction) {
            return (
                <Box>{content}</Box>
            )
        }
        return ''
    }

    return (
        <FormPageTemplate translationPrefix="settings">
            <Grid container>
                <Grid size={{ lg: 3 }} >
                    <SettingsMenu onClick={handleMenuClick} selectedItem={page as SettingsPage} ></SettingsMenu>
                </Grid>
                <Grid size={{ xs: 12, lg: 9 }}>
                    {getContent(SettingsPage.Theme, Action.List, <ThemeSettings></ThemeSettings>)}
                </Grid>
            </Grid>
        </FormPageTemplate>
    )
}

export enum SettingsPage {
    Theme = 'theme'
}

export enum Action {
    Add = 'add',
    Edit = 'edit',
    List = ''
}

export default withTranslation('settings')(Settings)
