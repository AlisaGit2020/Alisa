import { Box, Paper, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface PropertyInfoCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

function PropertyInfoCard({ title, children, action }: PropertyInfoCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {title}
        </Typography>
        {action}
      </Box>
      <Box>{children}</Box>
    </Paper>
  );
}

export default PropertyInfoCard;
