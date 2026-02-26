import { Box, Paper, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface PropertyInfoCardProps {
  title: string;
  children: ReactNode;
}

function PropertyInfoCard({ title, children }: PropertyInfoCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        height: '100%',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: '0.75rem',
          fontWeight: 500,
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Box>{children}</Box>
    </Paper>
  );
}

export default PropertyInfoCard;
