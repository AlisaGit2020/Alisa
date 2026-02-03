import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import DoneIcon from "@mui/icons-material/Done";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import ApiClient from "@alisa-lib/api-client";
import { TransactionStatus } from "@alisa-backend/common/types";
import { Transaction } from "@alisa-backend/accounting/transaction/entities/transaction.entity";
import { getTransactionPropertyId } from "@alisa-lib/initial-data";
import { TRANSACTION_PROPERTY_CHANGE_EVENT } from "./TransactionLeftMenuItems";

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
    id: "accepted",
    titleKey: "accepted",
    descriptionKey: "acceptedDescription",
    icon: <DoneIcon sx={{ fontSize: 48 }} />,
    href: `${transactionContext.routePath}/accepted`,
    color: "success.main",
  },
  {
    id: "pending",
    titleKey: "pending",
    descriptionKey: "pendingDescription",
    icon: <HourglassTopIcon sx={{ fontSize: 48 }} />,
    href: `${transactionContext.routePath}/pending`,
    color: "warning.main",
  },
  {
    id: "import",
    titleKey: "import",
    descriptionKey: "importDescription",
    icon: <FileUploadIcon sx={{ fontSize: 48 }} />,
    href: `${transactionContext.routePath}/import`,
    color: "primary.main",
  },
];

function TransactionsOverview() {
  const { t } = useTranslation("transaction");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [propertyId, setPropertyId] = useState<number>(getTransactionPropertyId());

  useEffect(() => {
    let cancelled = false;

    const fetchPendingCount = async () => {
      const transactions = await ApiClient.search<Transaction>(
        transactionContext.apiPath,
        {
          select: ["id"],
          where: {
            status: TransactionStatus.PENDING,
            propertyId: propertyId > 0 ? propertyId : undefined,
          },
        }
      );
      if (!cancelled) {
        setPendingCount(transactions.length);
      }
    };

    fetchPendingCount();

    const handlePropertyChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ propertyId: number }>;
      setPropertyId(customEvent.detail.propertyId);
    };

    window.addEventListener(TRANSACTION_PROPERTY_CHANGE_EVENT, handlePropertyChange);
    return () => {
      cancelled = true;
      window.removeEventListener(TRANSACTION_PROPERTY_CHANGE_EVENT, handlePropertyChange);
    };
  }, [propertyId]);

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t("overviewTitle")}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t("overviewDescription")}
        </Typography>
      </Paper>

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
                <Badge
                  badgeContent={page.id === "pending" ? pendingCount : 0}
                  color="error"
                  invisible={page.id !== "pending" || pendingCount === 0}
                  max={999}
                  sx={{ mb: 2 }}
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
                    }}
                  >
                    {page.icon}
                  </Box>
                </Badge>
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

export default TransactionsOverview;
