import { WithTranslation, withTranslation } from "react-i18next";
import { Box, Card, CardContent, Divider, Grid, Typography } from "@mui/material";
import { AlisaButton } from "../alisa";

// Base calculation results without database fields
export interface InvestmentResults {
  // Input fields (echoed back)
  deptFreePrice: number;
  deptShare: number;
  transferTaxPercent: number;
  maintenanceFee: number;
  chargeForFinancialCosts: number;
  rentPerMonth: number;
  apartmentSize?: number;
  waterCharge?: number;
  downPayment?: number;
  loanInterestPercent?: number;
  loanPeriod?: number;

  // Calculated fields - Purchase costs
  sellingPrice: number;
  transferTax: number;
  pricePerSquareMeter: number;

  // Calculated fields - Loan details
  loanFinancing: number;
  loanFirstMonthInstallment: number;
  loanFirstMonthInterest: number;

  // Calculated fields - Income & Expenses
  rentalIncomePerYear: number;
  maintenanceCosts: number;
  expensesPerMonth: number;

  // Calculated fields - Returns
  rentalYieldPercent: number;
  cashFlowPerMonth: number;
  cashFlowAfterTaxPerMonth: number;
  profitPerYear: number;
  taxPerYear: number;
  taxDeductibleExpensesPerYear: number;
}

// Saved calculation from database (includes id and name)
export interface SavedInvestmentCalculation extends InvestmentResults {
  id: number;
  name?: string;
}

interface InvestmentCalculatorResultsProps extends WithTranslation {
  results: InvestmentResults | null;
  onSave?: () => void;
  showSaveButton?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(2)} %`;
};

const getCashFlowColor = (value: number) => {
  if (value > 0) return 'success.main';
  if (value < 0) return 'error.main';
  return 'text.primary';
};

interface ResultItemProps {
  label: string;
  value: number;
  isPercent?: boolean;
  colorize?: boolean;
}

function ResultItem({ label, value, isPercent = false, colorize = false }: ResultItemProps) {
  return (
    <Grid size={{ xs: 12 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="body1"
          fontWeight="bold"
          color={colorize ? getCashFlowColor(value) : 'text.primary'}
        >
          {isPercent ? formatPercent(value) : formatCurrency(value)}
        </Typography>
      </Box>
    </Grid>
  );
}

function InvestmentCalculatorResults({ t, results, onSave, showSaveButton = true }: InvestmentCalculatorResultsProps) {
  if (!results) {
    return null;
  }

  return (
    <Box sx={{ mt: 4, maxWidth: 800 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('investment-calculator:title')}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Purchase Costs */}
          <Typography variant="subtitle1" gutterBottom fontWeight="medium" sx={{ mt: 2 }}>
            {t('investment-calculator:purchaseCosts')}
          </Typography>
          <Grid container spacing={2}>
            <ResultItem label={t('investment-calculator:sellingPrice')} value={results.sellingPrice} />
            <ResultItem label={t('investment-calculator:transferTax')} value={results.transferTax} />
            <ResultItem label={t('investment-calculator:pricePerSquareMeter')} value={results.pricePerSquareMeter} />
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Loan Details */}
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            {t('investment-calculator:loanDetails')}
          </Typography>
          <Grid container spacing={2}>
            <ResultItem label={t('investment-calculator:loanFinancing')} value={results.loanFinancing} />
            <ResultItem label={t('investment-calculator:loanFirstMonthInstallment')} value={results.loanFirstMonthInstallment} />
            <ResultItem label={t('investment-calculator:loanFirstMonthInterest')} value={results.loanFirstMonthInterest} />
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Income & Expenses */}
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            {t('investment-calculator:incomeAndExpenses')}
          </Typography>
          <Grid container spacing={2}>
            <ResultItem label={t('investment-calculator:rentalIncomePerYear')} value={results.rentalIncomePerYear} />
            <ResultItem label={t('investment-calculator:maintenanceCosts')} value={results.maintenanceCosts} />
            <ResultItem label={t('investment-calculator:expensesPerMonth')} value={results.expensesPerMonth} />
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Returns */}
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            {t('investment-calculator:returns')}
          </Typography>
          <Grid container spacing={2}>
            <ResultItem label={t('investment-calculator:rentalYieldPercent')} value={results.rentalYieldPercent} isPercent />
            <ResultItem label={t('investment-calculator:cashFlowPerMonth')} value={results.cashFlowPerMonth} colorize />
            <ResultItem label={t('investment-calculator:cashFlowAfterTaxPerMonth')} value={results.cashFlowAfterTaxPerMonth} colorize />
            <ResultItem label={t('investment-calculator:profitPerYear')} value={results.profitPerYear} colorize />
            <ResultItem label={t('investment-calculator:taxPerYear')} value={results.taxPerYear} />
            <ResultItem label={t('investment-calculator:taxDeductibleExpensesPerYear')} value={results.taxDeductibleExpensesPerYear} />
          </Grid>

          {showSaveButton && onSave && (
            <Box sx={{ mt: 3 }}>
              <AlisaButton
                label={t('investment-calculator:save')}
                onClick={onSave}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default withTranslation(['investment-calculator'])(InvestmentCalculatorResults);
