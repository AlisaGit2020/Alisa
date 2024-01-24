import { DatePicker, DateValidationError, PickerChangeHandlerContext } from "@mui/x-date-pickers"
import dayjs from "dayjs"

function AlisaDatePicker(props: {
    label: '',
    value: '',
    adornment?: string,
    autoComplete?: string,
    autoFocus?: boolean,
    disabled?: boolean,
    fullWidth?: boolean,
    onChange?: ((value: dayjs.Dayjs | null, context: PickerChangeHandlerContext<DateValidationError>) => void) | undefined
}) {

    const width = (props.fullWidth === undefined || props.fullWidth === true) ? '100%' : undefined;

    return (        
        <DatePicker            
            sx={{width: width }}            
            label={props.label}
            value={dayjs(props.value)}
            autoFocus={props.autoFocus !== undefined ? props.autoFocus : false}            
            disabled={props.disabled !== undefined ? props.disabled : false}
            onChange={props.onChange}            
        />    
    )
}

export default AlisaDatePicker