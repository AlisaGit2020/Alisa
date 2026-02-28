import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
} from '@mui/material';
import { SavedInvestmentCalculation } from './InvestmentCalculatorResults';
import { Property } from '@asset-types';
import { getPhotoUrl } from '@asset-lib/functions';

interface CalculationListItemProps {
  calculation: SavedInvestmentCalculation;
  property?: Property;
  isDragging?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

function CalculationListItem({
  calculation,
  property,
  isDragging = false,
  isSelected = false,
  onClick,
}: CalculationListItemProps) {
  const { t } = useTranslation(['investment-calculator', 'property']);

  const propertyName = property?.name || t('investment-calculator:unlinkedProperty');
  const photoUrl = getPhotoUrl(property?.photo);

  return (
    <ListItem
      data-testid={`calculation-list-item-${calculation.id}`}
      onClick={onClick}
      className={isSelected ? 'Mui-selected' : ''}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        '&.Mui-selected': {
          backgroundColor: 'action.selected',
        },
      }}
    >
      <ListItemAvatar>
        <Avatar src={photoUrl} alt={propertyName}>
          {propertyName.charAt(0).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" color="text.secondary">
              {propertyName}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {calculation.name || `#${calculation.id}`}
            </Typography>
          </Box>
        }
        secondary={
          <Typography variant="body2" color="text.secondary">
            {t('investment-calculator:rentalYield')}: {calculation.rentalYieldPercent?.toFixed(2) ?? '0.00'}%
          </Typography>
        }
      />
    </ListItem>
  );
}

export default CalculationListItem;
