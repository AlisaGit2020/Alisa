import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Paper, Typography } from "@mui/material"
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { TFunction } from "i18next"
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function TransactionImport(props: {
    t: TFunction
    open: boolean
    onClose: () => void
}) {
    
    const onDrop = useCallback((acceptedFiles: any) => {
        // Tässä vaiheessa voit käsitellä tiedostot haluamallasi tavalla
        console.log(acceptedFiles);
    }, []);

    const { getInputProps } = useDropzone({
        onDrop,
        accept: undefined,
    });

    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            fullWidth={true}
            maxWidth={'lg'}>

            <DialogTitle>{props.t('importTitle')}</DialogTitle>
            <DialogContent dividers>
                <Paper                    
                    elevation={3}
                >
                    <input {...getInputProps()} />
                    <CloudUploadIcon />
                    <Typography variant="h6" component="div">
                        Drag & Drop or Click to Upload
                    </Typography>
                </Paper>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} variant="outlined" color="primary">
                    {props.t('cancel')}
                </Button>
                <Button onClick={() => alert('hallo')} variant="contained" color="primary">
                    {props.t('import')}
                </Button>
            </DialogActions>
        </Dialog>

    )
}

export default TransactionImport
