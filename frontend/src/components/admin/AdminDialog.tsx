import PeopleIcon from "@mui/icons-material/People";
import LayersIcon from "@mui/icons-material/Layers";
import { WithTranslation, withTranslation } from "react-i18next";
import { useState } from "react";
import AdminUserList from "./users/AdminUserList";
import AdminTierList from "./tiers/AdminTierList";
import { adminContext } from "@asset-lib/asset-contexts";
import FullscreenDialogLayout, {
  MenuItem,
} from "../layout/FullscreenDialogLayout";

enum AdminPage {
  Users = "users",
  Tiers = "tiers",
}

interface AdminDialogProps extends WithTranslation {
  open: boolean;
  onClose: () => void;
}

function AdminDialog({ t, open, onClose }: AdminDialogProps) {
  const [page, setPage] = useState<AdminPage>(AdminPage.Users);

  const menuItems: MenuItem[] = [
    {
      id: AdminPage.Users,
      label: t("users"),
      icon: <PeopleIcon fontSize="small" sx={{ color: "primary.main" }} />,
    },
    {
      id: AdminPage.Tiers,
      label: t("tiers"),
      icon: <LayersIcon fontSize="small" sx={{ color: "secondary.main" }} />,
    },
  ];

  const getContent = () => {
    switch (page) {
      case AdminPage.Users:
        return <AdminUserList />;
      case AdminPage.Tiers:
        return <AdminTierList />;
      default:
        return <AdminUserList />;
    }
  };

  return (
    <FullscreenDialogLayout
      open={open}
      onClose={onClose}
      title={t("title")}
      menuItems={menuItems}
      selectedMenuId={page}
      onMenuSelect={(id) => setPage(id as AdminPage)}
    >
      {getContent()}
    </FullscreenDialogLayout>
  );
}

export default withTranslation(adminContext.name)(AdminDialog);
