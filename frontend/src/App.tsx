import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from './components/layout/AppBar';
import AppContainer from './components/layout/AppContainer';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import createStore from 'react-auth-kit/createStore';
import AuthProvider from 'react-auth-kit';

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

export default function App() {
  const store = createStore({
    authName: '_auth',
    authType: 'cookie',
    cookieDomain: window.location.hostname,
    cookieSecure: window.location.protocol === 'http:',
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={defaultTheme}>
      <AuthProvider store={store}>
        <Box sx={{ display: 'flex' }} maxWidth='100vw'>
          <AppBar></AppBar>
          <AppContainer></AppContainer>
        </Box>
        </AuthProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
