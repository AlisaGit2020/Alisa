import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Divider,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface BreakdownItem {
  category: string;
  amount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

interface TaxBreakdownProps {
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
  breakdown: BreakdownItem[];
}

function TaxBreakdown({
  grossIncome,
  deductions,
  depreciation,
  netIncome,
  breakdown,
}: TaxBreakdownProps) {
  const { t } = useTranslation("tax");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const deductionItems = breakdown.filter((item) => !item.isCapitalImprovement);
  const depreciationItems = breakdown.filter((item) => item.isCapitalImprovement);

  return (
    <Paper elevation={3} sx={{ mt: 3 }}>
      <Box sx={{ p: 2, bgcolor: "grey.100" }}>
        <Typography variant="h6">{t("form7H")}</Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableBody>
            {/* Gross Income */}
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>
                {t("totalIncome")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatCurrency(grossIncome)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell colSpan={2}>
                <Divider />
              </TableCell>
            </TableRow>

            {/* Deductions Header */}
            <TableRow>
              <TableCell
                colSpan={2}
                sx={{ bgcolor: "grey.50", fontWeight: "bold" }}
              >
                {t("deductionsSection")}
              </TableCell>
            </TableRow>

            {/* Deduction Items */}
            {deductionItems.map((item) => (
              <TableRow key={item.category}>
                <TableCell sx={{ pl: 4 }}>{item.category}</TableCell>
                <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
              </TableRow>
            ))}

            {/* Deductions Total */}
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>
                {t("deductionsTotal")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatCurrency(deductions)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell colSpan={2}>
                <Divider />
              </TableCell>
            </TableRow>

            {/* Depreciation Header */}
            {depreciationItems.length > 0 && (
              <>
                <TableRow>
                  <TableCell
                    colSpan={2}
                    sx={{ bgcolor: "grey.50", fontWeight: "bold" }}
                  >
                    {t("depreciationSection")}
                  </TableCell>
                </TableRow>

                {/* Depreciation Items */}
                {depreciationItems.map((item) => (
                  <TableRow key={item.category}>
                    <TableCell sx={{ pl: 4 }}>
                      {item.category} ({formatCurrency(item.amount)} × 10%)
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.depreciationAmount || 0)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Depreciation Total */}
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {t("depreciationTotal")}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {formatCurrency(depreciation)}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={2}>
                    <Divider />
                  </TableCell>
                </TableRow>
              </>
            )}

            {/* Taxable Income */}
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell sx={{ fontWeight: "bold" }}>
                {t("taxableIncome")}
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
              >
                {formatCurrency(netIncome)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default TaxBreakdown;
