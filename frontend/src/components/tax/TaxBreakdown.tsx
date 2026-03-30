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
  IconButton,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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

interface TaxDeductionBreakdown {
  id: number;
  type: number;
  typeName: string;
  description: string | null;
  amount: number;
  metadata?: {
    distanceKm?: number;
    visits?: number;
    ratePerKm?: number;
    pricePerLaundry?: number;
  };
}

interface TaxBreakdownProps {
  grossIncome: number;
  deductions: number;
  depreciation: number;
  netIncome: number;
  breakdown: BreakdownItem[];
  depreciationBreakdown?: DepreciationAssetBreakdown[];
  taxDeductions?: number;
  taxDeductionBreakdown?: TaxDeductionBreakdown[];
  onEditDeduction?: (id: number) => void;
  onDeleteDeduction?: (id: number) => void;
}

function TaxBreakdown({
  grossIncome,
  deductions,
  depreciation,
  netIncome,
  breakdown,
  depreciationBreakdown,
  taxDeductions = 0,
  taxDeductionBreakdown,
  onEditDeduction,
  onDeleteDeduction,
}: TaxBreakdownProps) {
  const { t } = useTranslation("tax");
  const { t: tExpenseType } = useTranslation("expense-type");

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
                <TableCell sx={{ pl: 4 }}>{tExpenseType(item.category)}</TableCell>
                <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
              </TableRow>
            ))}

            {/* Tax Deduction Items - shown inline with other deductions */}
            {taxDeductionBreakdown && taxDeductionBreakdown.map((item) => (
              <TableRow key={`tax-${item.id}`}>
                <TableCell sx={{ pl: 4 }}>
                  <Box>
                    <Typography variant="body2">
                      {t(`deductionType.${item.typeName}`)}
                      {item.description && ` - ${item.description}`}
                    </Typography>
                    {item.metadata && (
                      <Typography variant="caption" color="text.secondary">
                        {item.metadata.distanceKm && item.metadata.visits && item.metadata.ratePerKm && (
                          <>
                            {(item.metadata.distanceKm * 2).toFixed(1)} km × {item.metadata.visits} × {item.metadata.ratePerKm.toFixed(2)} €/km
                          </>
                        )}
                        {item.metadata.pricePerLaundry && item.metadata.visits && !item.metadata.distanceKm && (
                          <>
                            {item.metadata.visits} × {item.metadata.pricePerLaundry.toFixed(2)} €
                          </>
                        )}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                    <Typography>{formatCurrency(item.amount)}</Typography>
                    {onEditDeduction && (
                      <IconButton size="small" onClick={() => onEditDeduction(item.id)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {onDeleteDeduction && (
                      <IconButton size="small" onClick={() => onDeleteDeduction(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {/* Deductions Total (includes tax deductions) */}
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>
                {t("deductionsTotal")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatCurrency(deductions + taxDeductions)}
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
