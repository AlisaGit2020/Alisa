import { useState, useRef, useEffect, ChangeEventHandler } from 'react';
import { Box, Typography, TextField, InputAdornment } from '@mui/material';

interface AssetEditableNumberProps {
  label: string;
  value: number;
  suffix?: string;
  readOnly?: boolean;
  step?: number;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

function AssetEditableNumber({
  label,
  value,
  suffix,
  readOnly = false,
  step,
  onChange,
}: AssetEditableNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!readOnly) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 0.5 }}
        >
          {label}
        </Typography>
        <TextField
          inputRef={inputRef}
          type="number"
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          size="small"
          fullWidth
          slotProps={{
            input: {
              endAdornment: suffix ? (
                <InputAdornment position="end">{suffix}</InputAdornment>
              ) : null,
            },
            htmlInput: step !== undefined ? { step } : undefined,
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      onClick={handleClick}
      sx={{
        cursor: readOnly ? 'default' : 'pointer',
        py: 1,
        '&:hover': readOnly ? {} : {
          backgroundColor: 'action.hover',
          borderRadius: 1,
        },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block' }}
      >
        {label}
      </Typography>
      <Typography variant="body1">
        {value}{suffix ? ` ${suffix}` : ''}
      </Typography>
    </Box>
  );
}

export default AssetEditableNumber;
