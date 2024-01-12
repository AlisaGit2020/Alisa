import React from 'react';
import { useTranslation } from 'react-i18next';
import { MenuItem, Box, Button, Menu, Fade, IconButton } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';


function LanguageSelector() {
    const { i18n } = useTranslation();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeLanguage = (language: string) => {
        i18n.changeLanguage(language);
        handleClose()
    };

    return (
        <Box>
            <IconButton
                color="inherit"
                id="fade-button"
                aria-controls={open ? 'fade-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            ><LanguageIcon></LanguageIcon>
            </IconButton>
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
                <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
                <MenuItem onClick={() => changeLanguage('fi')}>Suomi</MenuItem>
            </Menu>
        </Box>
    );
};

export default LanguageSelector;
