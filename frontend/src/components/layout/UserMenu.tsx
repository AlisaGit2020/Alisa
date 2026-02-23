import React from 'react';
import { useTranslation } from 'react-i18next';
import { MenuItem, Box, Menu, Fade, IconButton, Tooltip, Avatar, ListItemIcon } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useUser } from '@asset-lib/user-context';
import { emptyUser } from '@asset-lib/initial-data';
import UserDetails from '../user/UserDetails';
import { useSignOutWithCleanup } from '@asset-lib/use-sign-out-with-cleanup';

function UserMenu() {
    const { t } = useTranslation('appBar');
    const signOut = useSignOutWithCleanup();
    const { user } = useUser();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [openUserDetails, setOpenUserDetails] = React.useState<boolean>(false);
    const open = Boolean(anchorEl);

    // Use user from context, fallback to emptyUser while loading
    const userData = user ?? emptyUser;

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const openUserProfile = () => {
        setOpenUserDetails(true);
        handleClose();
    };

    const handleSignOut = () => {
        signOut();
    };

    const getFullName = () => {
        return `${userData.firstName} ${userData.lastName}`;
    };

    return (
        <Box>
            <Tooltip title={getFullName()}>
                <IconButton
                    color="inherit"
                    aria-controls={open ? 'user-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleOpen}
                >
                    <Avatar
                        alt={getFullName()}
                        src={userData.photo}
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
                        <PersonOutlineIcon />
                    </ListItemIcon>
                    {t('profile')}
                </MenuItem>
                <MenuItem onClick={() => handleSignOut()}>
                    <ListItemIcon>
                        <LogoutIcon />
                    </ListItemIcon>
                    {t('signOut')}
                </MenuItem>
            </Menu>

            <UserDetails
                onClose={() => setOpenUserDetails(false)}
                open={openUserDetails}
            />
        </Box>
    );
}

export default UserMenu;
