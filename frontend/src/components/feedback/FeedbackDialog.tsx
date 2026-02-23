import { Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import React from "react";
import { AssetButton, AssetDialog, AssetSelectField, AssetTextField, useAssetToast } from "../asset";
import ApiClient from "@asset-lib/api-client";

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'general';

interface FeedbackInput {
  message: string;
  type: FeedbackType;
  page?: string;
}

const FEEDBACK_TYPE_MAP: Record<number, FeedbackType> = {
  1: 'general',
  2: 'bug',
  3: 'feature',
};

export default function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useAssetToast();
  const [typeId, setTypeId] = React.useState<number>(1);
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const feedbackTypes = [
    { id: 1, name: t('common:feedback.typeGeneral') },
    { id: 2, name: t('common:feedback.typeBug') },
    { id: 3, name: t('common:feedback.typeFeature') },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const input: FeedbackInput = {
        message: message.trim(),
        type: FEEDBACK_TYPE_MAP[typeId],
        page: window.location.pathname,
      };
      await ApiClient.post('feedback', input);
      showToast({ message: t('common:feedback.thankYou'), severity: 'success' });
      setMessage('');
      setTypeId(1);
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      showToast({ message: t('common:toast.error'), severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const actions = (
    <>
      <AssetButton
        label={t('common:cancel')}
        variant="text"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <AssetButton
        label={t('common:feedback.submit')}
        variant="contained"
        onClick={handleSubmit}
        disabled={!message.trim() || isSubmitting}
      />
    </>
  );

  return (
    <AssetDialog
      open={open}
      onClose={handleClose}
      title={t('common:feedback.title')}
      maxWidth="sm"
      fullWidth
      actions={actions}
    >
      <Stack spacing={3} sx={{ py: 1 }}>
        <AssetSelectField
          label={t('common:feedback.typeLabel')}
          value={typeId}
          items={feedbackTypes}
          onChange={(e) => setTypeId(Number(e.target.value))}
          disabled={isSubmitting}
          fullWidth
        />
        <AssetTextField
          label={t('common:feedback.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          rows={4}
          disabled={isSubmitting}
        />
      </Stack>
    </AssetDialog>
  );
}
