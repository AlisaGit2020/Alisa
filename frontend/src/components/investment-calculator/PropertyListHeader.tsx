import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
} from '@mui/material';
import { Property } from '@asset-types';
import { getPhotoUrl } from '@asset-lib/functions';

interface PropertyListHeaderProps {
  property: Property;
}

function PropertyListHeader({ property }: PropertyListHeaderProps) {
  const photoUrl = getPhotoUrl(property.photo);
  const streetName = property.address?.street;
  const propertyName = property.name;

  // Primary: street address, Secondary: property name + city + size
  const displayName = streetName || propertyName || `Property ${property.id}`;
  const avatarAlt = displayName;

  // Secondary info: property name (without street), city, and size
  const city = property.address?.city;
  const size = property.size;
  const secondaryParts: string[] = [];
  // Only show property name if it doesn't start with the street (avoid duplication)
  if (propertyName && streetName && !propertyName.startsWith(streetName)) {
    secondaryParts.push(propertyName);
  } else if (propertyName && !streetName) {
    // No street, but has name - show nothing in secondary since name is in primary
  }
  if (city) secondaryParts.push(city);
  if (size) secondaryParts.push(`${size} m²`);
  const secondaryText = secondaryParts.join(' • ');

  return (
    <ListItem
      data-testid={`property-list-header-${property.id}`}
      sx={{
        backgroundColor: 'background.paper',
      }}
    >
      <ListItemAvatar>
        <Avatar src={photoUrl} alt={avatarAlt}>
          {avatarAlt.charAt(0).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="subtitle1" fontWeight="bold">
            {displayName}
          </Typography>
        }
        secondary={secondaryText || undefined}
      />
    </ListItem>
  );
}

export default PropertyListHeader;
