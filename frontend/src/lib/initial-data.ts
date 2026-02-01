import { User } from "@alisa-backend/people/user/entities/user.entity";
import { DataKey, View } from "@alisa-lib/views.ts";
import { DATA_NOT_SELECTED_ID } from "@alisa-lib/constants.ts";

export const emptyUser: User = {
  firstName: "",
  lastName: "",
  email: "",
  language: "",
  photo: "",
  ownerships: [],
};

export const getInitialId = (view: View, dataKey: DataKey): number => {
  //Look if localstorage contains property id for view
  const key = `view[${view}]:${dataKey}`;
  const propertyId = localStorage.getItem(key);
  if (propertyId) {
    return parseInt(propertyId);
  }
  return DATA_NOT_SELECTED_ID;
};

export const setInitialPropertyId = (
  view: View,
  dataKey: DataKey,
  id: number,
): void => {
  const key = `view[${view}]:${dataKey}`;
  localStorage.setItem(key, id.toString());
};

export const getStoredFilter = <T>(view: View): T | null => {
  const key = `view[${view}]:${DataKey.FILTER}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      if (parsed.startDate) {
        parsed.startDate = new Date(parsed.startDate);
      }
      if (parsed.endDate) {
        parsed.endDate = new Date(parsed.endDate);
      }
      return parsed as T;
    } catch {
      return null;
    }
  }
  return null;
};

export const setStoredFilter = <T>(view: View, filter: T): void => {
  const key = `view[${view}]:${DataKey.FILTER}`;
  localStorage.setItem(key, JSON.stringify(filter));
};

export const getTransactionPropertyId = (): number => {
  return getInitialId(View.TRANSACTION_PROPERTY, DataKey.PROPERTY_ID);
};

export const setTransactionPropertyId = (id: number): void => {
  setInitialPropertyId(View.TRANSACTION_PROPERTY, DataKey.PROPERTY_ID, id);
};
