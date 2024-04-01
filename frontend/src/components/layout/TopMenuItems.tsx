import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { WithTranslation, withTranslation } from "react-i18next";
import { propertyContext, transactionContext } from "@alisa-lib/alisa-contexts";
import { Stack } from "@mui/material";

function TopMenuItems({ t }: WithTranslation) {
  return (
    <Stack direction={"row"}>
      <ListItemButton component="a" href="/">
        <ListItemText primary={t("dashboard")} />
      </ListItemButton>

      <ListItemButton component="a" href={propertyContext.routePath}>
        <ListItemText primary={t("properties")} />
      </ListItemButton>

      <ListItemButton component="a" href={transactionContext.routePath}>
        <ListItemText primary={t("transactions")} />
      </ListItemButton>

      <ListItemButton component="a">
        <ListItemText primary={t("taxes")} />
      </ListItemButton>
    </Stack>
  );
}

export default withTranslation("menu")(TopMenuItems);
