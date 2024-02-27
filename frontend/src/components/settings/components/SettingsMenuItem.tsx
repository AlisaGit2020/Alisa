import { MenuItem, ListItemText, ListItemIcon } from "@mui/material";
import { MouseEventHandler, ReactNode } from "react"
import { blueGrey } from '@mui/material/colors';


function SettingsMenuItem(props: { 
    onClick: MouseEventHandler<HTMLLIElement>; 
    selected: boolean,
    icon: ReactNode,
    itemText: string 
}) {

    const getBgColor = () => props.selected ? blueGrey[100] : '';

    return (

        <MenuItem onClick={props.onClick} sx={{ bgcolor: getBgColor()}}>
            <ListItemIcon>
                {props.icon}
            </ListItemIcon>
            <ListItemText>{props.itemText}</ListItemText>
        </MenuItem>

    )
}

export default SettingsMenuItem