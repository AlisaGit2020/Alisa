import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface DetailRowProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}

/**
 * A compact row component for displaying property details with optional icon.
 */
function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
      {icon && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 1.5, minWidth: 20 }}>
          {icon}
        </Box>
      )}
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          minWidth: 120,
          fontSize: '0.75rem',
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          fontSize: '0.875rem',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default DetailRow;
