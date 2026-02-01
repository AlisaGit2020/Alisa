import { MenuItem, ListItemText, ListItemIcon } from "@mui/material";
import { MouseEventHandler, ReactNode } from "react"


function SettingsMenuItem(props: {
    onClick: MouseEventHandler<HTMLLIElement>;
    selected: boolean,
    icon: ReactNode,
    itemText: string
}) {
    return (
        <MenuItem
            onClick={props.onClick}
            selected={props.selected}
            sx={{
                "&.Mui-selected": {
                    backgroundColor: "action.selected",
                },
                "&.Mui-selected:hover": {
                    backgroundColor: "action.hover",
                },
            }}
        >
            <ListItemIcon>
                {props.icon}
            </ListItemIcon>
            <ListItemText>{props.itemText}</ListItemText>
        </MenuItem>

    )
}

export default SettingsMenuItem