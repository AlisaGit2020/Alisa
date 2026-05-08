import { Box, Stack, Typography } from '@mui/material';
import { KeyboardEvent, ReactNode, useLayoutEffect, useRef, useState } from 'react';
import AssetTextField from '../../asset/form/AssetTextField';
import AssetNumberField from '../../asset/form/AssetNumberField';
import AssetMoneyField from '../../asset/form/AssetMoneyField';
import AssetDatePicker from '../../asset/form/AssetDatePicker';
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
  required?: boolean;
}

function isEmpty(value: EditableDetailRowProps['value']): boolean {
  return value === null || value === undefined || value === '';
}

function coerceDate(value: EditableDetailRowProps['value']): Date | null {
  if (value instanceof Date) return value;
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(value as string | number);
  return isNaN(parsed.getTime()) ? null : parsed;
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
    if (raw === '' && props.required) {
      // Required field cleared — revert silently rather than save null.
      setDraft(lastCommittedRef.current);
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
      // Defer to the input's own onBlur, which dispatches to the correct
      // type-specific save logic (text uses commit(draft); number/currency
      // parse before saving). Calling commit() here would always save the
      // raw string, even for numeric types.
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      escPressedRef.current = true;
      setDraft(lastCommittedRef.current);
      (e.target as HTMLInputElement).blur();
    }
  };

  const renderInput = () => {
    switch (props.inputType) {
      case 'number': {
        const numericValue: number | '' = draft === '' ? '' : Number(draft);
        return (
          <AssetNumberField
            label={props.label}
            value={Number.isNaN(numericValue) ? '' : numericValue}
            autoFocus={props.autoFocus === true}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (escPressedRef.current) { escPressedRef.current = false; return; }
              if (draft === '') {
                if (lastCommittedRef.current === '') return;
                if (props.required) {
                  setDraft(lastCommittedRef.current);
                  return;
                }
                const previous = lastCommittedRef.current;
                lastCommittedRef.current = '';
                void (async () => {
                  try { await props.onSave(null); }
                  catch { lastCommittedRef.current = previous; setDraft(previous); }
                })();
                return;
              }
              const parsed = Number(draft);
              if (Number.isNaN(parsed)) return;
              if (String(parsed) === lastCommittedRef.current) return;
              const previous = lastCommittedRef.current;
              lastCommittedRef.current = String(parsed);
              void (async () => {
                try { await props.onSave(parsed); }
                catch { lastCommittedRef.current = previous; setDraft(previous); }
              })();
            }}
          />
        );
      }
      case 'currency': {
        const moneyValue: number | '' = draft === '' ? '' : Number(draft);
        return (
          <AssetMoneyField
            label={props.label}
            value={Number.isNaN(moneyValue) ? '' : moneyValue}
            autoFocus={props.autoFocus === true}
            onChange={(v) => setDraft(v === undefined ? '' : String(v))}
            onBlur={() => {
              if (escPressedRef.current) { escPressedRef.current = false; return; }
              const next = draft === '' ? null : Number(draft);
              if (next !== null && Number.isNaN(next)) return;
              const nextStr = next === null ? '' : String(next);
              if (nextStr === lastCommittedRef.current) return;
              const previous = lastCommittedRef.current;
              lastCommittedRef.current = nextStr;
              void (async () => {
                try { await props.onSave(next); }
                catch { lastCommittedRef.current = previous; setDraft(previous); }
              })();
            }}
          />
        );
      }
      case 'date': {
        const dateValue = coerceDate(props.value);
        return (
          <AssetDatePicker
            label={props.label}
            value={dateValue}
            autoFocus={props.autoFocus === true}
            onChange={(value) => {
              const next = value ? value.toDate() : null;
              const nextIso = next ? next.toISOString() : '';
              if (nextIso === lastCommittedRef.current) return;
              const previous = lastCommittedRef.current;
              lastCommittedRef.current = nextIso;
              void (async () => {
                try { await props.onSave(next); }
                catch { lastCommittedRef.current = previous; }
              })();
            }}
          />
        );
      }
      case 'multiline':
      case 'text':
      default:
        return (
          <AssetTextField
            label={props.label}
            value={draft}
            multiline={props.inputType === 'multiline'}
            rows={props.inputType === 'multiline' ? (props.rows ?? 4) : undefined}
            autoFocus={props.autoFocus === true}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
          />
        );
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
        <Box sx={{ flex: 1 }}>{renderInput()}</Box>
      </Stack>
    </Box>
  );
}

export default EditableDetailRow;
