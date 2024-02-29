import { Box, Container, Toolbar } from "@mui/material"
import AppRoutes from "../AppRoutes"
import AuthProvider from "react-auth-kit/AuthProvider"
import createStore from "react-auth-kit/createStore"

function AppContainer() {

    const store = createStore({
        authName: '_auth',
        authType: 'cookie',
        cookieDomain: window.location.hostname,
        cookieSecure: window.location.protocol === 'http:',
    });

    return (
        <Box
            component="main"
            sx={{
                backgroundColor: (theme) =>
                    theme.palette.mode === 'light'
                        ? theme.palette.grey[100]
                        : theme.palette.grey[900],
                flexGrow: 1,
                height: '100vh',
                width: '100vw',
                overflow: 'auto'
            }}
        >
            <Toolbar />
            <Container maxWidth={false} sx={{ mt: 3, mb: 4 }}>
                <AuthProvider store={store}>
                    <AppRoutes></AppRoutes>
                </AuthProvider>
            </Container>

        </Box>
    )
}

export default AppContainer