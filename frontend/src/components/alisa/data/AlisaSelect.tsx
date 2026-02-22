import React, { ChangeEventHandler, useState } from "react";
import AlisaSelectField from "../form/AlisaSelectField.tsx";
import DataService from "@alisa-lib/data-service.ts";
import { TFunction } from "i18next";

interface InputProps<T1, T2 extends { id: number; name: string; key?: string }> {
  onHandleChange: (fieldName: keyof T1, value: T1[keyof T1]) => void;
  label: string;
  fieldName: keyof T1;
  value: T1[keyof T1];
  dataService: DataService<T2>;
  size?: "small" | "medium";
  fullWidth?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  t?: TFunction;
  translateKeyPrefix?: string;
}

function AlisaSelect<T1, T2 extends { id: number; name: string; key?: string }>({
  onHandleChange,
  label,
  fieldName,
  value,
  dataService,
  size,
  fullWidth,
  disabled,
  error,
  helperText,
  t,
  translateKeyPrefix,
}: InputProps<T1, T2>) {
  const [data, setData] = useState<T2[]>([]);

  const handleChange:
    | ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined = (e) => {
    const selectedValue = e.target.value as T1[keyof T1];
    onHandleChange(fieldName, selectedValue);
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        return await dataService.search();
      } catch {
        // Ignore API errors
      }

      return data;
    };

    fetchData().then(setData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (data.length > 0) {
    const findItemById = (id: T1[keyof T1]) =>
      data.find((item) => item.id === id);

    const items = data;
    if (!findItemById(value)) {
      items.unshift({ id: Number(value), name: "" } as T2);
    }

    return (
      <AlisaSelectField
        value={Number(value)}
        label={label}
        items={items}
        onChange={handleChange}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        error={error}
        helperText={helperText}
        t={t}
        translateKeyPrefix={translateKeyPrefix}
      ></AlisaSelectField>
    );
  }
}

export default AlisaSelect;
