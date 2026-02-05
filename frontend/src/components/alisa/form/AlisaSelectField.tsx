import { InputAdornment, MenuItem, TextField } from "@mui/material"
import { ChangeEventHandler } from "react"

export type AlisaSelectFieldItem = {
    id: number
    name: string
}
function AlisaSelectField(props: {
    label: string,
    value: number | "",
    id?: string,
    adornment?: string,
    autoComplete?: string,
    autoFocus?: boolean,
    disabled?: boolean,
    fullWidth?: boolean,
    size?: "small" | "medium",
    items: AlisaSelectFieldItem[],
    onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined
}) {
    const isSmall = props.size === "small";
    const fullWidth = props.fullWidth !== undefined ? props.fullWidth : !isSmall;

    return (
        <TextField
            id={props.id}
            fullWidth={fullWidth}
            size={props.size}
            select
            label={props.label}
            value={props.value}
            autoFocus={props.autoFocus !== undefined ? props.autoFocus : false}
            autoComplete={props.autoComplete !== undefined ? props.autoComplete : 'off'}
            disabled={props.disabled !== undefined ? props.disabled : false}
            onChange={props.onChange}
            InputProps={{
                endAdornment: props.adornment ? (
                    <InputAdornment position="start">{props.adornment}</InputAdornment>
                ) : null,
            }}
        >
            {props.items.map((item: AlisaSelectFieldItem) => (
                <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
            ))}
        </TextField>


    )
}

export default AlisaSelectField