import { Box, Paper, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface PropertyKpiCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: 'success.main' | 'error.main' | 'text.primary';
  iconColor?: string;
}

function PropertyKpiCard({
  icon,
  label,
  value,
  subtitle,
  valueColor = 'text.primary',
  iconColor = 'text.secondary',
}: PropertyKpiCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Box sx={{ color: iconColor, mr: 1, display: 'flex' }}>
          {icon}
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: '1.25rem',
          color: valueColor,
        }}
      >
        {value}
      </Typography>
      {subtitle && (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
        >
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

export default PropertyKpiCard;
