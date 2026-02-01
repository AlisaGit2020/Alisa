import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import Box from "@mui/material/Box";
import AppBar from "./components/layout/AppBar";
import AppContainer from "./components/layout/AppContainer";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import createStore from "react-auth-kit/createStore";
import AuthProvider from "react-auth-kit";
import { ThemeContextProvider, useThemeMode } from "@alisa-lib/theme-context";
import { DashboardProvider } from "./components/dashboard/context/DashboardContext";
import { useMemo } from "react";

const store = createStore({
  authName: "_auth",
  authType: "cookie",
  cookieDomain: window.location.hostname,
  cookieSecure: window.location.protocol === "http:",
});

function ThemedApp() {
  const { mode } = useThemeMode();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider store={store}>
        <DashboardProvider>
          <Box sx={{ display: "flex" }} maxWidth="100vw">
            <AppBar />
            <AppContainer />
          </Box>
        </DashboardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeContextProvider>
        <ThemedApp />
      </ThemeContextProvider>
    </LocalizationProvider>
  );
}
