import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material"
import { TFunction } from "i18next"

interface AlisaConfirmDialogProps {
  open: boolean
  t: TFunction
  onHandleClose: () => void
  onHandleDelete: () => void
}

function AlisaConfirmDialog({ open, t, onHandleClose, onHandleDelete }: AlisaConfirmDialogProps) {


  return (
    <Dialog open={open} onClose={onHandleClose}>
      <DialogTitle>{t('confirm')}</DialogTitle>
      <DialogContent>
        <p>{t('confirmDelete')}</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={onHandleClose} color="primary">
          {t('cancel')}
        </Button>
        <Button onClick={onHandleDelete} color="primary">
          {t('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AlisaConfirmDialog