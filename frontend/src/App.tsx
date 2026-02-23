import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/fi";
import createStore from "react-auth-kit/createStore";
import AuthProvider from "react-auth-kit";
import { ThemeContextProvider, useThemeMode } from "@asset-lib/theme-context";
import { DashboardProvider } from "./components/dashboard/context/DashboardContext";
import { AssetToastProvider } from "./components/asset";
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
          primary: {
            main: "#1a2744", // Dark navy from logo
            light: "#2d3d5c",
            dark: "#0f1a2e",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#d4a84b", // Gold from logo
            light: "#e0be74",
            dark: "#b8923d",
            contrastText: "#1a2744",
          },
          // Semantic colors for transactions
          success: { main: "#4caf50" }, // Income (green)
          error: { main: "#f44336" }, // Expense (red)
          warning: { main: "#ff9800" }, // Pending (orange)
          info: { main: "#2196f3" }, // Info (blue)
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
      <AssetToastProvider>
        <AuthProvider store={store}>
          <DashboardProvider>
            <AppRoutes />
          </DashboardProvider>
        </AuthProvider>
      </AssetToastProvider>
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
