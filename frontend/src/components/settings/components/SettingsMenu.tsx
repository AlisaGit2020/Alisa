import { settingsContext } from "@alisa-lib/alisa-contexts";
import { Paper, MenuList } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SettingsMenuItem from "./SettingsMenuItem";
import { SettingsPage } from "../Settings";

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
                <SettingsMenuItem
                    icon={<AccountBalanceIcon fontSize="small" />}
                    selected={selectedItem === SettingsPage.LoanSettings}
                    onClick={() => handleOnClick(SettingsPage.LoanSettings)}
                    itemText={t('loanSettings')}
                >
                </SettingsMenuItem>
            </MenuList>

        </Paper>
    )
}

export default withTranslation(settingsContext.name)(SettingsMenu)