import { InputAdornment, MenuItem, TextField } from "@mui/material"
import { ChangeEventHandler } from "react"
import { TFunction } from "i18next"

export type AlisaSelectFieldItem = {
    id: number
    name?: string
    key?: string
}
function AlisaSelectField(props: {
    label: string,
    value: number | "",
    id?: string,
    adornment?: string,
    autoComplete?: string,
    autoFocus?: boolean,
    disabled?: boolean,
    error?: boolean,
    fullWidth?: boolean,
    helperText?: string,
    size?: "small" | "medium",
    items: AlisaSelectFieldItem[],
    onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined,
    t?: TFunction,
    translateKeyPrefix?: string,
}) {
    const isSmall = props.size === "small";
    const fullWidth = props.fullWidth !== undefined ? props.fullWidth : !isSmall;

    const getItemLabel = (item: AlisaSelectFieldItem): string => {
        if (props.t && props.translateKeyPrefix && item.key) {
            return props.t(`${props.translateKeyPrefix}:${item.key}`);
        }
        return item.name || "";
    };

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
            error={props.error}
            helperText={props.helperText}
            onChange={props.onChange}
            InputProps={{
                endAdornment: props.adornment ? (
                    <InputAdornment position="start">{props.adornment}</InputAdornment>
                ) : null,
            }}
        >
            {props.items.map((item: AlisaSelectFieldItem) => (
                <MenuItem key={item.id} value={item.id}>{getItemLabel(item)}</MenuItem>
            ))}
        </TextField>


    )
}

export default AlisaSelectField