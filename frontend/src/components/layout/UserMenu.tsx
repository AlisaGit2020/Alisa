import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { MenuItem, Box, Menu, Fade, IconButton, Tooltip, Avatar, ListItemIcon } from '@mui/material';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { User } from '@alisa-backend/people/user/entities/user.entity';
import ApiClient from '@alisa-lib/api-client';

function UserMenu({ t }: WithTranslation) {
    const signOut = useSignOut()

    const [data, setData] = React.useState<User>({})
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    let token = ApiClient.getToken()

    React.useEffect(() => {            

        if (token) {
            const fetchData = async () => {
                const data = await ApiClient.me();
                return data
            }

            fetchData()
                .then(setData)
        }else{
            token = 'some value';
        }
    }, [token])

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

    const getFullName = (user: User) => {
        return `${user.firstName} ${user.lastName}`
    }

    return (
        <Box>
            <Tooltip title={getFullName(data)}>
                <IconButton
                    color="inherit"
                    aria-controls={open ? 'user-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleOpen}
                ><Avatar
                        alt={getFullName(data)}
                        src={data.photo}
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
