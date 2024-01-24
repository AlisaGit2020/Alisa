import { InputAdornment, MenuItem, TextField } from "@mui/material"
import { ChangeEventHandler } from "react"

type Item = {
    id: number
    name: string
}
function AlisaSelectField(props: {
    label: string,
    value: string,
    adornment?: string,
    autoComplete?: string,
    autoFocus?: boolean,
    disabled?: boolean,
    fullWidth?: boolean,
    items: Item[],
    onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined
}) {
    return (
        <TextField
            fullWidth={props.fullWidth !== undefined ? props.fullWidth : true}
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
            {props.items.map((item: Item) => (
                <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
            ))}
        </TextField>


    )
}

export default AlisaSelectField