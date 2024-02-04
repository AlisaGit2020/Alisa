
import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from '../../Title';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import { TFunction } from 'i18next';
import AlisaConfirmDialog from './dialog/AlisaConfirmDialog';
import DataService from '@alisa-lib/data-service';

interface AlisaDataTableField<T> {
  name: keyof T,
  format?: 'number' | 'currency' | 'date'
}

function AlisaDataTable<T extends { id: number }>(props: {
  t: TFunction,
  title: string,
  fields: AlisaDataTableField<T>[],
  dataService: DataService<T>,
  onNewRow: (event?: React.MouseEvent<HTMLButtonElement>) => void
  onEdit: (id:number) => void
}) {
  const [data, setData] = React.useState<T[]>([]);
  const [open, setOpen] = React.useState(false);
  const [idToDelete, setIdToDelete] = React.useState<number>(0);
  const [idDeleted, setIdDeleted] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchData = async () => {
      const data: T[] = await props.dataService.search();
      setData(data);
    };

    fetchData()
  }, [idDeleted, props.dataService])

  const handleClickOpen = (apartmentId: number) => {
    setIdToDelete(apartmentId);
    setOpen(true);
  };

  const handleClose = () => {
    setIdToDelete(0);
    setOpen(false);
  };

  const handleDelete = async () => {
    await props.dataService.delete(idToDelete);
    setIdDeleted(idToDelete);
    handleClose();
  };

  const getDataValue = (field: AlisaDataTableField<T>, dataItem: T): React.ReactNode => {
    const value = dataItem[field.name];

    if (typeof (value) === 'boolean') {
      return (<CheckIcon visibility={value ? 'visible' : 'hidden'}></CheckIcon>)
    }
    if (field.format == 'number') {
      return props.t('format.number', { val: value })
    }
    if (field.format == 'currency') {
      return props.t('format.currency.euro', { val: value })
    }
    if (field.format == 'date') {
      return props.t('format.date', {
        val: new Date(value as string), formatParams: {
          val: { year: 'numeric', month: 'numeric', day: 'numeric' },
        }
      })
    }

    return String(value);
  }

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <Title>{props.title}</Title>

      <Table size="small" aria-label="simple table">
        <TableHead>
          <TableRow>
            {props.fields.map((field) => (
              <TableCell key={field.name as string}>{props.t(field.name as string)}</TableCell>
            ))}
            <TableCell align='right'>
              <Tooltip title={props.t('add')}>
                <IconButton onClick={props.onNewRow}>
                  <AddIcon></AddIcon>
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        {(data.length > 0) && (
          <TableBody>

            {data.map((item) => (
              <TableRow key={item.id}>
                {props.fields.map((field) => (
                  <TableCell key={field.name as string}>
                    {getDataValue(field, item)}
                  </TableCell>
                ))}

                <TableCell align='right'>
                  <IconButton onClick={() => props.onEdit(item.id)}><EditIcon></EditIcon></IconButton>
                  <IconButton onClick={() => handleClickOpen(item.id)}><DeleteIcon></DeleteIcon></IconButton>
                </TableCell>
              </TableRow>
            ))}

          </TableBody>
        )}

      </Table>

      {(data.length == 0) && (
        <Box padding={2} fontSize={'medium'}>{props.t('noRowsFound')}</Box>
      )}

      <AlisaConfirmDialog
        title={props.t('confirm')}
        contentText={props.t('confirmDelete')}
        buttonTextConfirm={props.t('delete')}
        buttonTextCancel={props.t('cancel')}
        open={open}
        onConfirm={handleDelete}
        onClose={handleClose}
      ></AlisaConfirmDialog>

    </Paper>
  );

}

export default AlisaDataTable
