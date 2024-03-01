import { WithTranslation, withTranslation } from "react-i18next";
import { Avatar, Box, Dialog, DialogContent, Divider, Stack, Typography } from "@mui/material";
import React from "react";
import { userContext } from "@alisa-lib/alisa-contexts";
import { emptyUser } from "@alisa-lib/initial-data";
import { User } from "@alisa-backend/people/user/entities/user.entity";
import ApiClient from "@alisa-lib/api-client";
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';


interface UserDetailsProps extends WithTranslation {
    open: boolean,
    onClose: () => void
}


function UserDetails({ t, open, onClose }: UserDetailsProps) {
    const [data, setData] = React.useState<User>(emptyUser)

    React.useEffect(() => {
        const fetchData = async () => {
            const data = await ApiClient.me();
            return data
        }
        fetchData()
            .then(setData)

    }, [])

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth={true}
            maxWidth={'sm'}>

            <DialogContent dividers>
                <Stack direction={'row'} spacing={2} margin={2} textAlign={'center'} alignItems={'center'} >
                    <Avatar
                        sx={{ marginLeft: 'auto' }}
                        alt={`${data.firstName} ${data.lastName}`}
                        src={data.photo}
                    ></Avatar>
                    <Box sx={{ lineHeight: '48px' }} >{data.firstName} {data.lastName}</Box>
                </Stack>
                <Divider></Divider>
                <Typography fontSize={14}>
                    <Stack spacing={2} margin={2}>
                        <Stack direction={'row'} spacing={1}><EmailIcon></EmailIcon>
                            <Box sx={{ lineHeight: '24px' }}>{data.email}</Box>
                        </Stack>
                    </Stack>
                    <Stack spacing={2} margin={2}>
                        <Stack direction={'row'} spacing={1}><LanguageIcon></LanguageIcon>
                            <Box sx={{ lineHeight: '24px' }}>{t(data.language as string)}</Box>
                        </Stack>
                    </Stack>
                </Typography>
            </DialogContent>
        </Dialog>

    )
}

export default withTranslation(userContext.name)(UserDetails);