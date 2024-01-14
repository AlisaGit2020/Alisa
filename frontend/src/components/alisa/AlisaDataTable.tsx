
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
import getApiUrl from '../../functions';
import { Box, IconButton, Paper, Tooltip } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TFunction } from 'i18next';
import AlisaConfirmDialog from './AlisaConfirmDialog';
import { TypeOrmOrderOption, TypeOrmRelationOption } from '../../types/types';

interface AlisaDataTableField<T> {
  name: keyof T,
  format?: 'number' | 'currency'
}

interface AlisaDataTableInputProps<T> {
  t: TFunction
  title: string
  alisaContext: AlisaContext
  fields: AlisaDataTableField<T>[]
  fetchOptions?: {
    relations: TypeOrmRelationOption,
    where?: Partial<T>,
    order?: TypeOrmOrderOption
  }
}

function AlisaDataTable<T extends { id: number }>({ t, title, alisaContext, fields, fetchOptions: searchOptions }: AlisaDataTableInputProps<T>) {
  const [data, setData] = React.useState<T[]>([]);
  const [open, setOpen] = React.useState(false);
  const [apartmentIdToDelete, setApartmentIdToDelete] = React.useState(0);

  const navigate = useNavigate();

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const response = await axios.post(`${getApiUrl(alisaContext.apiPath)}/search`, searchOptions);
    const data: T[] = await response.data;
    setData(data);
  };

  const handleClickOpen = (apartmentId: number) => {
    setApartmentIdToDelete(apartmentId);
    setOpen(true);
  };

  const handleClose = () => {
    setApartmentIdToDelete(0);
    setOpen(false);
  };

  const handleDelete = async () => {
    await axios.delete(getApiUrl(`${alisaContext.apiPath}/${apartmentIdToDelete}`));
    fetchData();
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
