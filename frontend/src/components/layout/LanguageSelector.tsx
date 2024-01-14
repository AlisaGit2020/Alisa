import React from 'react';
import { WithTranslation, useTranslation, withTranslation } from 'react-i18next';
import { MenuItem, Box, Menu, Fade, IconButton, Tooltip } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';

function LanguageSelector({ t }: WithTranslation) {
    const { i18n } = useTranslation();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeLanguage = (language: string) => {
        i18n.changeLanguage(language);
        handleClose()
    };

    const getVisibility = (language: string): string => {
        return language == i18n.language ? 'visible' : 'hidden'
    };

    return (
        <Box>
            <Tooltip title={t('selectLanguage')}>
                <IconButton
                    color="inherit"
                    id="fade-button"
                    aria-controls={open ? 'fade-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleOpen}
                ><LanguageIcon></LanguageIcon>
                </IconButton>
            </Tooltip>
            <Menu
                id="fade-menu"
                MenuListProps={{
                    'aria-labelledby': 'fade-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
            >
                <MenuItem onClick={() => changeLanguage('en')}>English <CheckIcon visibility={getVisibility('en')}></CheckIcon></MenuItem>
                <MenuItem onClick={() => changeLanguage('fi')}>Suomi <CheckIcon visibility={getVisibility('fi')}></CheckIcon></MenuItem>
            </Menu>
        </Box>
    );
};

export default withTranslation('appBar')(LanguageSelector);
