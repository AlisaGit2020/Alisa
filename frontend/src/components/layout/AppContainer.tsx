import { Box, Container, Toolbar } from "@mui/material"
import AppRoutes from "../AppRoutes"

function AppContainer() {
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
                <AppRoutes></AppRoutes>
            </Container>

        </Box>
    )
}

export default AppContainer