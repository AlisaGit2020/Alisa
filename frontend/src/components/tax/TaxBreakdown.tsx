import { useState, ReactNode } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Box,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useTranslation } from "react-i18next";
import InfoTooltip from "../asset/InfoTooltip";

interface BreakdownItem {
  category: string;
  amount: number;
  totalAmount: number;
  isTaxDeductible: boolean;
  isCapitalImprovement?: boolean;
  depreciationAmount?: number;
}

interface IncomeBreakdownItem {
  category: string;
  amount: number;
  totalAmount: number;
}

interface DepreciationAssetBreakdown {
  assetId: number;
  expenseId: number;
  description: string;
  acquisitionYear: number;
  acquisitionMonth?: number;
  originalAmount: number;
  totalOriginalAmount: number;
  depreciationAmount: number;
  totalDepreciationAmount: number;
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
  totalAmount: number;
  metadata?: {
    distanceKm?: number;
    visits?: number;
    ratePerKm?: number;
    pricePerLaundry?: number;
  };
}

interface TaxBreakdownProps {
  grossIncome: number;
  totalGrossIncome?: number;
  deductions: number;
  totalDeductions?: number;
  depreciation: number;
  totalDepreciation?: number;
  netIncome: number;
  totalNetIncome?: number;
  breakdown: BreakdownItem[];
  incomeBreakdown?: IncomeBreakdownItem[];
  depreciationBreakdown?: DepreciationAssetBreakdown[];
  taxDeductions?: number;
  totalTaxDeductions?: number;
  taxDeductionBreakdown?: TaxDeductionBreakdown[];
  ownershipShare?: number;
  onDeleteDeduction?: (id: number) => void;
}

// 7H category mapping: expense type keys grouped into tax form rows
const HOUSING_AND_WATER_KEYS = [
  "housing-charge",
  "maintenance-charge",
  "water",
];

const FINANCIAL_CHARGE_KEYS = ["financial-charge"];

const REPAIR_KEYS = ["repairs"];

// Everything else tax-deductible goes into "other"
const GROUPED_KEYS = new Set([
  ...HOUSING_AND_WATER_KEYS,
  ...FINANCIAL_CHARGE_KEYS,
  ...REPAIR_KEYS,
]);

function TaxBreakdown({
  grossIncome,
  totalGrossIncome,
  deductions,
  totalDeductions,
  depreciation,
  totalDepreciation,
  netIncome,
  totalNetIncome,
  breakdown,
  incomeBreakdown,
  depreciationBreakdown,
  taxDeductions = 0,
  totalTaxDeductions = 0,
  taxDeductionBreakdown,
  ownershipShare,
  onDeleteDeduction,
}: TaxBreakdownProps) {
  const { t } = useTranslation("tax");
  const { t: tExpenseType } = useTranslation("expense-type");
  const { t: tIncomeType } = useTranslation("income-type");

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const showDualColumns =
    ownershipShare !== undefined && ownershipShare < 100;
  const colSpan = showDualColumns ? 3 : 2;

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  // Filter to non-capital-improvement items only
  const deductionItems = breakdown.filter((item) => !item.isCapitalImprovement);

  // Group deduction items by 7H category
  const groupItems = (keys: string[]) =>
    deductionItems.filter((item) => keys.includes(item.category));

  const otherItems = deductionItems.filter(
    (item) => !GROUPED_KEYS.has(item.category)
  );

  const housingItems = groupItems(HOUSING_AND_WATER_KEYS);
  const financialItems = groupItems(FINANCIAL_CHARGE_KEYS);
  const repairItems = groupItems(REPAIR_KEYS);

  const sumAmount = (items: { amount: number }[]) =>
    items.reduce((sum, item) => sum + item.amount, 0);
  const sumTotalAmount = (items: { totalAmount: number }[]) =>
    items.reduce((sum, item) => sum + item.totalAmount, 0);

  const housingAmount = sumAmount(housingItems);
  const housingTotal = sumTotalAmount(housingItems);
  const financialAmount = sumAmount(financialItems);
  const financialTotal = sumTotalAmount(financialItems);
  const repairAmount = sumAmount(repairItems);
  const repairTotal = sumTotalAmount(repairItems);
  const otherExpenseAmount = sumAmount(otherItems);
  const otherExpenseTotal = sumTotalAmount(otherItems);
  const otherAmount = otherExpenseAmount + taxDeductions;
  const otherTotal = otherExpenseTotal + totalTaxDeductions;

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
      <Typography variant="body2">{t("depreciationInfoText3")}</Typography>
    </Box>
  );

  const renderExpandableRow = (
    key: string,
    label: string,
    shareAmount: number,
    totalAmount: number,
    subRows: ReactNode
  ) => {
    const isExpanded = expanded[key] ?? false;
    return (
      <>
        <TableRow
          onClick={() => toggleExpand(key)}
          sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
        >
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isExpanded ? (
                <KeyboardArrowUpIcon fontSize="small" />
              ) : (
                <KeyboardArrowDownIcon fontSize="small" />
              )}
              <Typography sx={{ fontWeight: "bold", ml: 0.5 }}>
                {label}
              </Typography>
            </Box>
          </TableCell>
          {showDualColumns && (
            <TableCell align="right">{formatCurrency(totalAmount)}</TableCell>
          )}
          <TableCell align="right" sx={{ fontWeight: "bold" }}>
            {formatCurrency(shareAmount)}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={colSpan} sx={{ p: 0, borderBottom: "none" }}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Table size="small">
                <TableBody>{subRows}</TableBody>
              </Table>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  const renderSubRow = (
    label: string,
    shareAmount: number,
    totalAmount: number,
    extra?: ReactNode
  ) => (
    <TableRow key={label}>
      <TableCell sx={{ pl: 6 }}>
        {extra ? (
          <Box>
            <Typography variant="body2">{label}</Typography>
            {extra}
          </Box>
        ) : (
          label
        )}
      </TableCell>
      {showDualColumns && (
        <TableCell align="right">{formatCurrency(totalAmount)}</TableCell>
      )}
      <TableCell align="right">{formatCurrency(shareAmount)}</TableCell>
    </TableRow>
  );

  return (
    <Paper elevation={3} sx={{ mt: 3 }}>
      <Box sx={{ p: 2, bgcolor: "grey.100" }}>
        <Typography variant="h6">{t("form7H")}</Typography>
      </Box>

      <TableContainer>
        <Table>
          {showDualColumns && (
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {t("columnTotal")}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {t("columnYourShare", {
                    share: ownershipShare?.toFixed(0),
                  })}
                </TableCell>
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {/* 1. Income row */}
            {renderExpandableRow(
              "income",
              t("incomeTotal"),
              grossIncome,
              totalGrossIncome ?? grossIncome,
              <>
                {incomeBreakdown && incomeBreakdown.length > 0 ? (
                  incomeBreakdown.map((item) =>
                    renderSubRow(
                      tIncomeType(item.category),
                      item.amount,
                      item.totalAmount
                    )
                  )
                ) : (
                  renderSubRow(t("totalIncome"), grossIncome, totalGrossIncome ?? grossIncome)
                )}
              </>
            )}

            <TableRow>
              <TableCell colSpan={colSpan}>
                <Divider />
              </TableCell>
            </TableRow>

            {/* Deductions Header */}
            <TableRow>
              <TableCell
                colSpan={colSpan}
                sx={{ bgcolor: "grey.50", fontWeight: "bold" }}
              >
                {t("deductionsSection")}
              </TableCell>
            </TableRow>

            {/* 2. Housing and water charges */}
            {renderExpandableRow(
              "housingAndWater",
              t("housingAndWater"),
              housingAmount,
              housingTotal,
              <>
                {housingItems.map((item) =>
                  renderSubRow(
                    tExpenseType(item.category),
                    item.amount,
                    item.totalAmount
                  )
                )}
              </>
            )}

            {/* 3. Financial charges (pääomavastikkeet) */}
            {renderExpandableRow(
              "financialCharges",
              t("financialCharges"),
              financialAmount,
              financialTotal,
              <>
                {financialItems.map((item) =>
                  renderSubRow(
                    tExpenseType(item.category),
                    item.amount,
                    item.totalAmount
                  )
                )}
              </>
            )}

            {/* 4. Repair costs */}
            {renderExpandableRow(
              "repairCosts",
              t("repairCosts"),
              repairAmount,
              repairTotal,
              <>
                {repairItems.map((item) =>
                  renderSubRow(
                    tExpenseType(item.category),
                    item.amount,
                    item.totalAmount
                  )
                )}
              </>
            )}

            {/* 5. Other costs */}
            {renderExpandableRow(
              "otherCosts",
              t("otherCosts"),
              otherAmount,
              otherTotal,
              <>
                {otherItems.map((item) =>
                  renderSubRow(
                    tExpenseType(item.category),
                    item.amount,
                    item.totalAmount
                  )
                )}
                {taxDeductionBreakdown &&
                  taxDeductionBreakdown.map((item) => (
                    <TableRow key={`tax-${item.id}`}>
                      <TableCell sx={{ pl: 6 }}>
                        <Box>
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <Typography variant="body2" component="span">
                              {t(`deductionType.${item.typeName}`)}
                              {item.description && ` - ${item.description}`}
                            </Typography>
                            {onDeleteDeduction && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteDeduction(item.id);
                                }}
                                sx={{ ml: 0.5 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          {item.metadata && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="div"
                            >
                              {item.metadata.distanceKm &&
                                item.metadata.visits &&
                                item.metadata.ratePerKm && (
                                  <>
                                    {(item.metadata.distanceKm * 2).toFixed(1)}{" "}
                                    km × {item.metadata.visits} ×{" "}
                                    {item.metadata.ratePerKm.toFixed(2)} €/km
                                  </>
                                )}
                              {item.metadata.pricePerLaundry &&
                                item.metadata.visits &&
                                !item.metadata.distanceKm && (
                                  <>
                                    {item.metadata.visits} ×{" "}
                                    {item.metadata.pricePerLaundry.toFixed(2)} €
                                  </>
                                )}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      {showDualColumns && (
                        <TableCell align="right">
                          {formatCurrency(item.totalAmount)}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
              </>
            )}

            {/* Deductions Total */}
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>
                {t("deductionsTotal")}
              </TableCell>
              {showDualColumns && (
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(
                    (totalDeductions ?? deductions) + totalTaxDeductions
                  )}
                </TableCell>
              )}
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {formatCurrency(deductions + taxDeductions)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell colSpan={colSpan}>
                <Divider />
              </TableCell>
            </TableRow>

            {/* Depreciation Section */}
            {depreciation > 0 ||
            (depreciationBreakdown && depreciationBreakdown.length > 0) ? (
              <>
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    sx={{ bgcolor: "grey.50", fontWeight: "bold" }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      {t("depreciationSection")}
                      <InfoTooltip
                        title={t("depreciationInfoTitle")}
                        content={depreciationInfoContent}
                        variant="dialog"
                      />
                    </Box>
                  </TableCell>
                </TableRow>

                {hasNewDepreciationBreakdown
                  ? depreciationBreakdown.map((asset) => (
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
                              {formatCurrency(asset.originalAmount)} × 10% ={" "}
                              {formatCurrency(asset.depreciationAmount)}
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
                        {showDualColumns && (
                          <TableCell
                            align="right"
                            sx={{ verticalAlign: "top" }}
                          >
                            {formatCurrency(asset.totalDepreciationAmount)}
                          </TableCell>
                        )}
                        <TableCell align="right" sx={{ verticalAlign: "top" }}>
                          {formatCurrency(asset.depreciationAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  : breakdown
                      .filter((item) => item.isCapitalImprovement)
                      .map((item) => (
                        <TableRow key={item.category}>
                          <TableCell sx={{ pl: 4 }}>
                            {item.category} ({formatCurrency(item.amount)} ×
                            10%)
                          </TableCell>
                          {showDualColumns && (
                            <TableCell align="right">
                              {formatCurrency(
                                item.depreciationAmount ?? 0
                              )}
                            </TableCell>
                          )}
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
                  {showDualColumns && (
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {formatCurrency(totalDepreciation ?? depreciation)}
                    </TableCell>
                  )}
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {formatCurrency(depreciation)}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={colSpan}>
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
              {showDualColumns && (
                <TableCell
                  align="right"
                  sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
                >
                  {formatCurrency(totalNetIncome ?? netIncome)}
                </TableCell>
              )}
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
