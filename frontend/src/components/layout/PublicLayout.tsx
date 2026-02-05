import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

/**
 * Layout for public pages (landing, login, public calculator)
 * No AppBar, no sidebar, no app chrome - just the content
 */
function PublicLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[50]
            : theme.palette.grey[900],
      }}
    >
      <Outlet />
    </Box>
  );
}

export default PublicLayout;
