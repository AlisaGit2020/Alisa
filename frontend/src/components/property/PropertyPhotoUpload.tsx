import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { AlisaButton } from '../alisa';
import axios from 'axios';
import ApiClient from '@alisa-lib/api-client';
import { VITE_API_URL } from '../../constants';

interface PropertyPhotoUploadProps {
  propertyId: number;
  currentPhoto?: string;
  onPhotoChange?: (photoPath: string | null) => void;
}

const PropertyPhotoUpload: React.FC<PropertyPhotoUploadProps> = ({
  propertyId,
  currentPhoto,
  onPhotoChange,
}) => {
  const { t } = useTranslation('property');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | undefined>(currentPhoto);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(t('photoInvalidType'));
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(t('photoTooLarge'));
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const options = await ApiClient.getOptions({
        'Content-Type': 'multipart/form-data',
      });

      const response = await axios.post(
        `${VITE_API_URL}/real-estate/property/${propertyId}/photo`,
        formData,
        options
      );

      const newPhotoPath = response.data.photo;
      setPhotoPath(newPhotoPath);
      onPhotoChange?.(newPhotoPath);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || t('photoUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!photoPath) return;

    setUploading(true);
    setError(null);

    try {
      const options = await ApiClient.getOptions();
      await axios.delete(
        `${VITE_API_URL}/real-estate/property/${propertyId}/photo`,
        options
      );

      setPhotoPath(undefined);
      onPhotoChange?.(null);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || t('photoDeleteError'));
    } finally {
      setUploading(false);
    }
  };

  const photoUrl = photoPath
    ? `${VITE_API_URL}/${photoPath}`
    : '/assets/properties/placeholder.svg';

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t('propertyPhoto')}
      </Typography>

      <Stack spacing={2}>
        {/* Photo Preview */}
        <Box
          sx={{
            width: '100%',
            height: 200,
            backgroundImage: `url(${photoUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />

        {/* Error Message */}
        {error && <Alert severity="error">{error}</Alert>}

        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <AlisaButton
            label={t('uploadPhoto')}
            component="label"
            loading={uploading}
            startIcon={<CloudUploadIcon />}
          >
            <input
              type="file"
              hidden
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
            />
          </AlisaButton>

          {photoPath && (
            <AlisaButton
              label={t('deletePhoto')}
              variant="outlined"
              color="error"
              disabled={uploading}
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            />
          )}
        </Stack>

        {/* Help Text */}
        <Typography variant="caption" color="text.secondary">
          {t('photoHelpText')}
        </Typography>
      </Stack>
    </Box>
  );
};

export default PropertyPhotoUpload;
