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
} from "@mui/material";
import { useEffect, useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { User } from "@alisa-backend/people/user/entities/user.entity";
import ApiClient from "@alisa-lib/api-client";
import { adminContext } from "@alisa-lib/alisa-contexts";

import { Tier } from "@alisa-backend/admin/entities/tier.entity";

function AdminUserList({ t }: WithTranslation) {
  const [users, setUsers] = useState<User[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchData();
  }, []);

  const handleTierChange = async (userId: number, tierId: number) => {
    const options = await ApiClient.getOptions();
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/${adminContext.apiPath}/users/${userId}/tier`,
      {
        method: "PUT",
        headers: {
          ...options.headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tierId }),
      },
    );

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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("userId")}</TableCell>
            <TableCell>{t("userName")}</TableCell>
            <TableCell>{t("userEmail")}</TableCell>
            <TableCell>{t("userLanguage")}</TableCell>
            <TableCell>{t("userAdmin")}</TableCell>
            <TableCell>{t("userTier")}</TableCell>
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
              <TableCell>{user.language}</TableCell>
              <TableCell>{user.isAdmin ? t("yes") : t("no")}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default withTranslation(adminContext.name)(AdminUserList);
