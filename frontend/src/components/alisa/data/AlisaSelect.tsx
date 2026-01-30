import axios from "axios";
import React, { ChangeEventHandler, useState } from "react";
import AlisaSelectField from "../form/AlisaSelectField.tsx";
import DataService from "@alisa-lib/data-service.ts";

interface InputProps<T1, T2 extends { id: number; name: string }> {
  onHandleChange: (fieldName: keyof T1, value: T1[keyof T1]) => void;
  label: string;
  fieldName: keyof T1;
  value: T1[keyof T1];
  dataService: DataService<T2>;
  size?: "small" | "medium";
  fullWidth?: boolean;
}

function AlisaSelect<T1, T2 extends { id: number; name: string }>({
  onHandleChange,
  label,
  fieldName,
  value,
  dataService,
  size,
  fullWidth,
}: InputProps<T1, T2>) {
  const [data, setData] = useState<T2[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        return await dataService.search();
      } catch (error) {
        handleApiError(error);
      }

      return data;
    };

    fetchData().then(setData);
  }, []);

  const handleChange:
    | ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
    | undefined = (e) => {
    const selectedValue = e.target.value as T1[keyof T1];
    onHandleChange(fieldName, selectedValue);
  };

  const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      /* empty */
    }
  };

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
      ></AlisaSelectField>
    );
  }
}

export default AlisaSelect;
