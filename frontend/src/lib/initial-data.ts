import { User } from "@asset-types";
import { DataKey, View } from "@asset-lib/views.ts";
import { DATA_NOT_SELECTED_ID } from "@asset-lib/constants.ts";
import UserStorage from "@asset-lib/user-storage";

export const emptyUser: User = {
  firstName: "",
  lastName: "",
  email: "",
  language: "",
  photo: "",
  isAdmin: false,
  ownerships: [],
};

export const getInitialId = (view: View, dataKey: DataKey): number => {
  const key = `view[${view}]:${dataKey}`;
  const propertyId = UserStorage.getItem<number>(key);
  if (propertyId !== null) {
    return propertyId;
  }
  return DATA_NOT_SELECTED_ID;
};

export const setInitialPropertyId = (
  view: View,
  dataKey: DataKey,
  id: number,
): void => {
  const key = `view[${view}]:${dataKey}`;
  UserStorage.setItem(key, id);
};

export const getStoredFilter = <T>(view: View): T | null => {
  const key = `view[${view}]:${DataKey.FILTER}`;
  const stored = UserStorage.getItem<T>(key);
  if (stored) {
    // Convert date strings back to Date objects
    const parsed = stored as Record<string, unknown>;
    if (parsed.startDate) {
      parsed.startDate = new Date(parsed.startDate as string);
    }
    if (parsed.endDate) {
      parsed.endDate = new Date(parsed.endDate as string);
    }
    return parsed as T;
  }
  return null;
};

export const setStoredFilter = <T>(view: View, filter: T): void => {
  const key = `view[${view}]:${DataKey.FILTER}`;
  UserStorage.setItem(key, filter);
};

export const getTransactionPropertyId = (): number => {
  return getInitialId(View.TRANSACTION_PROPERTY, DataKey.PROPERTY_ID);
};

export const setTransactionPropertyId = (id: number): void => {
  setInitialPropertyId(View.TRANSACTION_PROPERTY, DataKey.PROPERTY_ID, id);
};
