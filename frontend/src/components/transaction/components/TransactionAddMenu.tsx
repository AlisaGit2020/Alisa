import { Divider, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Paper } from "@mui/material"
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { TFunction} from "i18next"

function TransactionAddMenu( props: {    
    t: TFunction
    onClose: () => void
    onAddExpense: () => void
    onAddIncome: () => void
    onImport: () => void
    anchorEl: null | HTMLElement
}) {
        
    return (
        <Paper sx={{ width: 320, minWidth: 220, maxWidth: '100%' }}>
        <Menu
            anchorEl={props.anchorEl}
            open={Boolean(props.anchorEl)}
            onClose={props.onClose}
        >
            <MenuList>
                <MenuItem >
                    <ListItemText>{props.t('add')}</ListItemText>
                </MenuItem>
                <Divider></Divider>
                <MenuItem onClick={props.onAddExpense}>
                    <ListItemIcon>
                        <PaymentIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{props.t('expense')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={props.onAddIncome}>
                    <ListItemIcon>
                        <MonetizationOnIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{props.t('income')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={props.onImport}>
                    <ListItemIcon>
                        <CloudUploadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{props.t('import')}</ListItemText>
                </MenuItem>
            </MenuList>
        </Menu>
    </Paper>
    )
}

export default TransactionAddMenu