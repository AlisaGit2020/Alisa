import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { WithTranslation, withTranslation } from "react-i18next";
import { propertyContext, transactionContext } from "@alisa-lib/alisa-contexts";
import { Stack } from "@mui/material";

function TopMenuItems({ t }: WithTranslation) {
  const currentPath = window.location.pathname;

  const menuItemSx = {
    borderBottom: 3,
    borderColor: "transparent",
    color: "white",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: "white",
    },
    "&.Mui-selected": {
      borderColor: "white",
      backgroundColor: "transparent",
      color: "white",
    },
    "&.Mui-selected:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: "white",
    },
  };

  return (
    <Stack direction={"row"}>
      <ListItemButton
        component="a"
        href="/"
        selected={currentPath === "/"}
        sx={menuItemSx}
      >
        <ListItemText primary={t("dashboard")} />
      </ListItemButton>

      <ListItemButton
        component="a"
        href={propertyContext.routePath}
        selected={currentPath.startsWith(propertyContext.routePath)}
        sx={menuItemSx}
      >
        <ListItemText primary={t("properties")} />
      </ListItemButton>

      <ListItemButton
        component="a"
        href={transactionContext.routePath}
        selected={currentPath.startsWith(transactionContext.routePath)}
        sx={menuItemSx}
      >
        <ListItemText primary={t("transactions")} />
      </ListItemButton>

      <ListItemButton component="a" sx={menuItemSx}>
        <ListItemText primary={t("taxes")} />
      </ListItemButton>
    </Stack>
  );
}

export default withTranslation("menu")(TopMenuItems);
