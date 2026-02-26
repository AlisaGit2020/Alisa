import { VITE_BASE_URL } from '../constants';

export function getNumber(value: string, decimals: number): number {

    if (value === '0') {
        return 0;
    }

    if (!value) {
        return 0;
    }

    const floatNumber = parseFloat(value)
    if (floatNumber) {
        return parseFloat(floatNumber.toFixed(decimals));
    }
    return 0
}

/**
 * Converts a string to number, returning undefined for empty/whitespace strings.
 * Unlike getNumber() || undefined, this preserves 0 as a valid value.
 * Use this for optional numeric fields where 0 is meaningful (e.g., "no fee").
 */
export function getNumberOrUndefined(value: string, decimals: number): number | undefined {
    const trimmed = value.trim();
    if (trimmed === '') {
        return undefined;
    }
    return getNumber(value, decimals);
}

/**
 * Returns a properly formatted photo URL.
 * - External URLs (https://, http://) are returned as-is
 * - Local paths are prefixed with VITE_BASE_URL
 * - Empty/undefined paths return placeholder image
 */
export function getPhotoUrl(photoPath: string | undefined): string {
    const placeholder = '/assets/properties/placeholder.svg';

    if (!photoPath) {
        return placeholder;
    }

    // External URLs are returned as-is
    if (photoPath.startsWith('https://') || photoPath.startsWith('http://')) {
        return photoPath;
    }

    // Local paths are prefixed with base URL
    return `${VITE_BASE_URL}/${photoPath}`;
}
