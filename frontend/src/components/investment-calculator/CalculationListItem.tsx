import { useTranslation } from 'react-i18next';
import {
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { SavedInvestmentCalculation } from './InvestmentCalculatorResults';
import { Property } from '@asset-types';
import { getPhotoUrl } from '@asset-lib/functions';

interface CalculationListItemProps {
  calculation: SavedInvestmentCalculation;
  property?: Property;
  isDragging?: boolean;
  isSelected?: boolean;
  showAvatar?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

function CalculationListItem({
  calculation,
  property,
  isDragging = false,
  isSelected = false,
  showAvatar = true,
  onClick,
  onDelete,
}: CalculationListItemProps) {
  const { t } = useTranslation(['investment-calculator', 'property', 'common']);

  const photoUrl = getPhotoUrl(property?.photo);
  const calcName = calculation.name || `#${calculation.id}`;

  // Build display name: when showAvatar is false (grouped under property), just show calculation name
  // When showAvatar is true (standalone), show "Street - Calculation" format
  const streetName = property?.address?.street;
  const displayName = showAvatar && streetName ? `${streetName} - ${calcName}` : calcName;
  const avatarAlt = streetName || t('investment-calculator:unlinkedProperty');

  return (
    <ListItem
      data-testid={`calculation-list-item-${calculation.id}`}
      onClick={onClick}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'pointer',
        pl: 2,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      {showAvatar && (
        <ListItemAvatar>
          <Avatar src={photoUrl} alt={avatarAlt}>
            {avatarAlt.charAt(0).toUpperCase()}
          </Avatar>
        </ListItemAvatar>
      )}
      {!showAvatar && (
        <ListItemIcon sx={{ minWidth: 36 }}>
          {isSelected ? (
            <CheckCircleIcon color="success" fontSize="small" />
          ) : (
            <span style={{ width: 20 }} />
          )}
        </ListItemIcon>
      )}
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
      {onDelete && (
        <ListItemSecondaryAction>
          <IconButton
            edge="end"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={t('common:delete')}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
}

export default CalculationListItem;
