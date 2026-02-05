import { Box, Container, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import AppBar from "./AppBar";
import Breadcrumbs from "./Breadcrumbs";

/**
 * Layout for protected pages (dashboard, properties, etc.)
 * Includes AppBar, sidebar, breadcrumbs
 */
function ProtectedLayout() {
  return (
    <Box sx={{ display: "flex" }} maxWidth="100vw">
      <AppBar />
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: "100vh",
          width: "100vw",
          overflow: "auto",
        }}
      >
        <Toolbar />
        <Container maxWidth={false} sx={{ mt: 3, mb: 4 }}>
          <Breadcrumbs />
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}

export default ProtectedLayout;
