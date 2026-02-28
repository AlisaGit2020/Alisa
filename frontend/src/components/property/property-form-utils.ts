import { PropertyStatus } from '@asset-types/common';

const ROUTE_PROSPECT = 'prospects';
const ROUTE_SOLD = 'sold';
const BASE_PATH = '/app/portfolio';

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

/**
 * Returns the route prefix segment based on the property status.
 * Used for constructing view/edit paths.
 */
export function getRouteSegmentForStatus(status: PropertyStatus): string {
  if (status === PropertyStatus.PROSPECT) {
    return ROUTE_PROSPECT;
  }
  if (status === PropertyStatus.SOLD) {
    return ROUTE_SOLD;
  }
  return 'own';
}

/**
 * Returns the view path for a specific property.
 * Used for navigation to property detail view.
 */
export function getPropertyViewPath(status: PropertyStatus, propertyId: number | string): string {
  const segment = getRouteSegmentForStatus(status);
  return `${BASE_PATH}/${segment}/${propertyId}`;
}
