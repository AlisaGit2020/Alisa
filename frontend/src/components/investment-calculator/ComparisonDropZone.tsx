import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import {
  SavedInvestmentCalculation,
  CalculationWithProperty,
} from './InvestmentCalculatorResults';
import InvestmentComparisonTable from '../property/sections/InvestmentComparisonTable';

interface ComparisonDropZoneProps {
  calculations: CalculationWithProperty[];
  onRemove: (id: number) => void;
  onUpdate: (calculation: SavedInvestmentCalculation) => void;
  isDragOver?: boolean;
}

function ComparisonDropZone({
  calculations,
  onRemove,
  onUpdate,
  isDragOver = false,
}: ComparisonDropZoneProps) {
  const { t } = useTranslation(['investment-calculator']);

  const safeCalculations = calculations || [];
  const isEmpty = safeCalculations.length === 0;

  return (
    <Box
      data-testid="comparison-drop-zone"
      role="region"
      aria-label={t('investment-calculator:comparison')}
      className={isDragOver ? 'drag-over' : ''}
      sx={{
        border: '2px dashed',
        borderColor: isDragOver ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 3,
        minHeight: 200,
        backgroundColor: isDragOver ? 'action.hover' : 'background.paper',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {isEmpty ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 150,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('investment-calculator:clickToAddToComparison')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('investment-calculator:emptyComparisonMessage')}
          </Typography>
        </Box>
      ) : (
        <InvestmentComparisonTable
          calculations={safeCalculations}
          onUpdate={onUpdate}
          onDelete={onRemove}
          removeMode="immediate"
        />
      )}
    </Box>
  );
}

export default ComparisonDropZone;
