import { Box, Stack, Typography } from '@mui/material';
import { KeyboardEvent, ReactNode, useLayoutEffect, useRef, useState } from 'react';
import AssetTextField from '../../asset/form/AssetTextField';
import DetailRow from './DetailRow';

export type EditableInputType = 'text' | 'number' | 'currency' | 'date' | 'multiline';

export interface EditableDetailRowProps {
  icon?: ReactNode;
  label: string;
  value: string | number | Date | null | undefined;
  editing: boolean;
  inputType: EditableInputType;
  onSave: (newValue: string | number | Date | null | undefined) => Promise<void> | void;
  format?: (value: EditableDetailRowProps['value']) => ReactNode;
  notSetLabel?: string;
  min?: number;
  max?: number;
  rows?: number;
  maxRows?: number;
  autoFocus?: boolean;
}

function isEmpty(value: EditableDetailRowProps['value']): boolean {
  return value === null || value === undefined || value === '';
}

function EditableDetailRow(props: EditableDetailRowProps) {
  const initial = String(props.value ?? '');
  const [draft, setDraft] = useState<string>(initial);
  const lastCommittedRef = useRef<string>(initial);
  const escPressedRef = useRef<boolean>(false);

  // Sync local draft when external value changes (e.g., after save) or when entering edit mode.
  // useLayoutEffect runs synchronously after DOM mutations but before paint, avoiding flicker.
  useLayoutEffect(() => {
    const next = String(props.value ?? '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(next);
    lastCommittedRef.current = next;
  }, [props.value, props.editing]);

  if (!props.editing) {
    const display = isEmpty(props.value)
      ? (props.notSetLabel ?? '—')
      : (props.format ? props.format(props.value) : String(props.value));
    return <DetailRow icon={props.icon} label={props.label} value={display} />;
  }

  const commit = async (raw: string) => {
    if (raw === lastCommittedRef.current) {
      return;
    }
    const previous = lastCommittedRef.current;
    lastCommittedRef.current = raw;
    try {
      await props.onSave(raw === '' ? null : raw);
    } catch {
      // Revert on failure (toast is shown by usePropertyFieldSave)
      lastCommittedRef.current = previous;
      setDraft(previous);
    }
  };

  const handleBlur = () => {
    if (escPressedRef.current) {
      escPressedRef.current = false;
      return;
    }
    void commit(draft);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && props.inputType !== 'multiline') {
      e.preventDefault();
      void commit(draft);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      escPressedRef.current = true;
      setDraft(lastCommittedRef.current);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }} onKeyDown={handleKeyDown}>
      {props.icon && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 1.5, minWidth: 20 }}>
          {props.icon}
        </Box>
      )}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 120, fontSize: '0.75rem' }}>
          {props.label}
        </Typography>
        <Box sx={{ flex: 1 }}>
          <AssetTextField
            label={props.label}
            value={draft}
            multiline={props.inputType === 'multiline'}
            rows={props.inputType === 'multiline' ? (props.rows ?? 4) : undefined}
            autoFocus={props.autoFocus !== false}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
          />
        </Box>
      </Stack>
    </Box>
  );
}

export default EditableDetailRow;
