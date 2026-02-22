import PaletteIcon from "@mui/icons-material/Palette";
import { WithTranslation, withTranslation } from "react-i18next";
import { useState } from "react";
import ThemeSettings from "./theme/ThemeSettings";
import { settingsContext } from "@alisa-lib/alisa-contexts";
import FullscreenDialogLayout, {
  MenuItem,
} from "../layout/FullscreenDialogLayout";

enum SettingsPage {
  Theme = "theme",
}

interface SettingsDialogProps extends WithTranslation {
  open: boolean;
  onClose: () => void;
}

function SettingsDialog({ t, open, onClose }: SettingsDialogProps) {
  const [page, setPage] = useState<SettingsPage>(SettingsPage.Theme);

  const menuItems: MenuItem[] = [
    {
      id: SettingsPage.Theme,
      label: t("themeSettings"),
      icon: <PaletteIcon fontSize="small" sx={{ color: "secondary.main" }} />,
    },
  ];

  const handleMenuClick = (selectedPage: SettingsPage) => {
    setPage(selectedPage);
  };

  const getContent = () => {
    switch (page) {
      case SettingsPage.Theme:
        return <ThemeSettings />;
      default:
        return <ThemeSettings />;
    }
  };

  return (
    <FullscreenDialogLayout
      open={open}
      onClose={onClose}
      title={t("settings")}
      menuItems={menuItems}
      selectedMenuId={page}
      onMenuSelect={(id) => handleMenuClick(id as SettingsPage)}
    >
      {getContent()}
    </FullscreenDialogLayout>
  );
}

export default withTranslation(settingsContext.name)(SettingsDialog);
