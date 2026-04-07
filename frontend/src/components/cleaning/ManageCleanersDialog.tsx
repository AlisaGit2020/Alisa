import { useEffect, useState, useCallback } from 'react';
import { Box, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import AssetDialog from '../asset/dialog/AssetDialog';
import AssetTextField from '../asset/form/AssetTextField';
import AssetButton from '../asset/form/AssetButton';
import ApiClient from '@asset-lib/api-client';
import { PropertyCleaner, User } from '@asset-types';

interface ManageCleanersDialogProps {
  open: boolean;
  propertyId: number;
  onClose: () => void;
}

export default function ManageCleanersDialog({ open, propertyId, onClose }: ManageCleanersDialogProps) {
  const { t } = useTranslation(['cleaning']);
  const [cleaners, setCleaners] = useState<(PropertyCleaner & { user: User })[]>([]);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchCleaners = useCallback(async () => {
    const data = await ApiClient.fetch<(PropertyCleaner & { user: User })[]>(
      `cleaning/property/${propertyId}/cleaners`,
    );
    setCleaners(data);
  }, [propertyId]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchCleaners();
      setShowCreateForm(false);
    }
  }, [open, fetchCleaners]);

  const handleCreateAndAssign = async () => {
    const user = await ApiClient.post<User>('cleaning/cleaners', { email, firstName, lastName } as unknown as User);
    await ApiClient.post(`cleaning/property/${propertyId}/cleaners`, { userId: user.id } as unknown as typeof undefined);
    setEmail('');
    setFirstName('');
    setLastName('');
    setShowCreateForm(false);
    fetchCleaners();
  };

  const handleRemove = async (userId: number) => {
    await ApiClient.delete(`cleaning/property/${propertyId}/cleaners`, userId);
    fetchCleaners();
  };

  return (
    <AssetDialog open={open} onClose={onClose} title={t('cleaning:manageCleaners')}>
      <Box sx={{ minWidth: 300 }}>
        {cleaners.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t('cleaning:noCleanersAssigned')}
          </Typography>
        ) : (
          <List>
            {cleaners.map((c) => (
              <ListItem
                key={c.userId}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemove(c.userId)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`${c.user.firstName} ${c.user.lastName}`}
                  secondary={c.user.email}
                />
              </ListItem>
            ))}
          </List>
        )}

        {showCreateForm ? (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {t('cleaning:createCleaner')}
            </Typography>
            <AssetTextField
              label={t('cleaning:email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AssetTextField
              label={t('cleaning:firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <AssetTextField
              label={t('cleaning:lastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <AssetButton label={t('cleaning:save')} onClick={handleCreateAndAssign} />
          </Box>
        ) : (
          <AssetButton
            label={t('cleaning:assignCleaner')}
            variant="outlined"
            onClick={() => setShowCreateForm(true)}
            sx={{ mt: 1 }}
          />
        )}
      </Box>
    </AssetDialog>
  );
}
