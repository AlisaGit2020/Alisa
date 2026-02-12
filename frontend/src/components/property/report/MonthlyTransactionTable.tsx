import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import React, { useState, useCallback, useMemo } from "react";
import { Transaction } from "@alisa-types";
import ApiClient from "@alisa-lib/api-client";
import { VITE_API_URL } from "../../../constants";
import axios from "axios";
import { useToast } from "../../alisa/toast";

interface MonthlySummary {
  month: number;
  year: number;
  income: number;
  expense: number;
  net: number;
}

interface MonthlyTransactionTableProps {
  propertyId: number;
  monthlySummaries: MonthlySummary[];
  loading?: boolean;
}

const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const MAX_VISIBLE_TRANSACTIONS = 10;

function MonthlyTransactionTable({
  propertyId,
  monthlySummaries,
  loading = false,
}: MonthlyTransactionTableProps) {
  const { t } = useTranslation("property");
  const { t: tCommon } = useTranslation("common");
  const { showToast } = useToast();
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [monthTransactions, setMonthTransactions] = useState<
    Record<string, Transaction[]>
  >({});
  const [loadingMonths, setLoadingMonths] = useState<Set<string>>(new Set());

  const getMonthName = useMemo(() => {
    return (monthNumber: number) => {
      const key = MONTH_KEYS[monthNumber - 1];
      return key ? tCommon(key) : "";
    };
  }, [tCommon]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("fi-FI", { day: "2-digit", month: "2-digit" });
  };

  const getMonthKey = (year: number, month: number) => `${year}-${month}`;

  const fetchTransactionsForMonth = useCallback(
    async (year: number, month: number) => {
      const key = getMonthKey(year, month);
      if (monthTransactions[key]) {
        return; // Already fetched
      }

      setLoadingMonths((prev) => new Set(prev).add(key));

      try {
        const url = `${VITE_API_URL}/real-estate/property/${propertyId}/transactions/search`;
        const options = await ApiClient.getOptions();
        const response = await axios.post<Transaction[]>(
          url,
          { year, month },
          options
        );
        setMonthTransactions((prev) => ({
          ...prev,
          [key]: response.data,
        }));
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        showToast({ message: t("report.fetchError"), severity: "error" });
      } finally {
        setLoadingMonths((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [propertyId, monthTransactions, showToast, t]
  );

  const handleAccordionChange =
    (year: number, month: number) =>
    (_event: React.SyntheticEvent, isExpanded: boolean) => {
      const key = getMonthKey(year, month);
      setExpandedMonths((prev) => {
        const next = new Set(prev);
        if (isExpanded) {
          next.add(key);
          fetchTransactionsForMonth(year, month);
        } else {
          next.delete(key);
        }
        return next;
      });
    };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1 }} />
        ))}
      </Paper>
    );
  }

  const hasData = monthlySummaries.some((s) => s.income > 0 || s.expense > 0);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t("report.monthlySummary")}
      </Typography>

      {!hasData ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 4,
          }}
        >
          <Typography color="text.secondary">
            {t("report.noDataForYear")}
          </Typography>
        </Box>
      ) : (
        <Box>
          {monthlySummaries
            .filter((summary) => summary.income > 0 || summary.expense > 0)
            .map((summary) => {
              const key = getMonthKey(summary.year, summary.month);
              const isExpanded = expandedMonths.has(key);
              const isLoading = loadingMonths.has(key);
              const transactions = monthTransactions[key] || [];
              const visibleTransactions = transactions.slice(
                0,
                MAX_VISIBLE_TRANSACTIONS
              );
              const hasMoreTransactions =
                transactions.length > MAX_VISIBLE_TRANSACTIONS;

              return (
                <Accordion
                  key={key}
                  expanded={isExpanded}
                  onChange={handleAccordionChange(summary.year, summary.month)}
                  sx={{
                    "&:before": { display: "none" },
                    boxShadow: "none",
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ px: 1 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",
                        pr: 2,
                      }}
                    >
                      <Typography sx={{ minWidth: 150 }}>
                        {getMonthName(summary.month)} {summary.year}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 4 }}>
                        <Typography sx={{ color: "success.main" }}>
                          {formatCurrency(summary.income)}
                        </Typography>
                        <Typography sx={{ color: "error.main" }}>
                          {formatCurrency(summary.expense)}
                        </Typography>
                        <Typography
                          sx={{
                            color:
                              summary.net >= 0 ? "success.main" : "error.main",
                            fontWeight: 600,
                          }}
                        >
                          {formatCurrency(summary.net)}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    {isLoading ? (
                      <Box sx={{ p: 2 }}>
                        {[1, 2, 3].map((i) => (
                          <Skeleton
                            key={i}
                            variant="rectangular"
                            height={32}
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    ) : transactions.length === 0 ? (
                      <Box sx={{ p: 2 }}>
                        <Typography color="text.secondary">
                          {t("report.noDataForYear")}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ pl: 4 }}>
                                {t("report.date")}
                              </TableCell>
                              <TableCell>{t("report.description")}</TableCell>
                              <TableCell align="right">
                                {t("report.amount")}
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {visibleTransactions.map((tx) => (
                              <TableRow
                                key={tx.id}
                                sx={{
                                  "&:hover": {
                                    bgcolor: "action.hover",
                                    cursor: "pointer",
                                  },
                                }}
                              >
                                <TableCell sx={{ pl: 4 }}>
                                  {formatDate(tx.transactionDate)}
                                </TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell
                                  align="right"
                                  sx={{
                                    color:
                                      tx.amount >= 0
                                        ? "success.main"
                                        : "error.main",
                                  }}
                                >
                                  {formatCurrency(tx.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {hasMoreTransactions && (
                          <Box sx={{ p: 2, textAlign: "center" }}>
                            <Typography
                              variant="body2"
                              color="primary"
                              sx={{ cursor: "pointer" }}
                            >
                              {t("report.showAllTransactions", {
                                count: transactions.length,
                              })}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
        </Box>
      )}
    </Paper>
  );
}

export default MonthlyTransactionTable;
