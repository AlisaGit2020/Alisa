import { FormControlLabel, Switch } from "@mui/material"
import { ChangeEvent } from "react"

function AssetSwitch(props: {
    label: string,
    value?: boolean,        
    disabled?: boolean,
    fullWidth?: boolean,
    onChange?: ((event: ChangeEvent<HTMLInputElement>, checked: boolean) => void) | undefined
}) {
    return (
        <FormControlLabel control={
            <Switch
                checked={props.value}
                onChange={props.onChange}
                disabled={props.disabled}
            />
        } label={props.label} />
    )
}

export default AssetSwitch