import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/fi";
import createStore from "react-auth-kit/createStore";
import AuthProvider from "react-auth-kit";
import { ThemeContextProvider, useThemeMode } from "@alisa-lib/theme-context";
import { DashboardProvider } from "./components/dashboard/context/DashboardContext";
import { AlisaToastProvider } from "./components/alisa";
import { useMemo } from "react";
import AppRoutes from "./components/AppRoutes";

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
      <AlisaToastProvider>
        <AuthProvider store={store}>
          <DashboardProvider>
            <AppRoutes />
          </DashboardProvider>
        </AuthProvider>
      </AlisaToastProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fi">
      <ThemeContextProvider>
        <ThemedApp />
      </ThemeContextProvider>
    </LocalizationProvider>
  );
}
