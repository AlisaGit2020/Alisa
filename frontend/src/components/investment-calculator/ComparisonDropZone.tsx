import { useTranslation } from 'react-i18next';
import { Box, Typography, IconButton, Chip, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SavedInvestmentCalculation } from './InvestmentCalculatorResults';
import { Property } from '@asset-types';
import InvestmentComparisonTable from '../property/sections/InvestmentComparisonTable';

// Extended calculation type that includes optional property info
interface CalculationWithProperty extends SavedInvestmentCalculation {
  property?: Property;
}

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

  const handleDelete = (id: number) => {
    onRemove(id);
  };

  // Build display name: "Street - Calculation" when property linked, just calculation name otherwise
  const getDisplayName = (calc: CalculationWithProperty) => {
    const calcName = calc.name || `#${calc.id}`;
    const streetName = calc.property?.address?.street;
    return streetName ? `${streetName} - ${calcName}` : calcName;
  };

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
            {t('investment-calculator:dropHereToCompare')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('investment-calculator:emptyComparisonMessage')}
          </Typography>
        </Box>
      ) : (
        <Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {safeCalculations.map((calc) => (
              <Chip
                key={calc.id}
                label={getDisplayName(calc)}
                onDelete={() => handleDelete(calc.id)}
                deleteIcon={
                  <IconButton
                    size="small"
                    aria-label={`${t('investment-calculator:removeFromComparison')} ${getDisplayName(calc)}`}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                }
                sx={{ m: 0.5 }}
              />
            ))}
          </Stack>
          <InvestmentComparisonTable
            calculations={safeCalculations}
            onUpdate={onUpdate}
            onDelete={handleDelete}
          />
        </Box>
      )}
    </Box>
  );
}

export default ComparisonDropZone;
