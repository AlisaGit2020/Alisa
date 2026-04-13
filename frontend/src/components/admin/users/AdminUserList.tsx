import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Stack,
  IconButton,
} from "@mui/material";
import { useEffect, useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { User, Tier, UserRole } from "@asset-types";
import ApiClient from "@asset-lib/api-client";
import { adminContext } from "@asset-lib/asset-contexts";
import AssetButton from "../../asset/form/AssetButton";
import AssetDialog from "../../asset/dialog/AssetDialog";
import AssetConfirmDialog from "../../asset/dialog/AssetConfirmDialog";
import AssetTextField from "../../asset/form/AssetTextField";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const ALL_ROLES = [UserRole.ADMIN, UserRole.OWNER, UserRole.CLEANER];

const roleTranslationKeys: Record<UserRole, string> = {
  [UserRole.ADMIN]: "roleAdmin",
  [UserRole.OWNER]: "roleOwner",
  [UserRole.CLEANER]: "roleCleaner",
};

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
}

const emptyForm: UserFormData = { email: "", firstName: "", lastName: "", roles: [UserRole.OWNER] };

function AdminUserList({ t }: WithTranslation) {
  const [users, setUsers] = useState<User[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const options = await ApiClient.getOptions();

      const [usersResponse, tiersResponse] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_URL}/${adminContext.apiPath}/users`,
          { headers: options.headers },
        ),
        fetch(
          `${import.meta.env.VITE_API_URL}/${adminContext.apiPath}/tiers`,
          { headers: options.headers },
        ),
      ]);

      if (usersResponse.ok) {
        setUsers(await usersResponse.json());
      }
      if (tiersResponse.ok) {
        setTiers(await tiersResponse.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const adminFetch = async (path: string, method: string, body?: unknown) => {
    const options = await ApiClient.getOptions();
    return fetch(`${import.meta.env.VITE_API_URL}/${adminContext.apiPath}/${path}`, {
      method,
      headers: { ...options.headers, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  };

  const handleTierChange = async (userId: number, tierId: number) => {
    const response = await adminFetch(`users/${userId}/tier`, "PUT", { tierId });
    if (response.ok) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, tierId, tier: tiers.find((t) => t.id === tierId) as Tier | undefined }
            : user,
        ),
      );
    }
  };

  const handleRolesChange = async (userId: number, roles: UserRole[]) => {
    const response = await adminFetch(`users/${userId}/roles`, "PUT", { roles });
    if (response.ok) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, roles } : user,
        ),
      );
    }
  };

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUserId(user.id!);
    setFormData({
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      roles: user.roles || [UserRole.OWNER],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingUserId) {
      await adminFetch(`users/${editingUserId}`, "PUT", {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      await adminFetch(`users/${editingUserId}/roles`, "PUT", { roles: formData.roles });
    } else {
      await adminFetch("users", "POST", formData);
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    const response = await adminFetch(`users/${deleteUserId}`, "DELETE");
    if (response.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteUserId));
    }
    setDeleteUserId(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <AssetButton
          label={t("addUser")}
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("userId")}</TableCell>
              <TableCell>{t("userName")}</TableCell>
              <TableCell>{t("userEmail")}</TableCell>
              <TableCell>{t("userRoles")}</TableCell>
              <TableCell>{t("userTier")}</TableCell>
              <TableCell>{t("tierActions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    multiple
                    size="small"
                    value={user.roles || []}
                    onChange={(e) =>
                      handleRolesChange(user.id!, e.target.value as UserRole[])
                    }
                    input={<OutlinedInput />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {(selected as UserRole[]).map((role) => (
                          <Chip key={role} label={t(roleTranslationKeys[role])} size="small" />
                        ))}
                      </Box>
                    )}
                    sx={{ minWidth: 150 }}
                  >
                    {ALL_ROLES.map((role) => (
                      <MenuItem key={role} value={role}>
                        {t(roleTranslationKeys[role])}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={user.tierId || ""}
                    displayEmpty
                    onChange={(e) =>
                      handleTierChange(user.id!, e.target.value as number)
                    }
                  >
                    <MenuItem value="" disabled>
                      {t("tierNoTier")}
                    </MenuItem>
                    {tiers.map((tier) => (
                      <MenuItem key={tier.id} value={tier.id}>
                        {tier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenEdit(user)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setDeleteUserId(user.id!)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit User Dialog */}
      <AssetDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingUserId ? t("editUser") : t("addUserTitle")}
        actions={
          <>
            <AssetButton
              label={t("tierCancel")}
              variant="text"
              onClick={() => setDialogOpen(false)}
            />
            <AssetButton
              label={t("tierSave")}
              onClick={handleSave}
              disabled={!formData.email || !formData.firstName || !formData.lastName}
            />
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1, minWidth: 300 }}>
          <AssetTextField
            label={t("userEmail")}
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          />
          <AssetTextField
            label={t("cleaning:firstName")}
            value={formData.firstName}
            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
          />
          <AssetTextField
            label={t("cleaning:lastName")}
            value={formData.lastName}
            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
          />
          <Select
            multiple
            size="small"
            value={formData.roles}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, roles: e.target.value as UserRole[] }))
            }
            input={<OutlinedInput />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {(selected as UserRole[]).map((role) => (
                  <Chip key={role} label={t(roleTranslationKeys[role])} size="small" />
                ))}
              </Box>
            )}
          >
            {ALL_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {t(roleTranslationKeys[role])}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </AssetDialog>

      {/* Delete Confirmation */}
      <AssetConfirmDialog
        open={deleteUserId !== null}
        title={t("deleteUser")}
        contentText={t("deleteUserConfirm")}
        buttonTextCancel={t("tierCancel")}
        buttonTextConfirm={t("deleteUser")}
        onConfirm={handleDelete}
        onClose={() => setDeleteUserId(null)}
      />
    </>
  );
}

export default withTranslation([adminContext.name, 'cleaning'])(AdminUserList);
