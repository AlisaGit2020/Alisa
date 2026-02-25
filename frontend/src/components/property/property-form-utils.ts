import { PropertyStatus } from '@asset-types/common';

const ROUTE_PROSPECT = 'prospects';
const ROUTE_SOLD = 'sold';
const BASE_PATH = '/app/portfolio/properties';

/**
 * Determines the PropertyStatus based on the current URL path.
 * Used to set the correct status when adding/editing properties from different tabs.
 */
export function getPropertyStatusFromPath(pathname: string): PropertyStatus {
  if (pathname.includes(`/${ROUTE_PROSPECT}/`)) {
    return PropertyStatus.PROSPECT;
  }
  if (pathname.includes(`/${ROUTE_SOLD}/`)) {
    return PropertyStatus.SOLD;
  }
  return PropertyStatus.OWN;
}

/**
 * Returns the appropriate list path based on the property status.
 * Used for navigation after save/cancel.
 */
export function getReturnPathForStatus(status: PropertyStatus): string {
  if (status === PropertyStatus.PROSPECT) {
    return `${BASE_PATH}/${ROUTE_PROSPECT}`;
  }
  if (status === PropertyStatus.SOLD) {
    return `${BASE_PATH}/${ROUTE_SOLD}`;
  }
  return `${BASE_PATH}/own`;
}
