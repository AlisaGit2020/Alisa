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
  Chip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import InfoTooltip from "../asset/InfoTooltip";

interface BreakdownItem {
  category: string;
  amount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

interface DepreciationAssetBreakdown {
  assetId: number;
  expenseId: number;
  description: string;
  acquisitionYear: number;
  acquisitionMonth?: number;
  originalAmount: number;
  depreciationAmount: number;
  remainingAmount: number;
  yearsRemaining: number;
  isFullyDepreciated: boolean;
}

interface TaxBreakdownProps {
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
  breakdown: BreakdownItem[];
  depreciationBreakdown?: DepreciationAssetBreakdown[];
}

function TaxBreakdown({
  grossIncome,
  deductions,
  depreciation,
  netIncome,
  breakdown,
  depreciationBreakdown,
}: TaxBreakdownProps) {
  const { t } = useTranslation("tax");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const deductionItems = breakdown.filter((item) => !item.isCapitalImprovement);

  // Use new depreciation breakdown if available, otherwise fall back to legacy
  const hasNewDepreciationBreakdown =
    depreciationBreakdown && depreciationBreakdown.length > 0;

  const depreciationInfoContent = (
    <Box>
      <Typography variant="body2" paragraph>
        {t("depreciationInfoText1")}
      </Typography>
      <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 1 }}>
        <li>{t("depreciationInfoExample1")}</li>
        <li>{t("depreciationInfoExample2")}</li>
        <li>{t("depreciationInfoExample3")}</li>
      </Typography>
      <Typography variant="body2" paragraph>
        {t("depreciationInfoText2")}
      </Typography>
      <Typography variant="body2">
        {t("depreciationInfoText3")}
      </Typography>
    </Box>
  );

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
            {depreciation > 0 || (depreciationBreakdown && depreciationBreakdown.length > 0) ? (
              <>
                <TableRow>
                  <TableCell
                    colSpan={2}
                    sx={{ bgcolor: "grey.50", fontWeight: "bold" }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {t("depreciationSection")}
                      <InfoTooltip
                        title={t("depreciationInfoTitle")}
                        content={depreciationInfoContent}
                        variant="dialog"
                      />
                    </Box>
                  </TableCell>
                </TableRow>

                {/* New Depreciation Breakdown - Per Asset */}
                {hasNewDepreciationBreakdown ? (
                  depreciationBreakdown.map((asset) => (
                    <TableRow key={asset.assetId}>
                      <TableCell sx={{ pl: 4 }}>
                        <Box>
                          <Typography variant="body2">
                            {asset.description}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="div"
                          >
                            {formatCurrency(asset.originalAmount)} × 10% = {formatCurrency(asset.depreciationAmount)}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {asset.isFullyDepreciated ? (
                              <Chip
                                label={t("fullyDepreciated")}
                                size="small"
                                color="default"
                              />
                            ) : (
                              <Chip
                                label={t("yearsRemaining", {
                                  years: asset.yearsRemaining,
                                  acquisitionYear: asset.acquisitionYear,
                                })}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ verticalAlign: "top" }}>
                        {formatCurrency(asset.depreciationAmount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Legacy fallback - grouped by category
                  breakdown
                    .filter((item) => item.isCapitalImprovement)
                    .map((item) => (
                      <TableRow key={item.category}>
                        <TableCell sx={{ pl: 4 }}>
                          {item.category} ({formatCurrency(item.amount)} × 10%)
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.depreciationAmount || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                )}

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
            ) : null}

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
