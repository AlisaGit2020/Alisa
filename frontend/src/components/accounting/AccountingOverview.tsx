import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import PageHeader from "../alisa/PageHeader";
import { useTranslation } from "react-i18next";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import {
  transactionContext,
  expenseContext,
  incomeContext,
} from "@alisa-lib/alisa-contexts";

interface SubPageCard {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const subPages: SubPageCard[] = [
  {
    id: "expenses",
    titleKey: "expenses",
    descriptionKey: "expensesDescription",
    icon: <ReceiptIcon sx={{ fontSize: 48 }} />,
    href: expenseContext.routePath,
    color: "error.main",
  },
  {
    id: "incomes",
    titleKey: "incomes",
    descriptionKey: "incomesDescription",
    icon: <PaymentsIcon sx={{ fontSize: 48 }} />,
    href: incomeContext.routePath,
    color: "success.main",
  },
  {
    id: "bankTransactions",
    titleKey: "bankTransactions",
    descriptionKey: "bankTransactionsDescription",
    icon: <AccountBalanceWalletIcon sx={{ fontSize: 48 }} />,
    href: transactionContext.routePath,
    color: "primary.main",
  },
];

function AccountingOverview() {
  const { t } = useTranslation("accounting");

  return (
    <Box>
      <PageHeader
        title={t("overviewTitle")}
        description={t("overviewDescription")}
      />

      <Grid container spacing={3}>
        {subPages.map((page) => (
          <Grid key={page.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              elevation={3}
              sx={{
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea
                href={page.href}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    bgcolor: page.color,
                    color: "white",
                    mb: 2,
                  }}
                >
                  {page.icon}
                </Box>
                <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                  <Typography variant="h6" gutterBottom>
                    {t(page.titleKey)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(page.descriptionKey)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default AccountingOverview;
