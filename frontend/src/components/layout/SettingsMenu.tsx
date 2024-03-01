import { settingsContext } from '@alisa-lib/alisa-contexts';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, IconButton, Tooltip } from '@mui/material';
import { WithTranslation, withTranslation } from 'react-i18next';

function SettingsMenu({ t }: WithTranslation) {
    return (
        <Box>
            <Tooltip title={t('settings')}>
                <IconButton
                    color="inherit"
                    href='/settings'
                ><SettingsIcon></SettingsIcon>
                </IconButton>
            </Tooltip>
        </Box>
    );
}

export default withTranslation(settingsContext.name)(SettingsMenu);
