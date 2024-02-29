import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import ApiClient from '@alisa-lib/api-client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import React from 'react';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import { Button, Card, CardActionArea, CardActions, CardContent, Stack } from '@mui/material';
import Title from '../../Title';
import { WithTranslation, withTranslation } from 'react-i18next';
import { loginContext } from '@alisa-lib/alisa-contexts';


function Login({t}: WithTranslation) {
    const [searchParams] = useSearchParams();
    const signIn = useSignIn();
    const navigate = useNavigate()

    React.useEffect(() => {

        const doLogin = () => {
            const accessToken = searchParams.get('access_token')
            if (accessToken) {
                if (signIn({
                    auth: {
                        token: accessToken,
                        type: 'Bearer'
                    }
                })) {
                    navigate('/')
                } else {
                    //Throw error
                }
            }
        }
        doLogin()

    })

    const handleSubmit = async () => {
        const redirectUrl = await ApiClient.authGoogle()
        window.location.href = redirectUrl
    };

    return (

        <Container component="main" maxWidth="xs">

            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Title>{t('signIn')}</Title>

                <Card sx={{ maxWidth: 250 }}>
                    <CardActionArea>
                        <CardContent>
                            <Typography gutterBottom variant="h5" component="div" sx={{ lineHeight: '48px' }}>
                                <Stack direction={'row'} spacing={2}>
                                    <Box><img src='/assets/icons8-google-48.png'></img></Box>
                                    <Box> Google</Box>
                                </Stack>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('signInGoogle')}
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                    <CardActions>
                        <Button
                            fullWidth={true}
                            startIcon={<LockOutlinedIcon />}
                            variant='contained'
                            onClick={() => handleSubmit()}
                        >{t('signIn')}</Button>
                    </CardActions>
                </Card>
            </Box>
        </Container>
    );
}

export default withTranslation(loginContext.name)(Login);