import { DatePicker, DateValidationError, PickerChangeHandlerContext } from "@mui/x-date-pickers"
import dayjs from "dayjs"

function AlisaDatePicker(props: {
    label: string,
    value: Date | null,
    autoFocus?: boolean,
    disabled?: boolean,
    error?: boolean,
    fullWidth?: boolean,
    helperText?: string,
    onChange?: ((value: dayjs.Dayjs | null, context: PickerChangeHandlerContext<DateValidationError>) => void) | undefined
}) {

    const width = (props.fullWidth === undefined || props.fullWidth === true) ? '100%' : undefined;

    return (
        <DatePicker
            sx={{width: width }}
            label={props.label}
            value={props.value ? dayjs(props.value) : null}
            autoFocus={props.autoFocus !== undefined ? props.autoFocus : false}
            disabled={props.disabled !== undefined ? props.disabled : false}
            onChange={props.onChange}
            slotProps={{
                textField: {
                    error: props.error,
                    helperText: props.helperText,
                },
            }}
        />
    )
}

export default AlisaDatePicker