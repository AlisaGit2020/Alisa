import { Button, Dialog, DialogActions, DialogContent, DialogTitle, SxProps, Theme } from "@mui/material"

function AssetConfirmDialog(props: {
  open: boolean,
  title: string,
  contentText: string,
  buttonTextCancel: string,
  buttonTextConfirm: string,
  onConfirm: () => void
  onClose: () => void
  sx?: SxProps<Theme>
}) {

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      fullWidth={true}
      maxWidth={'xs'}
      sx={props.sx}>

      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent dividers>
        <p>{props.contentText}</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} variant="outlined" color="primary">
          {props.buttonTextCancel}
        </Button>
        <Button onClick={props.onConfirm} variant="contained" color="primary">
          {props.buttonTextConfirm}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AssetConfirmDialog