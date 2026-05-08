import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import ApiClient from '@asset-lib/api-client';
import { propertyContext } from '@asset-lib/asset-contexts';
import { Property } from '@asset-types';
import { useToast } from '../../asset';

export type PropertyFieldPatch = Partial<Property>;

export type SaveField = (patch: PropertyFieldPatch) => Promise<void>;

export function extractValidationMessage(err: unknown): string | null {
  const axiosErr = err as AxiosError<{ message?: string | string[] }>;
  const data = axiosErr.response?.data;
  if (!data?.message) return null;
  return Array.isArray(data.message) ? data.message.join('. ') : data.message;
}

export function usePropertyFieldSave(
  property: Property,
  onPropertyUpdated: (updated: Property) => void
): SaveField {
  const { t } = useTranslation('property');
  const { showToast } = useToast();

  return useCallback(
    async (patch: PropertyFieldPatch) => {
      const merged: Property = {
        ...property,
        ...patch,
        address: patch.address
          ? { ...(property.address ?? {}), ...patch.address }
          : property.address,
      } as Property;

      try {
        const updated = await ApiClient.put<Property>(
          propertyContext.apiPath,
          property.id,
          merged
        );
        onPropertyUpdated(updated);
      } catch (err) {
        const message = extractValidationMessage(err) ?? t('saveError');
        showToast({ message, severity: 'error' });
        throw err;
      }
    },
    [property, onPropertyUpdated, showToast, t]
  );
}
