
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
import { Box, Button, Card, CardActions, CardContent, CardMedia, Grid, IconButton, Link, Paper, Tooltip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { TFunction } from 'i18next';
import AlisaConfirmDialog from './AlisaConfirmDialog';
import { TypeOrmFetchOptions } from '../../lib/types';
import ApiClient from '../../lib/api-client';

interface AlisCardListField<T> {
  name: keyof T,
  format?: 'number' | 'currency' | 'date'
}

interface AlisaCardListInputProps<T> {
  t: TFunction
  title: string
  alisaContext: AlisaContext
  fields: AlisCardListField<T>[]
  fetchOptions?: TypeOrmFetchOptions<T>
}

function AlisaCardList<T extends { id: number }>({ t, title, alisaContext, fields, fetchOptions }: AlisaCardListInputProps<T>) {
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

  const getDataValue = (field: AlisCardListField<T>, dataItem: T): React.ReactNode => {
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
      return t('format.date', {
        val: new Date(value as string), formatParams: {
          val: { year: 'numeric', month: 'numeric', day: 'numeric' },
        }
      })
    }

    return String(value);
  }

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <Title>{title}</Title>
      <Link href={'/apartments/add'}>{t('add')}</Link>
      {(data.length > 0) && (
        <Grid container spacing={2} marginTop={2}>
          {data.map((item) => (
            <Grid item md={4}>
              <Card >

                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {item.name}
                  </Typography>
                  <CardMedia
                  component="img"
                  alt={item.name}
                  height="140"
                  image={`/assets/apartments/${item.name}.jpg`}
                />
                  <Typography variant="body2" color="text.secondary">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>{t('size')}</TableCell>
                          <TableCell align='right'>{item.size} m2</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec condimentum nisl.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`edit/${item.id}`)}><IconButton >
                    <EditIcon></EditIcon></IconButton>{t('edit')}
                  </Button>
                  <Button size="small" onClick={() => handleClickOpen(item.id)}><IconButton >
                    <DeleteIcon></DeleteIcon></IconButton>{t('delete')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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

export default AlisaCardList
