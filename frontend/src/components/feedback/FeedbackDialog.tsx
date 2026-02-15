import { Stack, MenuItem, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import React from "react";
import { AlisaButton, AlisaDialog, AlisaTextField, useToast } from "../alisa";
import ApiClient from "@alisa-lib/api-client";

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

export default function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [type, setType] = React.useState<FeedbackType>('general');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const feedbackTypes: { value: FeedbackType; label: string }[] = [
    { value: 'general', label: t('common:feedback.typeGeneral') },
    { value: 'bug', label: t('common:feedback.typeBug') },
    { value: 'feature', label: t('common:feedback.typeFeature') },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const input: FeedbackInput = {
        message: message.trim(),
        type,
        page: window.location.pathname,
      };
      await ApiClient.post('feedback', input);
      showToast({ message: t('common:feedback.thankYou'), severity: 'success' });
      setMessage('');
      setType('general');
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
      <AlisaButton
        label={t('common:cancel')}
        variant="text"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <AlisaButton
        label={t('common:feedback.submit')}
        variant="contained"
        onClick={handleSubmit}
        disabled={!message.trim() || isSubmitting}
      />
    </>
  );

  return (
    <AlisaDialog
      open={open}
      onClose={handleClose}
      title={t('common:feedback.title')}
      maxWidth="sm"
      fullWidth
      actions={actions}
    >
      <Stack spacing={3} sx={{ py: 1 }}>
        <TextField
          select
          fullWidth
          label={t('common:feedback.typeLabel')}
          value={type}
          onChange={(e) => setType(e.target.value as FeedbackType)}
          disabled={isSubmitting}
        >
          {feedbackTypes.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <AlisaTextField
          label={t('common:feedback.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          rows={4}
          disabled={isSubmitting}
        />
      </Stack>
    </AlisaDialog>
  );
}
