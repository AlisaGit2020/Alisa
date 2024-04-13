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
