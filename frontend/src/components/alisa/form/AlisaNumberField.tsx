import { InputAdornment, TextField } from "@mui/material"
import { ChangeEventHandler } from "react"

function AlisaNumberField(props: {
    label: '',
    value: number,
    adornment?: string,
    autoComplete?: string,
    autoFocus?: boolean,
    disabled?: boolean,
    fullWidth?: boolean,
    onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined
}) {

    return (
        <TextField
            fullWidth={props.fullWidth !== undefined ? props.fullWidth : true}
            type='number'
            label={props.label}
            value={props.value}
            autoFocus={props.autoFocus !== undefined ? props.autoFocus : false}
            autoComplete={props.autoComplete !== undefined ? props.autoComplete : 'off'}
            disabled={props.disabled !== undefined ? props.disabled : false}
            onChange={props.onChange}
            InputProps={{
                endAdornment: props.adornment ? (
                    <InputAdornment position="end">{props.adornment}</InputAdornment>
                ) : null,
            }}
        />
    )
}

export default AlisaNumberField