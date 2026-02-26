import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

/**
 * A reusable row component for displaying property details with an icon, label, and value.
 */
function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 2, minWidth: 24 }}>
        {icon}
      </Box>
      <Typography sx={{ color: 'text.secondary', minWidth: 150 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default DetailRow;
