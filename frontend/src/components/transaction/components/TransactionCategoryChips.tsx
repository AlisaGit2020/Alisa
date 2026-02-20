import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { Transaction } from "@alisa-types";

interface TransactionCategoryChipsProps {
  transaction: Transaction;
}

function TransactionCategoryChips({
  transaction,
}: TransactionCategoryChipsProps) {
  const expenses = transaction.expenses || [];
  const incomes = transaction.incomes || [];

  const allCategories: string[] = [];

  expenses.forEach((expense) => {
    if (expense.expenseType?.name) {
      allCategories.push(expense.expenseType.name);
    }
  });

  incomes.forEach((income) => {
    if (income.incomeType?.name) {
      allCategories.push(income.incomeType.name);
    }
  });

  if (allCategories.length === 0) {
    return null;
  }

  const firstCategory = allCategories[0];
  const remainingCount = allCategories.length - 1;
  const tooltipText = allCategories.join(", ");

  const content = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography variant="body2" component="span" noWrap>
        {firstCategory}
      </Typography>
      {remainingCount > 0 && (
        <Chip
          label={`+${remainingCount}`}
          size="small"
          sx={{ height: 18, fontSize: "0.7rem", "& .MuiChip-label": { px: 0.75 } }}
        />
      )}
    </Box>
  );

  if (remainingCount > 0) {
    return (
      <Tooltip title={tooltipText} arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
}

export default TransactionCategoryChips;
