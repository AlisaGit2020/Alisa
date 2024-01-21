
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
import { useNavigate } from 'react-router-dom';
import { TFunction } from 'i18next';
import AlisaConfirmDialog from './AlisaConfirmDialog';
import { TypeOrmFetchOptions } from '../../lib/types';
import ApiClient from '../../lib/api-client';

interface AlisaDataTableField<T> {
  name: keyof T,
  format?: 'number' | 'currency' | 'date'
}

interface AlisaDataTableInputProps<T> {
  t: TFunction
  title: string
  alisaContext: AlisaContext
  fields: AlisaDataTableField<T>[]
  fetchOptions?: TypeOrmFetchOptions<T>
}

function AlisaDataTable<T extends { id: number }>({ t, title, alisaContext, fields, fetchOptions }: AlisaDataTableInputProps<T>) {
  const [data, setData] = React.useState<T[]>([]);
  const [open, setOpen] = React.useState(false);
  const [idToDelete, setIdToDelete] = React.useState<number>(0);  
  const [idDeleted, setIdDeleted] = React.useState<number>(0);  
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchData = async () => {    
      const data: T[] = await ApiClient.search<T>(alisaContext.apiPath, fetchOptions);
      setData(data);
    };

    fetchData()
  }, [idDeleted])

  const handleClickOpen = (apartmentId: number) => {
    setIdToDelete(apartmentId);
    setOpen(true);
  };

  const handleClose = () => {
    setIdToDelete(0);
    setOpen(false);
  };

  const handleDelete = async () => {    
    await ApiClient.delete(alisaContext.apiPath, idToDelete);
    setIdDeleted(idToDelete);
    handleClose();
  };

  const getDataValue = (field: AlisaDataTableField<T>, dataItem: T): React.ReactNode => {
    const value = dataItem[field.name];

    if (typeof (value) === 'boolean') {
      return (<CheckIcon visibility={value ? 'visible' : 'hidden'}></CheckIcon>)
    }
    if (field.format == 'number') {
      return t('format.number', { val: value })
    }
    if (field.format == 'currency') {
      return t('format.currency.euro', { val: value })
    }
    if (field.format == 'date') {         
      return t('format.date', { val: new Date(value as string), formatParams: {
        val: { year: 'numeric', month: 'numeric', day: 'numeric' },
      } })
    }

    return String(value);
  }

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <Title>{title}</Title>

      <Table size="small" aria-label="simple table">
        <TableHead>
          <TableRow>
            {fields.map((field) => (
              <TableCell key={field.name as string}>{t(field.name as string)}</TableCell>
            ))}
            <TableCell align='right'>
              <Tooltip title={t('add')}>
                <IconButton href={`${alisaContext.routePath}/add`}>
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
                {fields.map((field) => (
                  <TableCell key={field.name as string}>
                    {getDataValue(field, item)}
                  </TableCell>
                ))}

                <TableCell align='right'>
                  <IconButton onClick={() => navigate(`edit/${item.id}`)}><EditIcon></EditIcon></IconButton>
                  <IconButton onClick={() => handleClickOpen(item.id)}><DeleteIcon></DeleteIcon></IconButton>
                </TableCell>
              </TableRow>
            ))}

          </TableBody>
        )}

      </Table>

      {(data.length == 0) && (
        <Box padding={2} fontSize={'medium'}>{t('noRowsFound')}</Box>
      )}

      <AlisaConfirmDialog 
        t={t}
        open={open}
        onHandleClose={handleClose}
        onHandleDelete={handleDelete}
      ></AlisaConfirmDialog>

    </Paper>
  );

}

export default AlisaDataTable
