import { ReactNode } from 'react';
import DetailRow from './DetailRow';

export type EditableInputType = 'text' | 'number' | 'currency' | 'date' | 'multiline';

export interface EditableDetailRowProps {
  icon?: ReactNode;
  label: string;
  value: string | number | Date | null | undefined;
  editing: boolean;
  inputType: EditableInputType;
  onSave: (newValue: string | number | Date | null | undefined) => Promise<void> | void;
  format?: (value: string | number | Date | null | undefined) => ReactNode;
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
  if (!props.editing) {
    const display = isEmpty(props.value)
      ? (props.notSetLabel ?? '—')
      : (props.format ? props.format(props.value) : String(props.value));
    return <DetailRow icon={props.icon} label={props.label} value={display} />;
  }

  // Edit modes implemented in subsequent tasks.
  return <DetailRow icon={props.icon} label={props.label} value={String(props.value ?? '')} />;
}

export default EditableDetailRow;
