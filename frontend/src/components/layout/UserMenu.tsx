import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { MenuItem, Box, Menu, Fade, IconButton, Tooltip, Avatar, ListItemIcon } from '@mui/material';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

function UserMenu({ t }: WithTranslation) {
    const signOut = useSignOut()

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const openUserProfile = () => {
        handleClose()
    };

    const handleSignOut = () => {
        signOut()
        window.location.href = ''
    };

    return (
        <Box>
            <Tooltip title={t('selectLanguage')}>
                <IconButton
                    color="inherit"
                    aria-controls={open ? 'user-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleOpen}
                ><Avatar
                        alt="Juha Koivisto"
                        src="/static/images/avatar/1.jpg"
                    />
                </IconButton>
            </Tooltip>
            <Menu
                id="user-menu"
                MenuListProps={{
                    'aria-labelledby': 'fade-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
            >

                <MenuItem onClick={() => openUserProfile()}>
                    <ListItemIcon>
                        <PersonOutlineIcon></PersonOutlineIcon>
                    </ListItemIcon>
                    {t('profile')}
                </MenuItem>
                <MenuItem onClick={() => handleSignOut()}>
                    <ListItemIcon>
                        <LogoutIcon></LogoutIcon>
                    </ListItemIcon>
                    {t('signOut')}
                </MenuItem>
            </Menu>
        </Box>
    );
}

export default withTranslation('appBar')(UserMenu);
