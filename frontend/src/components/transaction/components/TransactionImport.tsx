import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField } from "@mui/material"
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { TFunction } from "i18next"
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import AlisaSelect from "../../alisa/AlisaSelect";
import { OpImportInput } from "@alisa-backend/import/op/dtos/op-import-input.dto";
import DataService from "@alisa-lib/data-service";
import { ExpenseType } from "@alisa-backend/accounting/expense/entities/expense-type.entity";
import { apartmentContext, expenseTypeContext, incomeTypeContext, opImportContext } from "@alisa-lib/alisa-contexts";
import { IncomeType } from "@alisa-backend/accounting/income/entities/income-type.entity";
import { Property } from "@alisa-backend/real-estate/property/entities/property.entity";

function TransactionImport(props: {
    t: TFunction
    open: boolean
    propertyId: number
    onClose: () => void
}) {
    const initialData = new OpImportInput()
    initialData.propertyId = props.propertyId;
    const [data, setData] = useState<OpImportInput>(initialData)

    const dataService = new DataService<OpImportInput>({
        context: opImportContext
    })

    const onDrop = useCallback((acceptedFiles: any) => {
        // Tässä vaiheessa voit käsitellä tiedostot haluamallasi tavalla
        console.log(acceptedFiles);
    }, []);

    const { getInputProps } = useDropzone({
        onDrop,
        accept: undefined,
    });

    const handleChange = async (
        name: string,
        value: unknown
    ) => {

        const newData = dataService.updateNestedData(data, name, value);
        setData(newData);
    }

    const handleSubmit = async() => {
        dataService.save(data)
    }

    return (
        <Dialog
            open={props.open}
            onClose={props.onClose}
            fullWidth={true}
            maxWidth={'lg'}>

            <DialogTitle>{props.t('importTitle')} <CloudUploadIcon></CloudUploadIcon></DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} marginBottom={2}>
                    <AlisaSelect<OpImportInput, Property>
                        label={props.t('apartment')}
                        dataService={new DataService<Property>({
                            context: apartmentContext,
                            fetchOptions: { order: { name: 'ASC' } }
                        })}
                        fieldName='propertyId'
                        value={data.propertyId}
                        onHandleChange={handleChange}
                    >
                    </AlisaSelect>
                    <AlisaSelect<OpImportInput, ExpenseType>
                        label={props.t('expenseType')}
                        dataService={new DataService<ExpenseType>({
                            context: expenseTypeContext,
                            fetchOptions: { order: { name: 'ASC' } }
                        })}
                        fieldName='expenseTypeId'
                        value={data.expenseTypeId}
                        onHandleChange={handleChange}
                    >
                    </AlisaSelect>
                    <AlisaSelect<OpImportInput, IncomeType>
                        label={props.t('incomeType')}
                        dataService={new DataService<IncomeType>({
                            context: incomeTypeContext,
                            fetchOptions: { order: { name: 'ASC' } }
                        })}
                        fieldName='incomeTypeId'
                        value={data.incomeTypeId}
                        onHandleChange={handleChange}
                    >
                    </AlisaSelect>
                    <TextField
                        type={'file'}
                        onChange={(e) => handleChange('file', e.target.files[0])}
                    ></TextField>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose} variant="outlined" color="primary">
                    {props.t('cancel')} 
                </Button>
                <Button 
                onClick={() => handleSubmit()} 
                variant="contained" 
                startIcon={<CloudUploadIcon></CloudUploadIcon>}
                color="primary">
                    {props.t('import')}
                </Button>
            </DialogActions>
        </Dialog>

    )
}

export default TransactionImport
