import { Box, Card, CardContent, Typography } from '@mui/material';
import { Property, PropertyStatus } from '@asset-types';
import OwnPropertyCardContent from './OwnPropertyCardContent';
import ProspectPropertyCardContent from './ProspectPropertyCardContent';
import SoldPropertyCardContent from './SoldPropertyCardContent';

interface PropertyCardProps {
  property: Property;
}

/**
 * Main property card component that delegates to status-specific content.
 * Displays common property info (name, address, size, rooms, build year)
 * and delegates status-specific fields to child components.
 */
function PropertyCard({ property }: PropertyCardProps) {
  const { address, size, rooms, buildYear } = property;

  const renderStatusContent = () => {
    switch (property.status) {
      case PropertyStatus.OWN:
        return <OwnPropertyCardContent property={property} />;
      case PropertyStatus.PROSPECT:
        return <ProspectPropertyCardContent property={property} />;
      case PropertyStatus.SOLD:
        return <SoldPropertyCardContent property={property} />;
      default:
        return null;
    }
  };

  const formatAddress = () => {
    const parts: string[] = [];
    if (address?.street) parts.push(address.street);
    if (address?.city) parts.push(address.city);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const addressDisplay = formatAddress();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Property Name */}
        <Typography variant="h6" component="div" gutterBottom>
          {property.name}
        </Typography>

        {/* Address */}
        {addressDisplay && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {addressDisplay}
          </Typography>
        )}

        {/* Property Details */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
          {size !== undefined && size > 0 && (
            <Typography variant="body2" color="text.secondary">
              {size} m²
            </Typography>
          )}
          {rooms && (
            <Typography variant="body2" color="text.secondary">
              {rooms}
            </Typography>
          )}
          {buildYear && (
            <Typography variant="body2" color="text.secondary">
              {buildYear}
            </Typography>
          )}
        </Box>

        {/* Status-specific Content */}
        {renderStatusContent()}
      </CardContent>
    </Card>
  );
}

export default PropertyCard;
