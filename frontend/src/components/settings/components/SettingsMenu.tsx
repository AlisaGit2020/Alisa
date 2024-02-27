import { settingsContext } from "@alisa-lib/alisa-contexts";
import { Paper, MenuList } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SettingsMenuItem from "./SettingsMenuItem";

export enum SettingsPage {
    ExpenseTypes = 'expense-types',
    IncomeTypes = 'income-types'
}
interface SettingsMenuProps extends WithTranslation {
    onClick: (selectedItem: SettingsPage) => void
    selectedItem?: SettingsPage
}

function SettingsMenu({ t, onClick, selectedItem }: SettingsMenuProps) {
    const handleOnClick = (selectedItem: SettingsPage) => {
        onClick(selectedItem)
    }
    return (
        <Paper sx={{ marginRight: 2 }}>
            <MenuList>
                <SettingsMenuItem
                    icon={<PaymentIcon fontSize="small" />}
                    selected={selectedItem === SettingsPage.ExpenseTypes}
                    onClick={() => handleOnClick(SettingsPage.ExpenseTypes)}
                    itemText={t('expenseTypes')}
                >
                </SettingsMenuItem>
                <SettingsMenuItem
                    icon={<MonetizationOnIcon fontSize="small" />}
                    selected={selectedItem === SettingsPage.IncomeTypes}
                    onClick={() => handleOnClick(SettingsPage.IncomeTypes)}
                    itemText={t('incomeTypes')}
                >
                </SettingsMenuItem>
            </MenuList>

        </Paper>
    )
}

export default withTranslation(settingsContext.name)(SettingsMenu)