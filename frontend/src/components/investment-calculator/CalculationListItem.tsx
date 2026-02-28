import { useTranslation } from 'react-i18next';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
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

  const photoUrl = getPhotoUrl(property?.photo);
  const calcName = calculation.name || `#${calculation.id}`;

  // Build display name: "Street - Calculation" when property linked, just calculation name otherwise
  const streetName = property?.address?.street;
  const displayName = streetName ? `${streetName} - ${calcName}` : calcName;
  const avatarAlt = streetName || t('investment-calculator:unlinkedProperty');

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
        <Avatar src={photoUrl} alt={avatarAlt}>
          {avatarAlt.charAt(0).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="body1" fontWeight="medium">
            {displayName}
          </Typography>
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
