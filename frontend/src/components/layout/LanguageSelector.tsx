import React from 'react';
import { WithTranslation, useTranslation, withTranslation } from 'react-i18next';
import { MenuItem, Box, Menu, Fade, IconButton, Tooltip, styled, Avatar, Stack } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

const SmallAvatar = styled(Avatar)(({ theme }) => ({
    width: 24,
    height: 24,
    border: `1px solid ${theme.palette.background.paper}`,
}));

const getFlag = (language: string) => {
    if (language == 'fi') {
        return '/assets/flags/finland-48.png'
    }
    if (language == 'en') {
        return '/assets/flags/great-britain-48.png'
    }
}

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

    const getCheckIconVisibility = (language: string): string => {
        return language == i18n.language ? 'visible' : 'hidden'
    };

    const getMenuItem = (language: string, languageText: string) => {
        return (
            <MenuItem onClick={() => changeLanguage(language)}>
                <Stack direction={'row'} spacing={2}>
                    <SmallAvatar src={getFlag(language)}></SmallAvatar>
                    <Box>{languageText}</Box>
                    <CheckIcon visibility={getCheckIconVisibility(language)}></CheckIcon>
                </Stack>
            </MenuItem>
        )
    }

    return (
        <Box >
            <Tooltip title={t('selectLanguage')}>

                <IconButton                    
                    id="open-language-menu"
                    aria-controls={open ? 'language-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleOpen}
                >
                    <img width={24} src={getFlag(i18n.language)}></img>
                </IconButton>

            </Tooltip>
            <Menu
                id="language-menu"
                MenuListProps={{
                    'aria-labelledby': 'open-language-menu',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
            >
                {getMenuItem('en', 'English')}
                {getMenuItem('fi', 'Suomi')}
            </Menu>
        </Box>
    );
}

export default withTranslation('appBar')(LanguageSelector);
