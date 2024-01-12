import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import AppRoutes from './components/AppRoutes';
import AppBar from './components/Appbar';
import { Container } from '@mui/material';


// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

export default function App() {

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: 'flex' }} maxWidth='100vw'>
        <AppBar></AppBar>
        <CssBaseline />
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
          <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
            <AppRoutes></AppRoutes>
          </Container>

        </Box>
      </Box>
    </ThemeProvider>
  );
}
