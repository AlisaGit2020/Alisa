import { settingsContext } from "@asset-lib/asset-contexts";
import { Paper, MenuList } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import PaletteIcon from '@mui/icons-material/Palette';
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
                    icon={<PaletteIcon fontSize="small" />}
                    selected={selectedItem === SettingsPage.Theme}
                    onClick={() => handleOnClick(SettingsPage.Theme)}
                    itemText={t('themeSettings')}
                >
                </SettingsMenuItem>
            </MenuList>

        </Paper>
    )
}

export default withTranslation(settingsContext.name)(SettingsMenu)
