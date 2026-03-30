import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AssetTextField, AssetMoneyField } from '../asset';

interface CustomDeductionFormProps {
  description: string;
  amount: number;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: number) => void;
}

function CustomDeductionForm({
  description,
  amount,
  onDescriptionChange,
  onAmountChange,
}: CustomDeductionFormProps) {
  const { t } = useTranslation('tax');

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('description')} *
        </Typography>
        <AssetTextField
          label=""
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          fullWidth
          placeholder={t('description')}
        />
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('amount')} *
        </Typography>
        <AssetMoneyField
          label=""
          value={amount || ''}
          onChange={(value) => onAmountChange(value ?? 0)}
          fullWidth
        />
      </Box>
    </Stack>
  );
}

export default CustomDeductionForm;
