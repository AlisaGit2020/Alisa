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
} from "@mui/material";
import { useEffect, useState } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { User } from "@alisa-backend/people/user/entities/user.entity";
import ApiClient from "@alisa-lib/api-client";
import { adminContext } from "@alisa-lib/alisa-contexts";

function AdminUserList({ t }: WithTranslation) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const options = await ApiClient.getOptions();
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/${adminContext.apiPath}/users`,
          {
            headers: options.headers,
          },
        );
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default withTranslation(adminContext.name)(AdminUserList);
