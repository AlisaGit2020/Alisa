import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from './components/layout/AppBar';
import AppContainer from './components/layout/AppContainer';

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

export default function App() {

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: 'flex' }} maxWidth='100vw'>
        <AppBar></AppBar>
        <AppContainer></AppContainer>        
      </Box>
    </ThemeProvider>
  );
}
