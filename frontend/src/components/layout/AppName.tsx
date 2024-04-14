import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { TFunction } from "i18next";

function AppName(props: { t: TFunction }) {
  return (
    <>
      <ListItemButton component="a" href="/">
        <ListItemText primary={props.t("title")} />
      </ListItemButton>
    </>
  );
}

export default AppName;
