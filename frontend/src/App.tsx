import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from './components/layout/AppBar';
import AppContainer from './components/layout/AppContainer';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

export default function App() {

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={defaultTheme}>
        <Box sx={{ display: 'flex' }} maxWidth='100vw'>
          <AppBar></AppBar>          
          <AppContainer></AppContainer>
        </Box>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
