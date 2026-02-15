import { Box } from "@mui/material";

function AppName() {
  return (
    <Box
      component="a"
      href="/"
      sx={{
        display: "flex",
        alignItems: "center",
        textDecoration: "none",
      }}
    >
      <Box
        component="img"
        src="/assets/asset-logo-white.png"
        alt="Asset"
        sx={{
          height: 40,
          width: "auto",
        }}
      />
    </Box>
  );
}

export default AppName;
